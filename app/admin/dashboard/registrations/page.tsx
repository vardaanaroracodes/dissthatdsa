"use client";

// Registrations management page
// View all registered users with filtering and export options

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentStatus: string;
  amount: number;
  registeredAt: string;
  class: {
    id: string;
    title: string;
    scheduledAt: string;
  };
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [searchTerm, selectedClass, selectedStatus, registrations]);

  const fetchData = async () => {
    try {
      // Fetch classes
      const classesRes = await fetch("/api/admin/classes");
      const classesData = await classesRes.json();
      setClasses(classesData.classes || []);

      // Fetch all registrations from all classes
      const allRegistrations: Registration[] = [];
      for (const classItem of classesData.classes || []) {
        const response = await fetch(`/api/admin/classes/${classItem.id}`);
        const data = await response.json();
        if (data.class?.registrations) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allRegistrations.push(...data.class.registrations.map((r: any) => ({
            ...r,
            class: {
              id: classItem.id,
              title: classItem.title,
              scheduledAt: classItem.scheduledAt,
            },
          })));
        }
      }

      setRegistrations(allRegistrations);
    } catch (error) {
      toast.error("Failed to load registrations");
    } finally {
      setIsLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.phone.includes(searchTerm)
      );
    }

    // Filter by class
    if (selectedClass !== "all") {
      filtered = filtered.filter((r) => r.class.id === selectedClass);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((r) => r.paymentStatus === selectedStatus);
    }

    setFilteredRegistrations(filtered);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Class", "Status", "Amount", "Registered At"];
    const rows = filteredRegistrations.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.class.title,
      r.paymentStatus,
      r.amount,
      new Date(r.registeredAt).toLocaleString("en-IN"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Registrations</h1>
        <p className="text-sm text-muted-foreground">Search, filter and export attendees across all classes.</p>
      </div>

      {/* Filters */}
      <Card className="border border-zinc-800 bg-zinc-900/80 p-5 text-zinc-50 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-zinc-800 bg-zinc-950 pl-10 text-zinc-50"
            />
          </div>

          {/* Class Filter */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-50">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-50">
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-50">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-50">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            onClick={exportToCSV}
            disabled={filteredRegistrations.length === 0}
            className="justify-center border-zinc-700 bg-zinc-950 text-zinc-50 hover:border-zinc-500 hover:bg-zinc-900"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-left">
            <p className="text-xs text-zinc-400">Total registrations</p>
            <p className="text-lg font-semibold text-zinc-50">{filteredRegistrations.length}</p>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-left">
            <p className="text-xs text-zinc-400">Completed</p>
            <p className="text-lg font-semibold text-emerald-400">
              {filteredRegistrations.filter((r) => r.paymentStatus === "COMPLETED").length}
            </p>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-left">
            <p className="text-xs text-zinc-400">Total revenue</p>
            <p className="text-lg font-semibold text-zinc-50">
              ₹
              {filteredRegistrations
                .filter((r) => r.paymentStatus === "COMPLETED")
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-zinc-800 bg-zinc-900/80 text-zinc-50 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Phone</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Class</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Amount</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-400">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id} className="border-zinc-800">
                    <TableCell className="py-3 text-sm font-medium text-zinc-50">{registration.name}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{registration.email}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{registration.phone}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">{registration.class.title}</TableCell>
                    <TableCell className="py-3">
                      <Badge className={getStatusColor(registration.paymentStatus)}>
                        {registration.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">₹{registration.amount}</TableCell>
                    <TableCell className="py-3 text-xs text-zinc-400">
                      {new Date(registration.registeredAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    {isLoading ? "Loading…" : "No registrations found"}
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
