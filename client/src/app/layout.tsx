import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Outfit } from "next/font/google";
import { AppProvider } from "@/context/app-context";
import { CartHydrator } from "@/components/cart-hydrator";
import { MotionProvider } from "@/components/motion/motion-provider";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-outfit" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Pizza Way",
  description: "Pizza Way - fresh pizza, fast.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body>
        <AppProvider>
          <MotionProvider>
            <CartHydrator />
            {children}
          </MotionProvider>
        </AppProvider>
      </body>
    </html>
  );
}
