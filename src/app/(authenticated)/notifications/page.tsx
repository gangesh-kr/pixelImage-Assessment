"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Eye, Trash2, Calendar, ShieldAlert } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.filter((n) => !n.isRead).length === 0) return;
    
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm mt-3">Loading notifications...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stay updated with alerts on your ticket resolutions and support activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold">All caught up!</p>
            <p className="text-xs text-muted-foreground/80 mt-1">You do not have any alerts at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 flex items-start sm:items-center justify-between gap-4 transition-colors ${
                  !notification.isRead
                    ? "bg-primary/5 hover:bg-primary/8 font-medium"
                    : "hover:bg-secondary/10"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <span
                    className={`mt-0.5 sm:mt-0 flex h-7 w-7 items-center justify-center rounded-lg border ${
                      !notification.isRead
                        ? "bg-primary/10 border-primary/20 text-primary animate-pulse"
                        : "bg-secondary/40 border-border text-muted-foreground"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </span>

                  <div className="space-y-1">
                    <p className={`text-sm leading-snug ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {notification.message}
                    </p>
                    <span className="flex items-center text-[10px] text-muted-foreground font-semibold" suppressHydrationWarning>
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1.5 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  
                  <Link
                    href="/issues"
                    className="p-1.5 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="View Tickets"
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
