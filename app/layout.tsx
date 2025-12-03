import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RetroGrid from "@/components/ui/retro-grid";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diss That DSA",
  description: "Diss That DSA is a student run community"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* Global retro grid background */}
          <RetroGrid gridColor="#ff0000" showScanlines={true} glowEffect={true} className="fixed inset-0 w-full h-full -z-10" />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
