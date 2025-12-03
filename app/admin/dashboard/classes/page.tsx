"use client";

// Class management page for admins
// Create, edit, publish/unpublish, and delete classes

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users } from "lucide-react";
import toast from "react-hot-toast";

interface Class {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  price: number;
  maxParticipants?: number;
  isLive: boolean;
  registrationCount: number;
  createdBy: {
    name: string;
  };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    meetingLink: "",
    price: 29,
    maxParticipants: "",
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/admin/classes");
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingClass
        ? `/api/admin/classes/${editingClass.id}`
        : "/api/admin/classes";

      const method = editingClass ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        }),
      });

      if (response.ok) {
        toast.success(editingClass ? "Class updated!" : "Class created!");
        setIsDialogOpen(false);
        resetForm();
        fetchClasses();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save class");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLive = async (classId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(currentStatus ? "Class unpublished" : "Class published!");
        fetchClasses();
      } else {
        toast.error("Failed to update class");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Class deleted");
        fetchClasses();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete class");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const openEditDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description,
      scheduledAt: new Date(classItem.scheduledAt).toISOString().slice(0, 16),
      duration: classItem.duration,
      meetingLink: classItem.meetingLink || "",
      price: classItem.price,
      maxParticipants: classItem.maxParticipants?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      title: "",
      description: "",
      scheduledAt: "",
      duration: 60,
      meetingLink: "",
      price: 29,
      maxParticipants: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, update and publish upcoming sessions.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              New class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold tracking-tight">
                {editingClass ? "Edit class" : "Create class"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Scheduled date & time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Meeting link</Label>
                <Input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max participants (optional)</Label>
                  <Input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Saving…" : editingClass ? "Save changes" : "Create class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="border border-border bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {classItem.title}
                  </h3>
                  <Badge
                    variant={classItem.isLive ? "default" : "outline"}
                    className={classItem.isLive ? "bg-emerald-100 text-emerald-700" : "border-muted text-muted-foreground"}
                  >
                    {classItem.isLive ? "Live" : "Draft"}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{classItem.description}</p>
              </div>
            </div>

            <div className="mb-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {new Date(classItem.scheduledAt).toLocaleString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex items-center">
                <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {classItem.registrationCount} registered
                  {classItem.maxParticipants && ` / ${classItem.maxParticipants} max`}
                </span>
              </div>
              <div className="text-sm font-semibold text-foreground">₹{classItem.price}</div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleLive(classItem.id, classItem.isLive)}
                className="flex-1"
              >
                {classItem.isLive ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
                {classItem.isLive ? "Unpublish" : "Go live"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(classItem)}
                className="border-border"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(classItem.id)}
                className="border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {classes.length === 0 && !isLoading && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No classes yet. Create your first one to get started.
        </div>
      )}
    </div>
  );
}
