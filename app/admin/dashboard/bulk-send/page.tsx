"use client";

// Bulk email sender with attachments
// Send emails to multiple recipients with custom sender and file attachments

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Download,
  X,
  Plus,
  AlertCircle,
  FileUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface Attachment {
  filename: string;
  path: string;
  file?: File;
}

export default function BulkSendPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("admin@dissthatdsa.dev");
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Add recipient email
  const addRecipient = () => {
    if (!currentEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (recipientEmails.includes(currentEmail)) {
      toast.error("This email is already added");
      return;
    }

    setRecipientEmails([...recipientEmails, currentEmail]);
    setCurrentEmail("");
  };

  // Remove recipient email
  const removeRecipient = (email: string) => {
    setRecipientEmails(recipientEmails.filter((e) => e !== email));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size (max 25MB per file, Resend limit)
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 25MB)`);
        continue;
      }

      const attachment: Attachment = {
        filename: file.name,
        path: URL.createObjectURL(file),
        file,
      };

      setAttachments([...attachments, attachment]);
    }

    // Reset input
    e.currentTarget.value = "";
  };

  // Remove attachment
  const removeAttachment = (filename: string) => {
    setAttachments(attachments.filter((a) => a.filename !== filename));
  };

  // Handle bulk send
  const handleBulkSend = async () => {
    // Validation
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter email body content");
      return;
    }

    if (recipientEmails.length === 0) {
      toast.error("Please add at least one recipient email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      toast.error("Please enter a valid sender email address");
      return;
    }

    setIsLoading(true);

    try {
      // Build FormData for file upload
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("senderEmail", senderEmail);
      formData.append("recipientEmails", JSON.stringify(recipientEmails));

      // Add file attachments
      for (const attachment of attachments) {
        if (attachment.file) {
          formData.append("attachments", attachment.file);
        }
      }

      const response = await fetch("/api/admin/emails/bulk-send", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Emails sent! ${data.stats.sent}/${data.stats.total} successful${
            data.stats.attachments > 0
              ? ` with ${data.stats.attachments} attachment(s)`
              : ""
          }`
        );

        // Reset form
        setSubject("");
        setBody("");
        setRecipientEmails([]);
        setSenderEmail("admin@dissthatdsa.dev");
        setAttachments([]);
        setPreviewMode(false);
      } else {
        toast.error(data.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while sending emails");
    } finally {
      setIsLoading(false);
    }
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const csvContent =
      "email\ntest1@example.com\ntest2@example.com\ntest3@example.com";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_recipients.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Paste recipients from CSV/text
  const handlePasteRecipients = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.currentTarget.value;
    const emails = text
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    setRecipientEmails(emails);
    e.currentTarget.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Bulk email sender
        </h1>
        <p className="text-sm text-zinc-400">
          Send emails with attachments to multiple recipients from different sender emails.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Email Composer */}
        <div className="space-y-6 lg:col-span-2">
          {/* Sender Email */}
          <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-zinc-50">
              Sender email
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-zinc-200">From *</Label>
                <Input
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="sender@example.com"
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-50"
                  type="email"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Must be a verified sender email. Default: admin@dissthatdsa.dev
                </p>
              </div>
            </div>
          </Card>

          {/* Subject & Body */}
          <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-zinc-50">
              Email content
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <Label className="text-zinc-200">Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-50"
                />
              </div>

              <div>
                <Label className="text-zinc-200">Message *</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here... (HTML supported)"
                  rows={10}
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-50 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Tip: You can use HTML for formatting
                </p>
              </div>

              {/* Preview Toggle */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="outline"
                  className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                >
                  {previewMode ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Attachments */}
          <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-zinc-50">
              Attachments
            </h2>
            <div className="space-y-4 text-sm">
              {/* File Upload */}
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-zinc-500 transition">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-5 w-5 text-zinc-500" />
                    <span className="text-zinc-300 text-xs font-medium">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      PDF, DOC, XLS, images (Max 25MB per file)
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Attached Files */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-300">
                    {attachments.length} file(s) attached
                  </p>
                  {attachments.map((att) => (
                    <div
                      key={att.filename}
                      className="flex items-center justify-between gap-2 rounded bg-zinc-900 p-2"
                    >
                      <span className="truncate text-xs text-zinc-300">
                        {att.filename}
                      </span>
                      <button
                        onClick={() => removeAttachment(att.filename)}
                        className="text-zinc-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recipients Sidebar */}
        <div className="space-y-4">
          {/* Quick Add */}
          <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-50">
              Add recipients
            </h2>
            <div className="space-y-2 text-sm">
              <Input
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
                placeholder="email@example.com"
                type="email"
                className="bg-zinc-900 border-zinc-800 text-zinc-50"
              />
              <Button
                onClick={addRecipient}
                className="w-full"
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </Card>

          {/* Bulk Import */}
          <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-50">
              Bulk import
            </h2>
            <div className="space-y-2 text-sm">
              <Textarea
                onChange={handlePasteRecipients}
                placeholder="Paste emails separated by comma or newline"
                rows={5}
                className="bg-zinc-900 border-zinc-800 text-zinc-50 font-mono text-xs"
              />
              <Button
                onClick={downloadSampleCSV}
                variant="outline"
                size="sm"
                className="w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Sample CSV
              </Button>
            </div>
          </Card>

          {/* Recipients List */}
          <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-50">
                Recipients
              </h2>
              <Badge variant="secondary">{recipientEmails.length}</Badge>
            </div>

            {recipientEmails.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recipientEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded bg-zinc-900 p-2"
                  >
                    <span className="truncate text-xs text-zinc-300">
                      {email}
                    </span>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-zinc-500 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500">
                <Mail className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                <p>No recipients added yet</p>
              </div>
            )}
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleBulkSend}
            disabled={
              isLoading ||
              !subject ||
              !body ||
              recipientEmails.length === 0
            }
            className="w-full"
            size="lg"
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading
              ? "Sending..."
              : `Send to ${recipientEmails.length} recipient(s)`}
          </Button>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-50">
              Email preview
            </h2>
            <Button
              onClick={() => setPreviewMode(false)}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">FROM:</p>
              <p className="text-zinc-50">{senderEmail}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">SUBJECT:</p>
              <p className="text-zinc-50 font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">MESSAGE:</p>
              <div
                className="mt-2 rounded bg-zinc-900 p-3 text-zinc-300 text-xs prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
            {attachments.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500">ATTACHMENTS:</p>
                <div className="mt-2 space-y-1">
                  {attachments.map((att) => (
                    <p key={att.filename} className="text-zinc-300">
                      📎 {att.filename}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-amber-900/50 bg-amber-950/20 p-4 shadow-sm">
        <div className="flex gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-200">
              Important information
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-amber-100/80 text-xs">
              <li>Sender email must be verified with your email provider</li>
              <li>
                Attachments must be under 25MB each (Resend provider limit)
              </li>
              <li>
                Make sure your email body is valid HTML if using HTML formatting
              </li>
              <li>Test with a small recipient list before sending to many</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
