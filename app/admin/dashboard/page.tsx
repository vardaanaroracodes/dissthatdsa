"use client";

// Main admin dashboard with overview statistics
// Shows key metrics about classes, registrations, and revenue

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign, Mail, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

interface DashboardStats {
  totalClasses: number;
  liveClasses: number;
  totalRegistrations: number;
  totalRevenue: number;
  pendingAdmins: number;
  recentClasses: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    registrationCount: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch classes
      const classesRes = await fetch("/api/admin/classes");
      const classesData = await classesRes.json();

      // Calculate stats
      const classes = classesData.classes || [];
      const totalClasses = classes.length;
      const liveClasses = classes.filter((c: any) => c.isLive).length;
      const totalRegistrations = classes.reduce(
        (sum: number, c: any) => sum + (c.registrationCount || 0),
        0
      );
      const totalRevenue = classes.reduce(
        (sum: number, c: any) => sum + (c.registrationCount || 0) * c.price,
        0
      );

      // Get recent classes
      const recentClasses = classes
        .filter((c: any) => new Date(c.scheduledAt) > new Date())
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5);

      setStats({
        totalClasses,
        liveClasses,
        totalRegistrations,
        totalRevenue,
        pendingAdmins: 0,
        recentClasses,
      });
    } catch (error) {
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            High-level snapshot of classes, registrations and revenue.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total classes
              </p>
              <p className="text-3xl font-semibold">
                {stats?.totalClasses ?? "–"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Live now
              </p>
              <p className="text-3xl font-semibold">
                {stats?.liveClasses ?? "–"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Registrations
              </p>
              <p className="text-3xl font-semibold">
                {stats?.totalRegistrations ?? "–"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total revenue
              </p>
              <p className="text-3xl font-semibold">
                {stats
                  ? `₹${stats.totalRevenue.toLocaleString("en-IN")}`
                  : "–"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Classes */}
      <Card className="border border-border bg-background p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Upcoming classes
            </h2>
            <p className="text-xs text-muted-foreground">
              Next few sessions with registration counts.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Loading dashboard…
          </div>
        ) : stats?.recentClasses && stats.recentClasses.length > 0 ? (
          <div className="space-y-2">
            {stats.recentClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between gap-4 rounded-md border bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {classItem.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(classItem.scheduledAt).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">
                    {classItem.registrationCount}
                  </p>
                  <p className="text-muted-foreground">registrations</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center text-xs text-muted-foreground">
            <p>No upcoming classes scheduled.</p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a
          href="/admin/dashboard/classes"
          className="group rounded-lg border border-border bg-background p-4 text-sm shadow-sm transition-colors hover:bg-muted"
        >
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Manage classes</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Create, edit and publish upcoming sessions.
          </p>
        </a>

        <a
          href="/admin/dashboard/registrations"
          className="group rounded-lg border border-border bg-background p-4 text-sm shadow-sm transition-colors hover:bg-muted"
        >
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">View registrations</span>
          </div>
          <p className="text-xs text-muted-foreground">
            See who signed up and payment status.
          </p>
        </a>

        <a
          href="/admin/dashboard/emails"
          className="group rounded-lg border border-border bg-background p-4 text-sm shadow-sm transition-colors hover:bg-muted"
        >
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="font-medium">Email campaigns</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Send reminders, updates and follow-ups.
          </p>
        </a>
      </div>
    </div>
  );
}
