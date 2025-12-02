"use client";
import RetroHero from "@/components/Hero";
import Led from "@/components/Led";
import Image from "next/image";
import { UnderlineDemo } from "@/components/footer";
import Services from "@/components/Services";

export default function Home() {
  return (
   <>
    <RetroHero />
    <Services />
    <UnderlineDemo />

   </>
  );
}
