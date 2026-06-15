"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Calendar,
  Globe,
  User,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle,
  Clock,
  History,
  AlertOctagon,
  MessageCircle
} from "lucide-react";

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  user: {
    name: string;
    role: "CLIENT" | "MANAGER";
    email: string;
  };
}

interface TimelineEvent {
  id: string;
  type: "ISSUE_CREATED" | "STATUS_CHANGED" | "SEVERITY_CHANGED" | "COMMENT_ADDED" | "ISSUE_RESOLVED";
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  creator: {
    name: string;
    role: string;
  };
}

interface IssueDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  websiteId: string;
  createdBy: string;
  createdAt: string;
  website: {
    name: string;
    url: string;
  };
  creator: {
    name: string;
    email: string;
  };
  comments: Comment[];
  events: TimelineEvent[];
}

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: issueId } = use(params);
  const { data: session } = useSession();

  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingSeverity, setUpdatingSeverity] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchIssueDetails = async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
      } else {
        setError("Incident ticket not found or access denied.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch issue details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commentText }),
      });

      if (res.ok) {
        setCommentText("");
        await fetchIssueDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAIGenerateResponse = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          issueId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          setCommentText(data.draft);
        }
      } else {
        alert("Failed to generate draft. Ensure OpenAI API Key is configured.");
      }
    } catch (err) {
      console.error(err);
      alert("AI Service error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchIssueDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSeverityChange = async (newSeverity: string) => {
    setUpdatingSeverity(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: newSeverity }),
      });

      if (res.ok) {
        await fetchIssueDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingSeverity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm mt-3">Loading incident details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <AlertOctagon className="h-12 w-12 text-destructive mx-auto animate-bounce" />
        <h2 className="text-xl font-bold">Error Loading Ticket</h2>
        <p className="text-muted-foreground text-sm">{error || "Ticket does not exist."}</p>
        <button
          onClick={() => router.push("/issues")}
          className="mt-4 px-4 py-2 bg-secondary rounded-xl text-xs font-semibold border border-border hover:bg-secondary/80 cursor-pointer"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  const isManager = session?.user?.role === "MANAGER";

  const getTimelineEventDescription = (event: TimelineEvent) => {
    const creatorName = event.creator.name;
    const isManagerEvent = event.creator.role === "MANAGER";
    const label = `${creatorName} (${isManagerEvent ? "Manager" : "Client"})`;

    switch (event.type) {
      case "ISSUE_CREATED":
        return `${label} created the ticket.`;
      case "STATUS_CHANGED":
        return `${label} changed status from "${event.oldValue}" to "${event.newValue}".`;
      case "SEVERITY_CHANGED":
        return `${label} updated severity from "${event.oldValue}" to "${event.newValue}".`;
      case "COMMENT_ADDED":
        return `${label} added a response.`;
      case "ISSUE_RESOLVED":
        return `${label} marked the incident as resolved.`;
      default:
        return `${label} performed an action.`;
    }
  };

  const getTimelineEventIcon = (type: string) => {
    switch (type) {
      case "ISSUE_CREATED":
        return <PlusIcon className="h-4 w-4 text-sky-400" />;
      case "STATUS_CHANGED":
      case "SEVERITY_CHANGED":
        return <Clock className="h-4 w-4 text-violet-400" />;
      case "COMMENT_ADDED":
        return <MessageCircle className="h-4 w-4 text-purple-400" />;
      case "ISSUE_RESOLVED":
        return <CheckCircle className="h-4 w-4 text-emerald-400 animate-pulse" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => router.push("/issues")}
        className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Support Tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>{issue.category}</span>
              <span>•</span>
              <span className="flex items-center">
                <Globe className="mr-1 h-3.5 w-3.5 text-primary" />
                {issue.website.name}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {issue.title}
            </h1>

            <div className="p-4 bg-secondary/20 border border-border/40 rounded-xl">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Description
              </span>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {issue.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium pt-2">
              <span className="flex items-center" suppressHydrationWarning>
                <Calendar className="mr-1.5 h-4 w-4 text-muted-foreground" />
                Reported {new Date(issue.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center">
                <User className="mr-1.5 h-4 w-4 text-muted-foreground" />
                By {issue.creator.name} ({issue.creator.email})
              </span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold tracking-tight border-b border-border/40 pb-3.5 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Communication History
            </h2>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {issue.comments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No responses yet. Send a message to start conversation.
                </div>
              ) : (
                issue.comments.map((comment) => {
                  const isManagerMsg = comment.user.role === "MANAGER";
                  return (
                    <div
                      key={comment.id}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-4 border transition-all ${
                        isManagerMsg
                          ? "ml-auto bg-purple-500/10 border-purple-500/20 text-foreground"
                          : "bg-secondary/40 border-border text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1.5">
                        <span className={`text-xs font-bold ${isManagerMsg ? "text-purple-400" : "text-emerald-400"}`}>
                          {comment.user.name} ({comment.user.role})
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium" suppressHydrationWarning>
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {issue.status === "CLOSED" ? (
              <div className="bg-secondary/20 p-4 border border-border text-center text-muted-foreground text-xs rounded-xl font-medium">
                This ticket is Closed. Re-open status to continue messaging.
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Send Response Message
                  </label>
                  
                  {isManager && (
                    <button
                      type="button"
                      onClick={handleAIGenerateResponse}
                      disabled={aiLoading || submittingComment}
                      className="flex items-center text-xs font-semibold px-3 py-1.5 bg-violet-600/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`mr-1.5 h-4 w-4 ${aiLoading ? "animate-spin" : ""}`} />
                      {aiLoading ? "Drafting..." : "Generate AI Response"}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Type your reply here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="block w-full pr-14 pl-4 py-3 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground placeholder-muted-foreground/60 resize-none"
                    required
                    disabled={submittingComment || aiLoading}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || aiLoading || !commentText.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold tracking-tight border-b border-border/40 pb-3">
              Incident Status Panel
            </h2>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Severity Level
                </span>
                
                {isManager ? (
                  <select
                    value={issue.severity}
                    onChange={(e) => handleSeverityChange(e.target.value)}
                    disabled={updatingSeverity}
                    className="block w-full px-3 py-2.5 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                ) : (
                  <span className="inline-flex px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    {issue.severity}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Issue Status
                </span>
                
                {isManager ? (
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="block w-full px-3 py-2.5 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground cursor-pointer"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_FOR_CLIENT">WAITING FOR CLIENT</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex px-3 py-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400 text-xs font-bold uppercase tracking-wider">
                      {issue.status.replace(/_/g, " ")}
                    </span>
                    
                    {issue.status !== "CLOSED" && (
                      <button
                        onClick={() => handleStatusChange("CLOSED")}
                        disabled={updatingStatus}
                        className="px-3 py-1.5 border border-border bg-secondary hover:bg-secondary/80 rounded-xl text-xs font-bold hover:text-destructive transition-colors cursor-pointer"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold tracking-tight border-b border-border/40 pb-3 flex items-center">
              <History className="mr-2 h-4 w-4 text-primary" />
              Activity Audit Trail
            </h2>

            <div className="relative border-l border-border pl-5 space-y-6 ml-2">
              {issue.events.map((event) => (
                <div key={event.id} className="relative">
                  <span className="absolute -left-7.5 top-0.5 flex items-center justify-center h-5 w-5 rounded-full bg-card border border-border z-10">
                    {getTimelineEventIcon(event.type)}
                  </span>
                  
                  <div className="space-y-0.5">
                    <p className="text-xs text-foreground font-medium leading-snug">
                      {getTimelineEventDescription(event)}
                    </p>
                    <span className="block text-[9px] text-muted-foreground font-semibold" suppressHydrationWarning>
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
