"use client";
import RetroHero from "@/components/Hero";
import { UnderlineDemo } from "@/components/footer";
import Services from "@/components/Services";
import RetroGrid from "@/components/ui/retro-grid";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LiveClass {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  price: number;
  isFull: boolean;
}

export default function Home() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes/live");
        const data = await res.json();
        setClasses(data.classes || []);
      } catch (e) {
        console.error("Failed to load classes", e);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 hidden md:block">
        <RetroGrid
          gridColor="#ff0000"
          showScanlines
          glowEffect
          className="h-full w-full"
        />
      </div>

      <RetroHero />

      {/* Upcoming classes strip */}
      <section className="relative z-10 mx-auto mt-12 w-full max-w-5xl px-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Upcoming Classes
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Live DSA batches with limited seats.
            </p>
          </div>
          <Link
            href="/class-signup"
            className="rounded-full border border-red-500/40 bg-black/60 px-3 py-1 text-[11px] font-medium text-red-200 shadow-[0_0_12px_rgba(248,113,113,0.35)] transition hover:border-red-400 hover:bg-black hover:text-white"
          >
            View all & register
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-black/90 via-black to-black/90 px-3 py-3">
          {loading ? (
            <p className="px-2 text-xs text-zinc-400">Loading classes…</p>
          ) : classes.length === 0 ? (
            <p className="px-2 text-xs text-zinc-400">
              No scheduled live batches right now. Join the waitlist on the signup page.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 text-xs [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-red-600/60">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={{ pathname: "/class-signup", query: { classId: cls.id } }}
                  className="group relative flex min-w-[240px] max-w-xs flex-col justify-between rounded-xl border border-red-500/20 bg-black/70 px-3 py-3 transition hover:border-red-400 hover:bg-black"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="line-clamp-1 text-[13px] font-semibold text-zinc-50">
                      {cls.title}
                    </h3>
                    <span className="whitespace-nowrap rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300">
                      {new Date(cls.scheduledAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-[11px] text-zinc-400">
                    {cls.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="font-semibold text-red-400">
                      ₹{cls.price}
                    </span>
                    <span className="rounded-full border border-red-400/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-200 group-hover:bg-red-500/10">
                      {cls.isFull ? "Full" : "Book spot"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Services />
      <UnderlineDemo />
    </div>
  );
}
