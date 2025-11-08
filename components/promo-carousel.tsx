"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DownloadApkModal } from "./download-apk-modal"; // <-- Make sure this component exists
import useIsPWA from "@/hooks/useIsPWA";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const promos = [
  {
    id: 1,
    title: "Recharge rewards",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ZoxlFK1yCKPXcoJQp8Av2D7OWkzt0l.png",
  },
  {
    id: 2,
    title: "Invite user rewards",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Xizq4vOkZI9vAjCDNJoiAQ8JFdCnfF.png",
  },
  {
    id: 3,
    title: "A must read for newbies",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3rmsx3vz4rLBBy8htHj8XOYWHfv3GO.png",
  },
];

export function PromoCarousel() {

  const session = useSession();

  const router = useRouter();

  useEffect(() => {
    //@ts-ignore
    if (session && !session?.data?.user) {
      console.log(session)
      router.push("/login");
    }
  }, [session]);

  const isPWA = useIsPWA();
  const [current, setCurrent] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const apkUrl = process.env.NEXT_PUBLIC_APK_URL || "/U PAY 2 HOME.apk";

  const next = () => setCurrent((prev) => (prev + 1) % promos.length);
  const prev = () =>
    setCurrent((prev) => (prev - 1 + promos.length) % promos.length);

  // ✅ Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Show Download APK modal once every 10 minutes
  useEffect(() => {
    const lastShown = localStorage.getItem("apkModalLastShown");
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    if (!lastShown || now - Number(lastShown) > tenMinutes) {
      // Show modal if it's never been shown or expired
      setShowModal(true);
      localStorage.setItem("apkModalLastShown", now.toString());
    }
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Image container */}
        <div className="relative h-36 lg:h-40 w-full rounded-2xl overflow-hidden">
          {promos.map((promo, idx) => (
            <img
              key={promo.id}
              src={promo.image}
              alt={promo.title}
              className={`absolute transition-opacity duration-700 ease-in-out
                ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"}
                object-cover object-center`}
            />
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {promos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? "bg-foreground w-6" : "bg-muted w-2"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between px-2">
          <button
            onClick={prev}
            className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ✅ Modal for Download APK */}
      {!isPWA && (
        <DownloadApkModal
          open={showModal}
          onClose={() => setShowModal(false)}
          apkUrl={apkUrl}
        />
      )}
    </>
  );
}
