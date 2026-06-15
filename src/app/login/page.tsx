"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";

function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error || "Failed to sign in. Please check your credentials.");
        setLoading(false);
      } else {
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: "client" | "manager") => {
    const testEmail = role === "client" ? "client@test.com" : "manager@test.com";
    const testPassword = "password123";

    setEmail(testEmail);
    setPassword(testPassword);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: testEmail,
        password: testPassword,
      });

      if (res?.error) {
        setError(res.error || "Failed to sign in with demo account.");
        setLoading(false);
      } else {
        setSuccess(`Logged in as ${role === "client" ? "Demo Client" : "Demo Manager"}!`);
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError("Demo login failed.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-crimson/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Sign in to Shield
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your credentials or use a demo account below
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-xl shadow-black/40 backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-destructive"></span>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/75">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground placeholder-muted-foreground/60"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/75">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border hover:border-border/80 focus:border-primary rounded-xl text-sm transition-colors outline-none text-foreground placeholder-muted-foreground/60"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 focus:outline-none transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-primary-foreground rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">
                Demo Accounts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleQuickLogin("client")}
              disabled={loading}
              className="flex flex-col items-center justify-center py-3 px-4 bg-secondary/20 hover:bg-secondary/40 border border-border/60 hover:border-border/90 rounded-2xl transition-all cursor-pointer group"
            >
              <span className="text-sm font-semibold text-emerald-400">Client Panel</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 group-hover:text-muted-foreground/80">client@test.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("manager")}
              disabled={loading}
              className="flex flex-col items-center justify-center py-3 px-4 bg-secondary/20 hover:bg-secondary/40 border border-border/60 hover:border-border/90 rounded-2xl transition-all cursor-pointer group"
            >
              <span className="text-sm font-semibold text-purple-400">Manager Panel</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 group-hover:text-muted-foreground/80">manager@test.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
