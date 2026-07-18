"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { 
  listContactMessagesApiV1ContactListGet,
  replyToContactMessageApiV1ContactMessageIdReplyPost
} from "@repo/api-client";
import { toast } from "sonner";
import { 
  Mail, 
  MailOpen, 
  Send, 
  CheckCircle2, 
  Clock, 
  Search, 
  AlertCircle, 
  Loader2,
  ShieldAlert,
  Sparkles
} from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_replied: boolean;
  reply_content?: string | null;
  replied_at?: string | null;
}

export default function AdminContactsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await listContactMessagesApiV1ContactListGet();
      if (res.error) {
        toast.error("Failed to load messages.");
      } else if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred loading messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      if (!user || user.role !== "admin") {
        toast.error("Access Denied: Administrator privilege required");
        router.push("/dashboard");
      } else {
        fetchMessages();
      }
    }
  }, [user, userLoading]);

  // Handle email reply submission
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await replyToContactMessageApiV1ContactMessageIdReplyPost({
        path: {
          message_id: selectedMessage.id
        },
        body: {
          reply: replyText
        }
      });

      if (res.error) {
        toast.error("Failed to send email reply.");
      } else {
        toast.success("Reply email sent and recorded successfully.");
        setReplyText("");
        
        // Refresh local messages state
        const updatedMessages = messages.map(msg => {
          if (msg.id === selectedMessage.id) {
            const now = new Date().toISOString();
            return {
              ...msg,
              is_replied: true,
              reply_content: replyText,
              replied_at: now
            };
          }
          return msg;
        });
        
        setMessages(updatedMessages);
        setSelectedMessage({
          ...selectedMessage,
          is_replied: true,
          reply_content: replyText,
          replied_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // Filter & Search Messages
  const filteredMessages = messages.filter((msg) => {
    const matchesFilter = 
      filter === "all" ||
      (filter === "pending" && !msg.is_replied) ||
      (filter === "replied" && msg.is_replied);
      
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (userLoading || (!user || user.role !== "admin")) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Page Header */}
      <div className="border-b border-slate-900 bg-slate-900/10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Admin Inbox</h1>
            <p className="text-xs text-slate-500">Manage contact submissions and send SMTP email responses</p>
          </div>
        </div>
        <button 
          onClick={fetchMessages}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 transition-colors"
        >
          Refresh Inbox
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Inbox List */}
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-slate-900 flex flex-col flex-shrink-0 bg-slate-950/40">
          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-900 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search name, email, query..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-1.5">
              {(["all", "pending", "replied"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border transition-all ${
                    filter === tab
                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                <span className="text-xs text-slate-500">Loading inbox...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-2">
                <MailOpen className="w-8 h-8 text-slate-700" />
                <p className="text-xs font-semibold">No messages found</p>
                <p className="text-[10px] text-slate-600 max-w-[200px]">There are no submissions matching your filters.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      setReplyText("");
                    }}
                    className={`p-4 cursor-pointer transition-all duration-200 text-left ${
                      isSelected
                        ? "bg-slate-900/50 border-l-2 border-indigo-500"
                        : "hover:bg-slate-900/20"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-200 truncate">{msg.name}</span>
                      <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mb-2">{msg.email}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                      {msg.message}
                    </p>
                    
                    {/* Badge */}
                    <div className="flex">
                      {msg.is_replied ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Replied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/15">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Detail Panel */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6 space-y-6">
              {/* Message Header Card */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
                  <div>
                    <h2 className="text-base font-bold text-slate-200">{selectedMessage.name}</h2>
                    <a 
                      href={`mailto:${selectedMessage.email}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Received: {new Date(selectedMessage.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inquiry Message</h3>
                  <p className="text-sm text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {/* Reply Section */}
              {selectedMessage.is_replied ? (
                /* Already Replied State */
                <div className="border border-emerald-500/10 bg-emerald-500/5 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl" />
                  
                  <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Email Response Sent</h4>
                      <p className="text-[10px] text-slate-500">
                        Replied on: {new Date(selectedMessage.replied_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sent Reply Content</h5>
                    <p className="text-sm text-slate-350 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                      {selectedMessage.reply_content}
                    </p>
                  </div>
                </div>
              ) : (
                /* Send Response Composer */
                <form onSubmit={handleSendReply} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Write Email Response</label>
                      <span className="text-[10px] text-slate-500">Sent directly using server SMTP client</span>
                    </div>
                    
                    <textarea
                      placeholder="Type your response here... (e.g. Hello, thank you for writing...)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                      rows={8}
                      className="w-full bg-slate-900/30 border border-slate-900 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
                    >
                      {sendingReply ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Email Response</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-slate-950/20 border border-indigo-500/10 flex items-center justify-center text-indigo-500/40">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-350">No Message Selected</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click a contact message from the inbox queue on the left to read and compose an email reply.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
