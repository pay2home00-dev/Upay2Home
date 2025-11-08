// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { generateUniqueUserId } from "@/lib/generate-user-id";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      userId: string;
      image: string | undefined;
    };
  }
  interface User {
    role: string;
    userId: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as any,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        try {
          // Basic debug - will show in server logs when NEXTAUTH_DEBUG=true
          console.log("Credentials.authorize called", { credentials });

          // Validate input shape
          const parsed = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);
          if (!parsed.success) {
            console.warn("Credentials.authorize: invalid payload", { credentials });
            return null;
          }

          const { email, password } = parsed.data;

          // Lookup user
          const user = await db.user.findUnique({ where: { email } });
          if (!user) {
            console.warn("Credentials.authorize: user not found", { email });
            return null;
          }

          // Must have a hashed password to use credentials flow
          if (!user.password) {
            console.warn("Credentials.authorize: user has no password (OAuth-only?)", {
              email,
              userId: user.userId ?? null,
            });
            return null; // or optionally allow and instruct user to set a password
          }

          // Compare safely
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            console.warn("Credentials.authorize: bad password", { email });
            return null;
          }

          // Ensure userId exists. If missing, create it now (atomic update).
          if (!user.userId) {
            // generateUniqueUserId should be idempotent (but assume it returns a new ID)
            const newUserId = await generateUniqueUserId();
            await db.user.update({
              where: { id: user.id },
              data: { userId: newUserId },
            });
            user.userId = newUserId; // for return below
          }

          // Return minimal serializable object
          return {
            id: user.id,
            name: user.name ?? "",
            email: user.email ?? "",
            role: user.role ?? "user",
            userId: user.userId,
            image: user.image ?? undefined,
          };
        } catch (err) {
          console.error("Credentials.authorize: unexpected error", err);
          return null; // avoid throwing — return null to indicate bad credentials
        }
      },
    }),

  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.userId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.userId = token.userId as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Generate userId when user is created
      const userId = await generateUniqueUserId();
      await db.user.update({
        where: { id: user.id },
        data: { userId },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
