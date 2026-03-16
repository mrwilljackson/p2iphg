"use client";

import { useEffect } from "react";
import Image from "next/image";

const REDIRECT_URL = "https://www.power2inspire.org.uk/powerhousegames/";
const DELAY_MS = 5000;

export default function Home() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex flex-col items-center justify-center gap-6">
        <Image
          src="/p2i-logo.png"
          alt="Power2Inspire Logo"
          width={400}
          height={400}
          priority
          className="max-w-full h-auto"
        />
        <p className="text-gray-500 text-sm tracking-wide">
          Redirecting you to the PowerHouseGames page&hellip;
        </p>
      </main>
    </div>
  );
}
