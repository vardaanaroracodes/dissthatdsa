"use client";

// Admin dashboard layout with navigation sidebar
// Provides consistent navigation across all admin pages

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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);

  // Check authentication on mount
  useEffect(() => {
    // Verify admin session would go here
    // For now, just storing from login
  }, []);

  const handleLogout = async () => {
    try {
      // Clear session cookie
      document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-gray-900 border-red-600"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r-2 border-red-600
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-red-600/30">
            <h1 className="text-2xl font-bold text-red-600">Admin Portal</h1>
            <p className="text-sm text-gray-400 mt-1">Class Management System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              // Hide superadmin-only items from regular admins
              if (item.superAdminOnly && admin?.role !== 'SUPERADMIN') {
                return null;
              }

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-red-600/30">
            <div className="mb-3">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="text-white font-medium truncate">
                {admin?.email || 'admin@example.com'}
              </p>
              {admin?.role === 'SUPERADMIN' && (
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-600 text-white rounded">
                  SUPERADMIN
                </span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
