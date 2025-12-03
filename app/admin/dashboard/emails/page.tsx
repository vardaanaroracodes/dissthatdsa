"use client";

// Email campaigns management page
// Send bulk emails to selected registrants with rich content

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function EmailsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRegistrations(selectedClassId);
    } else {
      setRegistrations([]);
      setSelectedRecipients([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/admin/classes");
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      toast.error("Failed to load classes");
    }
  };

  const fetchRegistrations = async (classId: string) => {
    try {
      const response = await fetch(`/api/admin/classes/${classId}`);
      const data = await response.json();
      const completed = data.class?.registrations?.filter(
        (r: any) => r.paymentStatus === "COMPLETED"
      ) || [];
      setRegistrations(completed);
    } catch (error) {
      toast.error("Failed to load registrations");
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRecipients.length === registrations.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(registrations.map((r) => r.id));
    }
  };

  const handleSendEmail = async () => {
    if (!subject || !body) {
      toast.error("Subject and body are required");
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          recipientIds: selectedRecipients,
          classId: selectedClassId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Email sent to ${data.stats.sent} recipients!`);
        setSubject("");
        setBody("");
        setSelectedRecipients([]);
      } else {
        toast.error(data.error || "Failed to send emails");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Email Campaigns</h1>
        <p className="text-gray-400 mt-1">Send emails to registered users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composer */}
        <Card className="lg:col-span-2 bg-gray-900 border-2 border-red-600 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Compose Email</h2>

          <div className="space-y-4">
            {/* Class Selection */}
            <div>
              <Label className="text-white">Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-black border-red-600/50 text-white">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-red-600">
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} ({c.registrationCount} registered)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-white">Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="bg-black border-red-600/50 text-white"
              />
            </div>

            {/* Body */}
            <div>
              <Label className="text-white">Message *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here... (HTML supported)"
                rows={12}
                className="bg-black border-red-600/50 text-white font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tip: You can use HTML for formatting
              </p>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendEmail}
              disabled={isLoading || selectedRecipients.length === 0}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading
                ? "Sending..."
                : `Send to ${selectedRecipients.length} recipient(s)`}
            </Button>
          </div>
        </Card>

        {/* Recipients List */}
        <Card className="bg-gray-900 border-2 border-red-600 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Recipients ({selectedRecipients.length})
          </h2>

          {registrations.length > 0 ? (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center space-x-2 pb-3 border-b border-red-600/30">
                <Checkbox
                  id="select-all"
                  checked={selectedRecipients.length === registrations.length}
                  onCheckedChange={toggleAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium text-white cursor-pointer"
                >
                  Select All
                </label>
              </div>

              {/* Recipients */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-start space-x-2 p-2 rounded hover:bg-black/50"
                  >
                    <Checkbox
                      id={reg.id}
                      checked={selectedRecipients.includes(reg.id)}
                      onCheckedChange={() => toggleRecipient(reg.id)}
                    />
                    <label
                      htmlFor={reg.id}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-white text-sm font-medium">{reg.name}</p>
                      <p className="text-gray-400 text-xs">{reg.email}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {selectedClassId
                  ? "No registered users for this class"
                  : "Select a class to view recipients"}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Email Templates */}
      <Card className="bg-gray-900 border-2 border-red-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Quick Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="justify-start text-left h-auto p-4"
            onClick={() => {
              setSubject("Important Update About Your Class");
              setBody(`<p>Hi there!</p><p>We have an important update regarding your upcoming class.</p><p>Please check the details below...</p>`);
            }}
          >
            <div>
              <p className="font-semibold">Class Update</p>
              <p className="text-xs text-gray-400">General announcement template</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start text-left h-auto p-4"
            onClick={() => {
              setSubject("Reminder: Class Starting Soon");
              setBody(`<p>Hello!</p><p>This is a reminder that your class is starting soon.</p><p>Make sure you're ready to join!</p>`);
            }}
          >
            <div>
              <p className="font-semibold">Reminder</p>
              <p className="text-xs text-gray-400">Class reminder template</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start text-left h-auto p-4"
            onClick={() => {
              setSubject("Thank You for Attending!");
              setBody(`<p>Thank you for attending the class!</p><p>We hope you found it valuable. Here are some resources...</p>`);
            }}
          >
            <div>
              <p className="font-semibold">Thank You</p>
              <p className="text-xs text-gray-400">Post-class follow-up</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
