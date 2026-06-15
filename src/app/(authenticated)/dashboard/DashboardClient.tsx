"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Globe, AlertTriangle, CheckCircle2, RefreshCw, Plus, ArrowRight, ExternalLink } from "lucide-react";

interface Website {
  id: string;
  name: string;
  url: string;
  status: "ONLINE" | "DOWN" | "DEGRADED" | "UNKNOWN";
  lastChecked: string;
  clientId: string;
  openIssuesCount: number;
}

interface DashboardClientProps {
  initialWebsites: Website[];
}

export default function DashboardClient({ initialWebsites }: DashboardClientProps) {
  const { data: session } = useSession();
  const [websites, setWebsites] = useState<Website[]>(initialWebsites);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/websites");
      if (res.ok) {
        const data = await res.json();
        setWebsites(data);
      }
    } catch (err) {
      console.error("Failed to load websites:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const totalSites = websites.length;
  const onlineSites = websites.filter((w) => w.status === "ONLINE").length;
  const issueSites = websites.filter((w) => w.openIssuesCount > 0).length;
  const totalOpenIssues = websites.reduce((acc, curr) => acc + curr.openIssuesCount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "DOWN":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "DEGRADED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-400";
      case "DOWN":
        return "bg-red-400 animate-pulse";
      case "DEGRADED":
        return "bg-amber-400 animate-pulse";
      default:
        return "bg-zinc-400";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Website Status Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time status tracking for monitored domains and applications.
          </p>
        </div>
        
        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          
          {session?.user?.role === "CLIENT" && (
            <Link
              href="/issues/create"
              className="flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Report Issue
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex items-center">
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl mr-4">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Websites</p>
            <h3 className="text-2xl font-bold mt-1">{totalSites}</h3>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex items-center">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl mr-4">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Online</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-400">
              {onlineSites} <span className="text-xs font-normal text-muted-foreground">/ {totalSites}</span>
            </h3>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex items-center">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl mr-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">With Incidents</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-400">{issueSites}</h3>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex items-center">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mr-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Open Issues</p>
            <h3 className="text-2xl font-bold mt-1 text-red-400">{totalOpenIssues}</h3>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold tracking-tight mb-5">Website Incidents & Status</h2>
        
        {websites.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-2xl p-10 text-center text-muted-foreground">
            No websites found. Please contact support or run the database seeder.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {websites.map((site) => (
              <div
                key={site.id}
                className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all duration-300 shadow-sm relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-primary/5 rounded-full blur-[20px] pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{site.name}</h3>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center mt-1"
                      >
                        {site.url}
                        <ExternalLink className="ml-1 h-3 w-3 inline-block" />
                      </a>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusColor(
                        site.status
                      )}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(site.status)} mr-2`}></span>
                      {site.status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 py-3 border-y border-border/40">
                    <div>
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open Issues</span>
                      <span
                        className={`text-lg font-bold mt-0.5 block ${
                          site.openIssuesCount > 0 ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {site.openIssuesCount}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Checked</span>
                      <span className="text-xs text-foreground mt-1.5 block font-medium" suppressHydrationWarning>
                        {new Date(site.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium" suppressHydrationWarning>
                    Checked {new Date(site.lastChecked).toLocaleDateString()}
                  </span>

                  {site.openIssuesCount > 0 ? (
                    <Link
                      href={`/issues?search=${encodeURIComponent(site.name)}`}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center cursor-pointer"
                    >
                      View Issues
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    session?.user?.role === "CLIENT" && (
                      <Link
                        href={`/issues/create?websiteId=${site.id}`}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center cursor-pointer"
                      >
                        Report Bug
                        <Plus className="ml-1 h-3 w-3" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
