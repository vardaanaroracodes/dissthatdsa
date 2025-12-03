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
      <div>
        <h1 className="text-4xl font-bold text-white flex items-center gap-2">
          <Shield className="h-10 w-10 text-red-600" />
          Admin Approvals
        </h1>
        <p className="text-gray-400 mt-1">Manage admin access (Superadmin only)</p>
      </div>

      {/* Pending Admins */}
      <Card className="bg-gray-900 border-2 border-red-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Pending Approvals
          {pendingAdmins.length > 0 && (
            <Badge className="ml-3 bg-yellow-600">{pendingAdmins.length}</Badge>
          )}
        </h2>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-red-600/30">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Requested</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAdmins.length > 0 ? (
                pendingAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-red-600/30">
                    <TableCell className="text-white font-medium">{admin.name}</TableCell>
                    <TableCell className="text-gray-300">{admin.email}</TableCell>
                    <TableCell>
                      <Badge className={admin.role === 'SUPERADMIN' ? 'bg-red-600' : 'bg-blue-600'}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(admin.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(admin.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(admin.id)}
                          className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    {isLoading ? "Loading..." : "No pending approvals"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Approved Admins */}
      <Card className="bg-gray-900 border-2 border-red-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Approved Admins
          {approvedAdmins.length > 0 && (
            <Badge className="ml-3 bg-green-600">{approvedAdmins.length}</Badge>
          )}
        </h2>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-red-600/30">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Classes Created</TableHead>
                <TableHead className="text-white">Emails Sent</TableHead>
                <TableHead className="text-white">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedAdmins.length > 0 ? (
                approvedAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-red-600/30">
                    <TableCell className="text-white font-medium">{admin.name}</TableCell>
                    <TableCell className="text-gray-300">{admin.email}</TableCell>
                    <TableCell>
                      <Badge className={admin.role === 'SUPERADMIN' ? 'bg-red-600' : 'bg-blue-600'}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{admin._count.createdClasses}</TableCell>
                    <TableCell className="text-gray-300">{admin._count.sentEmails}</TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(admin.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    {isLoading ? "Loading..." : "No approved admins"}
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
