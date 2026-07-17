"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { submitContactFormApiV1ContactSubmitPost } from "@repo/api-client";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactFormApiV1ContactSubmitPost({
        body: { name, email, message },
      });
      toast.success("Thank you! Your message was submitted successfully.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to submit contact message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Full Name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Email Address
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none resize-none transition-all placeholder:text-slate-600 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isSubmitting ? (
          <>
            <span>Sending...</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </>
        ) : (
          <>
            <span>Send Message</span>
            <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
