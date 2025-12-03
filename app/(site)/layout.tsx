import RetroGrid from "@/components/ui/retro-grid";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 hidden md:block">
        <RetroGrid
          gridColor="#ff0000"
          showScanlines={true}
          glowEffect={true}
          className="h-full w-full"
        />
      </div>
      {children}
    </div>
  );
}
