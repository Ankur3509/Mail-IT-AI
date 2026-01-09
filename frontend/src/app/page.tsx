"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Send, Wand2, Trash2, CheckCircle, Mail, User, PenTool, MessageSquare, Loader2, ArchiveRestore, LogIn } from "lucide-react";

interface Draft {
  subject: string;
  body: string;
}

export default function MailAiApp() {
  const [formData, setFormData] = useState({
    sender_name: "",
    recipient_name: "",
    recipient_email: "",
    purpose: "",
    tone: "Professional",
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    // Check for token in URL after OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setAuthToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
      showNotification("success", "Gmail connected successfully!");
    }
  }, []);

  const connectGmail = async () => {
    console.log("Connect Gmail clicked...");
    try {
      const response = await fetch("https://mail-it-ai.onrender.com/auth-url");
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Auth URL data:", data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL returned from backend:", data);
        alert("Server did not return an auth URL. Check backend logs.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      showNotification("error", "Failed to start Gmail connection.");
      alert("Error: " + (error instanceof Error ? error.message : "Network error"));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateDraft = async () => {
    if (!formData.sender_name || !formData.recipient_name || !formData.purpose) {
      showNotification("error", "Please fill in all required fields.");
      return;
    }

    setIsGenerating(true);
    setDraft(null);
    try {
      const response = await fetch("https://mail-it-ai.onrender.com/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: formData.sender_name,
          recipient_name: formData.recipient_name,
          purpose: formData.purpose,
          tone: formData.tone,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate draft");
      const data = await response.json();
      setDraft(data);
      showNotification("success", "Draft generated successfully!");
    } catch (error) {
      showNotification("error", "Error generating draft. Is the backend running?");
    } finally {
      setIsGenerating(false);
      setIsEditing(false);
    }
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (draft) {
      setDraft({ ...draft, [e.target.name]: e.target.value });
    }
  };

  const sendEmail = async () => {
    if (!draft || !formData.recipient_email) {
      showNotification("error", "Recipient email and draft are required.");
      return;
    }

    if (!authToken) {
      showNotification("error", "Please connect your Gmail first.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("https://mail-it-ai.onrender.com/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: formData.recipient_email,
          subject: draft.subject,
          body: draft.body,
          auth_token: authToken,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to send email");
      }

      showNotification("success", "Email sent successfully!");
      setDraft(null);
      setFormData({ ...formData, recipient_email: "", purpose: "" });
    } catch (error: any) {
      showNotification("error", error.message || "Error sending email.");
    } finally {
      setIsSending(false);
    }
  };

  const saveToDrafts = async () => {
    if (!draft || !formData.recipient_email) {
      showNotification("error", "Recipient email and draft are required.");
      return;
    }

    if (!authToken) {
      showNotification("error", "Please connect your Gmail first.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("https://mail-it-ai.onrender.com/create-draft-gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: formData.recipient_email,
          subject: draft.subject,
          body: draft.body,
          auth_token: authToken,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create draft");
      }

      showNotification("success", "Draft saved to your Gmail successfully!");
    } catch (error: any) {
      showNotification("error", error.message || "Error saving draft.");
    } finally {
      setIsSending(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
          <div className="flex items-center gap-3">
            {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {!authToken ? (
            <button
              onClick={connectGmail}
              className="mb-8 inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-full shadow-md border border-gray-100 hover:bg-gray-50 hover:shadow-lg transition-all"
            >
              <LogIn className="w-5 h-5 text-google-red" style={{ color: '#DB4437' }} />
              Connect your Gmail account
            </button>
          ) : (
            <div className="mb-8 inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-full border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              Gmail Connected
            </div>
          )}
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight mb-4">
            Mailit <span className="text-primary italic">AI</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The professional AI email assistant. Prompt, preview, and send in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Input Form */}
          <div className="glass-card p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold text-xl leading-none">
              <PenTool className="w-5 h-5 text-primary" />
              Compose
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="sender_name"
                    value={formData.sender_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Recipient Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleInputChange}
                    placeholder="Jane Smith"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Recipient Email (For sending)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="recipient_email"
                  type="email"
                  value={formData.recipient_email}
                  onChange={handleInputChange}
                  placeholder="jane.smith@example.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email Purpose</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                <textarea
                  name="purpose"
                  rows={4}
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="e.g., Requesting a meeting to discuss the Q3 roadmap..."
                  className="input-field pl-10 resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Tone</label>
              <select
                name="tone"
                value={formData.tone}
                onChange={handleInputChange}
                className="input-field bg-white"
              >
                <option>Professional</option>
                <option>Casual</option>
                <option>Friendly</option>
                <option>Formal</option>
                <option>Urgent</option>
              </select>
            </div>

            <button
              onClick={generateDraft}
              disabled={isGenerating}
              className="btn-primary w-full mt-4"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Magically Drafting...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate AI Draft
                </>
              )}
            </button>
          </div>

          {/* Right: Preview Card */}
          <div className="lg:sticky lg:top-12">
            {!draft ? (
              <div className="glass-card p-12 rounded-3xl border-dashed border-2 border-gray-200 flex flex-col items-center justify-center text-center text-gray-400 min-h-[500px]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-500">No Draft Yet</h3>
                <p>Fill in the details on the left and click "Generate" to see the AI magic.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden rounded-3xl flex flex-col min-h-[500px]">
                <div className="bg-white/50 px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Preview</span>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2 mb-4">
                      <label className="text-xs font-bold text-primary uppercase">Subject</label>
                      <input
                        name="subject"
                        value={draft.subject}
                        onChange={handleDraftChange}
                        className="w-full p-2 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-gray-800 font-bold"
                      />
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{draft.subject}</h2>
                  )}
                  <div className="text-sm text-gray-500 flex items-center justify-between">
                    <div>
                      To: <span className="text-gray-900 font-medium">{formData.recipient_name} ({formData.recipient_email})</span>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${isEditing ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                    >
                      <PenTool className="w-3 h-3" />
                      {isEditing ? "Finish Editing" : "Custom Edit"}
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-8 py-6 bg-white overflow-auto">
                  {isEditing ? (
                    <textarea
                      name="body"
                      value={draft.body}
                      onChange={handleDraftChange}
                      rows={15}
                      className="w-full h-full p-4 border border-primary/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-700 leading-relaxed font-serif text-lg resize-none"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-serif italic text-lg">
                      {draft.body}
                    </div>
                  )}
                </div>

                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={sendEmail}
                      disabled={isSending || !formData.recipient_email}
                      className="btn-primary flex-1 py-4"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Direct Send
                        </>
                      )}
                    </button>
                    <button
                      onClick={saveToDrafts}
                      disabled={isSending || !formData.recipient_email}
                      className="btn-secondary flex-1 py-4 !bg-indigo-50 !text-indigo-700 hover:!bg-indigo-100 border border-indigo-200"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      Save to Gmail Drafts
                    </button>
                  </div>
                  <button
                    onClick={() => setDraft(null)}
                    disabled={isSending}
                    className="text-gray-400 hover:text-rose-500 text-sm flex items-center justify-center gap-1 py-2 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Discard Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-gray-400 text-sm space-y-4">
        <div className="flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
        </div>
        <p>© 2026 Mailit AI. Developed with ❤️ for professional communication.</p>
      </footer>
    </div>
  );
}
