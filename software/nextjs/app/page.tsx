import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex flex-col items-center justify-center">
        <Image
          src="/p2i-logo.png"
          alt="Power2Inspire Logo"
          width={400}
          height={400}
          priority
          className="max-w-full h-auto"
        />
      </main>
    </div>
  );
}
