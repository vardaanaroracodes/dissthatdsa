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
    <div className="min-h-screen bg-muted/40 text-foreground">
      <div className="flex h-screen max-h-screen">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background
            transition-transform duration-300 ease-in-out
            lg:static lg:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Brand */}
          <div className="flex h-16 items-center border-b bg-background px-5">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Dissthat DSA</span>
              <span className="text-xs text-muted-foreground">Admin console</span>
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t bg-background px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {adminUser?.name || adminUser?.email || "Admin"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {adminUser?.email || "Signed in"}
                </p>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
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
          <header className="flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">Admin dashboard</span>
                <span className="text-xs text-muted-foreground">
                  Manage classes, registrations and communication
                </span>
              </div>
            </div>

            {adminUser && (
              <Card className="flex items-center gap-3 rounded-full border bg-background px-3 py-1.5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {adminUser.name?.[0]?.toUpperCase() || adminUser.email?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="hidden text-xs leading-tight sm:block">
                  <p className="font-medium truncate max-w-40">{adminUser.name || "Admin"}</p>
                  <p className="text-muted-foreground truncate max-w-40">{adminUser.email}</p>
                </div>
              </Card>
            )}
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
