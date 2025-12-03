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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Classes</h1>
          <p className="text-gray-400 mt-1">Manage your class schedule</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-red-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingClass ? "Edit Class" : "Create New Class"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-black border-red-600/50"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="bg-black border-red-600/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required
                    className="bg-black border-red-600/50"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                    className="bg-black border-red-600/50"
                  />
                </div>
              </div>
              <div>
                <Label>Meeting Link</Label>
                <Input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="bg-black border-red-600/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    required
                    className="bg-black border-red-600/50"
                  />
                </div>
                <div>
                  <Label>Max Participants (optional)</Label>
                  <Input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    placeholder="Unlimited"
                    className="bg-black border-red-600/50"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
                {isLoading ? "Saving..." : editingClass ? "Update Class" : "Create Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="bg-gray-900 border-2 border-red-600 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">{classItem.title}</h3>
                  <Badge variant={classItem.isLive ? "default" : "secondary"} className={classItem.isLive ? "bg-green-600" : ""}>
                    {classItem.isLive ? "Live" : "Draft"}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2">{classItem.description}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-300">
                <Calendar className="h-4 w-4 mr-2 text-red-600" />
                {new Date(classItem.scheduledAt).toLocaleString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Users className="h-4 w-4 mr-2 text-red-600" />
                {classItem.registrationCount} registered
                {classItem.maxParticipants && ` / ${classItem.maxParticipants} max`}
              </div>
              <div className="text-2xl font-bold text-red-600">₹{classItem.price}</div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleLive(classItem.id, classItem.isLive)}
                className="flex-1"
              >
                {classItem.isLive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {classItem.isLive ? "Unpublish" : "Go Live"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(classItem)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(classItem.id)}
                className="text-red-600 border-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {classes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No classes yet. Create your first class!</p>
        </div>
      )}
    </div>
  );
}
