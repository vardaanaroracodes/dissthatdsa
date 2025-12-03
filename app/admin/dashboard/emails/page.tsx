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
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Email campaigns</h1>
        <p className="text-sm text-zinc-400">Target registrants with reminders, updates and follow-ups.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Email Composer */}
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-zinc-50">Compose email</h2>

          <div className="space-y-4 text-sm">
            {/* Class Selection */}
            <div className="space-y-1">
              <Label className="text-zinc-200">Select class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-50">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950">
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} ({c.registrationCount} registered)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <Label className="text-zinc-200">Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="bg-zinc-900 border-zinc-800 text-zinc-50"
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label className="text-zinc-200">Message *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here... (HTML supported)"
                rows={12}
                className="bg-zinc-900 border-zinc-800 text-zinc-50 font-mono text-xs"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Tip: You can use HTML for formatting
              </p>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendEmail}
              disabled={isLoading || selectedRecipients.length === 0}
              className="w-full"
            >
              <Send className="mr-2 h-3.5 w-3.5" />
              {isLoading
                ? "Sending..."
                : `Send to ${selectedRecipients.length} recipient(s)`}
            </Button>
          </div>
        </Card>

        {/* Recipients List */}
        <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2 text-sm">
            <h2 className="font-semibold tracking-tight text-zinc-50">
              Recipients ({selectedRecipients.length})
            </h2>
          </div>

          {registrations.length > 0 ? (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
                <Checkbox
                  id="select-all"
                  checked={selectedRecipients.length === registrations.length}
                  onCheckedChange={toggleAll}
                />
                <label
                  htmlFor="select-all"
                  className="cursor-pointer text-xs font-medium text-zinc-200"
                >
                  Select All
                </label>
              </div>

              {/* Recipients */}
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-start space-x-2 rounded p-2 hover:bg-zinc-900/60"
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
                      <p className="text-xs font-medium text-zinc-50">{reg.name}</p>
                      <p className="text-[11px] text-zinc-400">{reg.email}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              <Mail className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <p>
                {selectedClassId
                  ? "No registered users for this class"
                  : "Select a class to view recipients"}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Email Templates */}
      <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-50">Quick templates</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto justify-start border-zinc-800 bg-zinc-950 text-left text-xs hover:border-zinc-500 hover:bg-zinc-900/80"
            onClick={() => {
              setSubject("Important Update About Your Class");
              setBody(`<p>Hi there!</p><p>We have an important update regarding your upcoming class.</p><p>Please check the details below...</p>`);
            }}
          >
            <div>
              <p className="font-semibold text-zinc-50">Class update</p>
              <p className="text-[11px] text-zinc-400">General announcement template</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start border-zinc-800 bg-zinc-950 text-left text-xs hover:border-zinc-500 hover:bg-zinc-900/80"
            onClick={() => {
              setSubject("Reminder: Class Starting Soon");
              setBody(`<p>Hello!</p><p>This is a reminder that your class is starting soon.</p><p>Make sure you're ready to join!</p>`);
            }}
          >
            <div>
              <p className="font-semibold text-zinc-50">Reminder</p>
              <p className="text-[11px] text-zinc-400">Class reminder template</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start border-zinc-800 bg-zinc-950 text-left text-xs hover:border-zinc-500 hover:bg-zinc-900/80"
            onClick={() => {
              setSubject("Thank You for Attending!");
              setBody(`<p>Thank you for attending the class!</p><p>We hope you found it valuable. Here are some resources...</p>`);
            }}
          >
            <div>
              <p className="font-semibold text-zinc-50">Thank you</p>
              <p className="text-[11px] text-zinc-400">Post-class follow-up</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
