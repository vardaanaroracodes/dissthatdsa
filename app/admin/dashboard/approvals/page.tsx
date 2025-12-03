"use client";

// Admin approval page (superadmin only)
// Approve or reject pending admin accounts

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
  _count: {
    createdClasses: number;
    sentEmails: number;
  };
}

export default function ApprovalsPage() {
  const [pendingAdmins, setPendingAdmins] = useState<Admin[]>([]);
  const [approvedAdmins, setApprovedAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("/api/admin/approvals?status=pending"),
        fetch("/api/admin/approvals?status=approved"),
      ]);

      if (!pendingRes.ok || !approvedRes.ok) {
        toast.error("Failed to load admins. Are you a superadmin?");
        return;
      }

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();

      setPendingAdmins(pendingData.admins || []);
      setApprovedAdmins(approvedData.admins || []);
    } catch (error) {
      toast.error("Failed to load admins");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (adminId: string) => {
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          action: "approve",
        }),
      });

      if (response.ok) {
        toast.success("Admin approved successfully");
        fetchAdmins();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve admin");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleReject = async (adminId: string) => {
    if (!confirm("Are you sure you want to reject this admin? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          action: "reject",
        }),
      });

      if (response.ok) {
        toast.success("Admin rejected");
        fetchAdmins();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject admin");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-50">
          <Shield className="h-6 w-6 text-emerald-400" />
          Admin approvals
        </h1>
        <p className="text-sm text-zinc-400">Review and approve new admin access (superadmin only).</p>
      </div>

      {/* Pending Admins */}
      <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-50">
              Pending approvals
            </h2>
            <p className="text-xs text-zinc-500">
              New admins waiting for superadmin review.
            </p>
          </div>
          {pendingAdmins.length > 0 && (
            <Badge className="bg-amber-500/90 text-xs font-semibold text-zinc-950">
              {pendingAdmins.length} pending
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Role</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Requested</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAdmins.length > 0 ? (
                pendingAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-zinc-800">
                    <TableCell className="py-3 text-sm font-medium text-zinc-50">{admin.name}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{admin.email}</TableCell>
                    <TableCell className="py-3">
                      <Badge className={admin.role === 'SUPERADMIN' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200'}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">
                      {new Date(admin.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(admin.id)}
                          className="border-emerald-500/70 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/10"
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(admin.id)}
                          className="border-red-500/70 text-red-400 hover:border-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-xs text-zinc-500">
                    {isLoading ? "Loading…" : "No pending approvals"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Approved Admins */}
      <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-50">
              Approved admins
            </h2>
            <p className="text-xs text-zinc-500">Existing admins and their activity.</p>
          </div>
          {approvedAdmins.length > 0 && (
            <Badge className="bg-zinc-800 text-xs font-semibold text-zinc-100">
              {approvedAdmins.length} total
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Role</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Classes</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Emails</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedAdmins.length > 0 ? (
                approvedAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-zinc-800">
                    <TableCell className="py-3 text-sm font-medium text-zinc-50">{admin.name}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{admin.email}</TableCell>
                    <TableCell className="py-3">
                      <Badge className={admin.role === 'SUPERADMIN' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200'}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{admin._count.createdClasses}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{admin._count.sentEmails}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">
                      {new Date(admin.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-xs text-zinc-500">
                    {isLoading ? "Loading…" : "No approved admins"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
