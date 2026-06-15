"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, Calendar, Filter, MessageSquare, Search, Plus, Eye } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  category: "BUG" | "FEEDBACK" | "SUGGESTION" | "IMPROVEMENT";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_REVIEW" | "IN_PROGRESS" | "WAITING_FOR_CLIENT" | "RESOLVED" | "CLOSED";
  websiteId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  website: {
    name: string;
    url: string;
  };
  creator: {
    name: string;
    email: string;
  };
}

function IssuesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [severity, setSeverity] = useState(searchParams.get("severity") || "ALL");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status !== "ALL") params.append("status", status);
      if (severity !== "ALL") params.append("severity", severity);
      if (category !== "ALL") params.append("category", category);

      const res = await fetch(`/api/issues?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [status, severity, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "IN_REVIEW":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "IN_PROGRESS":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "WAITING_FOR_CLIENT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HIGH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "MEDIUM":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {session?.user?.role === "MANAGER"
              ? "Manage, triage, and respond to clients reported incidents."
              : "Track progress and converse with support managers on your tickets."}
          </p>
        </div>

        {session?.user?.role === "CLIENT" && (
          <Link
            href="/issues/create"
            className="flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 cursor-pointer w-fit"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Issue
          </Link>
        )}
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-11 pr-4 py-2.5 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground placeholder-muted-foreground/60"
            />
          </div>
          
          <button
            type="submit"
            className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold rounded-xl transition-all cursor-pointer text-sm"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground pt-1">
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-secondary/40 border border-border rounded-lg px-2.5 py-1 text-foreground cursor-pointer font-medium hover:border-border/80 transition-colors outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CLIENT">Waiting For Client</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Severity:</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-secondary/40 border border-border rounded-lg px-2.5 py-1 text-foreground cursor-pointer font-medium hover:border-border/80 transition-colors outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary/40 border border-border rounded-lg px-2.5 py-1 text-foreground cursor-pointer font-medium hover:border-border/80 transition-colors outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="BUG">Bug</option>
              <option value="FEEDBACK">Feedback</option>
              <option value="SUGGESTION">Suggestion</option>
              <option value="IMPROVEMENT">Improvement</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm mt-3">Loading tickets list...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold">No tickets found matching current filters.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors group relative"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-bold tracking-wider uppercase">
                      {issue.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      on <span className="text-foreground hover:text-primary transition-colors underline decoration-border">{issue.website.name}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    <Link href={`/issues/${issue.id}`} className="hover:underline">
                      {issue.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-muted-foreground truncate max-w-xl">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1.5 font-medium">
                    <span className="flex items-center" suppressHydrationWarning>
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    {session?.user?.role === "MANAGER" && (
                      <span className="flex items-center">
                        <span className="h-1 w-1 bg-muted-foreground rounded-full mr-2"></span>
                        Reported by: <span className="text-foreground font-semibold ml-1">{issue.creator.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 md:self-center shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-full ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusStyle(issue.status)}`}>
                    {issue.status.replace(/_/g, " ")}
                  </span>

                  <Link
                    href={`/issues/${issue.id}`}
                    className="p-2 border border-border bg-secondary/20 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm mt-3">Loading tickets...</p>
      </div>
    }>
      <IssuesPageContent />
    </Suspense>
  );
}
