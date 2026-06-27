"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in (using useEffect to avoid render-phase router side effects)
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        if (!name.trim()) { setError("Please enter your name."); setSubmitting(false); return; }
        await signUp(email, password, name);
      }
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      // Clean up Firebase error messages
      if (msg.includes("auth/user-not-found") || msg.includes("auth/invalid-credential")) {
        setError("Invalid email or password.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("auth/weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (msg.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      if (msg.includes("auth/popup-closed-by-user")) {
        // User closed the popup — not an error
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Simple header */}
      <header className="h-16 bg-white border-b border-[#F1F5F9] flex items-center px-6">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </span>
          <span className="text-base font-bold text-[#0F172A] tracking-tight">ModelMatch</span>
        </div>
      </header>

      {/* Auth card */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[#64748B]">
              {mode === "login"
                ? "Sign in to access your saved history and matches."
                : "Start finding your perfect AI tools in seconds."}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#CBD5E1] transition-all mb-5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8] font-medium">or</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="s-input w-full pl-10 pr-4 py-2.5"
                    required={mode === "signup"}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="s-input w-full pl-10 pr-4 py-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="s-input w-full pl-10 pr-10 py-2.5"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full h-11 mt-1">
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-sm text-[#64748B] text-center mt-6">
            {mode === "login" ? (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }}
                  className="text-[#4F46E5] font-semibold hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); }}
                  className="text-[#4F46E5] font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
