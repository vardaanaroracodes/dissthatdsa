"use client";

// Admin dashboard layout with modern light shell
// Shared app chrome: sidebar + top bar + content area

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Mail,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Classes", href: "/admin/dashboard/classes", icon: Calendar },
  { name: "Registrations", href: "/admin/dashboard/registrations", icon: Users },
  { name: "Email Campaigns", href: "/admin/dashboard/emails", icon: Mail },
  { name: "Admin Approvals", href: "/admin/dashboard/approvals", icon: Shield, superAdminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin" });
  };

  // Avoid hydration mismatch while session loads
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <span className="text-sm text-muted-foreground">Loading admin...</span>
      </div>
    );
  }

  const adminUser = session?.user as any | undefined;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="flex h-screen max-h-screen">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/90
            transition-transform duration-300 ease-in-out
            lg:static lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-zinc-800 bg-zinc-950 px-5">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Dissthat DSA</span>
              <span className="text-xs text-zinc-400">Admin console</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.superAdminOnly && adminUser?.role !== "SUPERADMIN") {
                return null;
              }

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                    transition-colors
                    ${isActive
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-100">
                  {adminUser?.name || adminUser?.email || "Admin"}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  {adminUser?.email || "Signed in"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-zinc-300 hover:bg-zinc-900"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight text-zinc-100">Admin dashboard</span>
                <span className="text-xs text-zinc-500">
                  Manage classes, registrations and communication
                </span>
              </div>
            </div>

            {adminUser && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-100 shadow-sm ring-1 ring-zinc-700 hover:bg-zinc-700">
                    {adminUser.name?.[0]?.toUpperCase() || adminUser.email?.[0]?.toUpperCase() || "A"}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-56 border-zinc-800 bg-zinc-900 px-3 py-3 text-xs text-zinc-100 shadow-lg"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold">
                      {adminUser.name?.[0]?.toUpperCase() || adminUser.email?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[11px] font-medium">{adminUser.name || "Admin"}</p>
                      <p className="truncate text-[11px] text-zinc-400">{adminUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center justify-between rounded-md bg-zinc-800 px-2 py-1.5 text-[11px] text-zinc-100 hover:bg-zinc-700"
                  >
                    <span>Sign out</span>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </PopoverContent>
              </Popover>
            )}
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
