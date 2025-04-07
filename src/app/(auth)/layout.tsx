
import { ImageSlider } from "@/features/core/image-slider";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex bg-slate-100 p-4 lg:p-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left side - Hero/Branding with Slider */}
        <div className="hidden lg:block w-1/2">
          <ImageSlider />
        </div>

        {/* Right side - Auth Form Container */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
          <div className="w-full mb-8 flex justify-center">
            <div className="relative w-28 h-28">
              <Image
                src="/logo.png"
                alt="Logo FF"
                fill
                quality={100}
                className="rounded-full transition duration-300 ease-in-out hover:scale-110 object-contain border"
              />
            </div>
          </div>
          

          <div className="w-full max-w-md">
            <div className="relative h-auto min-h-[300px] w-full rounded-xl">
              <main className="w-full">
                {children}
              </main>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}