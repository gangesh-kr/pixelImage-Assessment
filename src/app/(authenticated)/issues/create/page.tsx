"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, ArrowLeft, BrainCircuit, Check, CheckCircle2 } from "lucide-react";

interface Website {
  id: string;
  name: string;
  url: string;
}

function CreateIssueFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [websites, setWebsites] = useState<Website[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWebsiteId, setSelectedWebsiteId] = useState("");
  const [category, setCategory] = useState<"BUG" | "FEEDBACK" | "SUGGESTION" | "IMPROVEMENT">("BUG");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [aiSuggested, setAiSuggested] = useState(false);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await fetch("/api/websites");
        if (res.ok) {
          const data = await res.json();
          setWebsites(data);
          
          const preSelected = searchParams.get("websiteId");
          if (preSelected && data.some((w: Website) => w.id === preSelected)) {
            setSelectedWebsiteId(preSelected);
          } else if (data.length > 0) {
            setSelectedWebsiteId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load websites:", err);
      }
    };
    fetchWebsites();
  }, [searchParams]);

  const handleAICodeDraft = async () => {
    if (!description.trim()) {
      setError("Please describe the issue first so the AI can analyze it.");
      return;
    }

    setAiLoading(true);
    setError("");
    setAiSuggested(false);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "classify",
          description,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.category && data.severity) {
          setCategory(data.category);
          setSeverity(data.severity);
          setAiSuggested(true);
          setError("");
        }
      } else {
        setError("AI classification failed. Please configure your OpenAI API Key or input values manually.");
      }
    } catch (err) {
      console.error(err);
      setError("AI service unavailable. Using manual classification.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim() || !selectedWebsiteId) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          websiteId: selectedWebsiteId,
          category,
          severity,
        }),
      });

      if (res.ok) {
        const newIssue = await res.json();
        setSuccess("Issue reported successfully! Redirecting...");
        setTimeout(() => {
          router.push(`/issues/${newIssue.id}`);
        }, 1000);
      } else {
        const errData = await res.json();
        const errMessage = typeof errData.error === "string" 
          ? errData.error 
          : errData.error?.[0]?.message || "Failed to submit issue.";
        setError(errMessage);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while saving the issue.");
      setLoading(false);
    }
  };

  if (session?.user?.role !== "CLIENT") {
    return (
      <div className="bg-card border border-border p-6 rounded-2xl text-center text-muted-foreground">
        Access Denied. Only clients can submit support requests.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Report Support Request</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create an incident ticket. Our AI assistant will automatically classify categories and severities based on details.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-start">
          <AlertCircle className="mr-2 h-5 w-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center">
          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Issue Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Checkout page is crashing for all users"
            className="block w-full px-4 py-3 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground placeholder-muted-foreground/60"
            required
            disabled={loading}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Detailed Description <span className="text-red-400">*</span>
            </label>
            
            <button
              type="button"
              onClick={handleAICodeDraft}
              disabled={aiLoading || loading}
              className="flex items-center text-xs font-semibold px-3 py-1.5 bg-primary/10 border border-primary/20 hover:border-primary/40 text-primary rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <BrainCircuit className={`mr-1.5 h-4 w-4 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Analyzing..." : "Classify with AI"}
            </button>
          </div>
          
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail. Include any status codes, speed details, error logs, or user feedback. e.g., 'When clicking complete payment, the loader spins indefinitely and then throws a 500 internal server error. This is happening for all checkout users.'"
            rows={5}
            className="block w-full px-4 py-3 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground placeholder-muted-foreground/60 resize-y"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Affected Website <span className="text-red-400">*</span>
          </label>
          <select
            id="website"
            value={selectedWebsiteId}
            onChange={(e) => setSelectedWebsiteId(e.target.value)}
            className="block w-full px-4 py-3 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground cursor-pointer"
            required
            disabled={loading || websites.length === 0}
          >
            {websites.length === 0 ? (
              <option value="">No monitored websites available</option>
            ) : (
              websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.url})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Category
              {aiSuggested && (
                <span className="ml-2 px-1.5 py-0.25 text-[9px] bg-primary/20 text-primary rounded-md border border-primary/20 normal-case">
                  AI Suggested
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setAiSuggested(false);
                  }}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    category === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/20 border-border hover:border-border/80 text-muted-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Severity Level
              {aiSuggested && (
                <span className="ml-2 px-1.5 py-0.25 text-[9px] bg-primary/20 text-primary rounded-md border border-primary/20 normal-case">
                  AI Suggested
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => {
                    setSeverity(sev);
                    setAiSuggested(false);
                  }}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    severity === sev
                      ? sev === "CRITICAL"
                        ? "bg-red-500 border-red-500 text-white shadow-sm"
                        : sev === "HIGH"
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/20 border-border hover:border-border/80 text-muted-foreground"
                  }`}
                >
                  {severity === sev && <Check className="mr-1 h-3.5 w-3.5 shrink-0" />}
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 focus:outline-none transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? "Submitting Request..." : "Submit Support Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateIssuePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm mt-3">Loading request form...</p>
      </div>
    }>
      <CreateIssueFormContent />
    </Suspense>
  );
}
