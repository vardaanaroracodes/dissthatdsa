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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Classes */}
        <Card className="bg-gradient-to-br from-red-600 to-red-700 border-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Classes</p>
              <p className="text-4xl font-bold text-white mt-2">
                {stats?.totalClasses || 0}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-red-200" />
          </div>
        </Card>

        {/* Live Classes */}
        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Live Classes</p>
              <p className="text-4xl font-bold text-white mt-2">
                {stats?.liveClasses || 0}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </Card>

        {/* Total Registrations */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Registrations</p>
              <p className="text-4xl font-bold text-white mt-2">
                {stats?.totalRegistrations || 0}
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
              <p className="text-4xl font-bold text-white mt-2">
                ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-200" />
          </div>
        </Card>
      </div>

      {/* Recent Classes */}
      <Card className="bg-gray-900 border-2 border-red-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Upcoming Classes</h2>

        {stats?.recentClasses && stats.recentClasses.length > 0 ? (
          <div className="space-y-3">
            {stats.recentClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 bg-black rounded-lg border border-red-600/30 hover:border-red-600 transition-colors"
              >
                <div>
                  <h3 className="text-white font-semibold">{classItem.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(classItem.scheduledAt).toLocaleString('en-IN', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">
                    {classItem.registrationCount}
                  </p>
                  <p className="text-gray-400 text-sm">registrations</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No upcoming classes scheduled
          </p>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/admin/dashboard/classes"
          className="bg-gray-900 border-2 border-red-600 rounded-lg p-6 hover:bg-gray-800 transition-colors group"
        >
          <Calendar className="h-8 w-8 text-red-600 mb-3" />
          <h3 className="text-white font-semibold text-lg mb-2">Manage Classes</h3>
          <p className="text-gray-400 text-sm">
            Create, edit, and publish your classes
          </p>
        </a>

        <a
          href="/admin/dashboard/registrations"
          className="bg-gray-900 border-2 border-red-600 rounded-lg p-6 hover:bg-gray-800 transition-colors group"
        >
          <Users className="h-8 w-8 text-red-600 mb-3" />
          <h3 className="text-white font-semibold text-lg mb-2">View Registrations</h3>
          <p className="text-gray-400 text-sm">
            See who registered for your classes
          </p>
        </a>

        <a
          href="/admin/dashboard/emails"
          className="bg-gray-900 border-2 border-red-600 rounded-lg p-6 hover:bg-gray-800 transition-colors group"
        >
          <Mail className="h-8 w-8 text-red-600 mb-3" />
          <h3 className="text-white font-semibold text-lg mb-2">Send Emails</h3>
          <p className="text-gray-400 text-sm">
            Create and send email campaigns
          </p>
        </a>
      </div>
    </div>
  );
}
