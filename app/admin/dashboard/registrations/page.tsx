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
        return "bg-green-600";
      case "PENDING":
        return "bg-yellow-600";
      case "FAILED":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Registrations</h1>
        <p className="text-gray-400 mt-1">View and manage all class registrations</p>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-2 border-red-600 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black border-red-600/50 text-white"
            />
          </div>

          {/* Class Filter */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="bg-black border-red-600/50 text-white">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-red-600">
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-black border-red-600/50 text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-red-600">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            onClick={exportToCSV}
            disabled={filteredRegistrations.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{filteredRegistrations.length}</p>
            <p className="text-sm text-gray-400">Total Registrations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {filteredRegistrations.filter((r) => r.paymentStatus === "COMPLETED").length}
            </p>
            <p className="text-sm text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              ₹
              {filteredRegistrations
                .filter((r) => r.paymentStatus === "COMPLETED")
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-gray-400">Total Revenue</p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-gray-900 border-2 border-red-600 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-red-600/30">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Phone</TableHead>
                <TableHead className="text-white">Class</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id} className="border-red-600/30">
                    <TableCell className="text-white font-medium">{registration.name}</TableCell>
                    <TableCell className="text-gray-300">{registration.email}</TableCell>
                    <TableCell className="text-gray-300">{registration.phone}</TableCell>
                    <TableCell className="text-gray-300">{registration.class.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(registration.paymentStatus)}>
                        {registration.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">₹{registration.amount}</TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(registration.registeredAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    {isLoading ? "Loading..." : "No registrations found"}
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
