"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, AlertCircle, Bell, LogOut, User, Menu, X, ShieldAlert } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const notifications = await res.json();
          const unread = notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch {
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [status]);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Issues", href: "/issues", icon: AlertCircle },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: unreadCount },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-muted-foreground text-sm font-medium animate-pulse">Loading Tracker...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const role = session?.user?.role || "CLIENT";
  const email = session?.user?.email || "";
  const name = session?.user?.name || "User";

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-6 border-b border-border bg-background/50">
            <ShieldAlert className="h-6 w-6 text-primary mr-2.5 animate-pulse" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              Shield Issue Tracker
            </span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Icon className={`mr-3.5 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge ? (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground animate-pulse"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border bg-background/30">
            <div className="flex items-center px-2 py-3 rounded-xl bg-secondary/30 border border-border/50 mb-3">
              <div className="flex justify-center items-center h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold text-sm">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                <div className="flex items-center mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.25 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      role === "MANAGER"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {role}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate ml-2 max-w-[90px]">{email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-xl text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
            >
              <LogOut className="mr-3.5 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 md:pl-64">
        <header className="sticky top-0 z-40 md:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex items-center">
            <ShieldAlert className="h-6 w-6 text-primary mr-2" />
            <span className="text-md font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              Shield Issue
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-30">
          <div className="text-sm text-muted-foreground font-medium">
            Welcome back, <span className="text-foreground font-semibold">{name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                role === "MANAGER" ? "bg-purple-500/15 text-purple-400" : "bg-emerald-500/15 text-emerald-400"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${role === "MANAGER" ? "bg-purple-400" : "bg-emerald-400"}`}></span>
              {role.toLowerCase()} Dashboard
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative flex flex-col w-full max-w-xs bg-card border-r border-border h-full p-6 animate-slide-in">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center">
                <ShieldAlert className="h-6 w-6 text-primary mr-2" />
                <span className="text-md font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                  Shield Issue Tracker
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="mr-3.5 h-5 w-5" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge ? (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-border mt-6">
              <div className="flex items-center px-2 py-3 rounded-xl bg-secondary/30 border border-border/50 mb-4">
                <div className="flex justify-center items-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.25 text-[8px] font-bold rounded-md uppercase tracking-wider ${
                      role === "MANAGER" ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-xl text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
              >
                <LogOut className="mr-3.5 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
