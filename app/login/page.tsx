"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth"
      ? "Authentication failed. Please try again."
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        alert("Sign up successful! Please log in.");
        setIsSignUp(false);
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory p-4 gap-10">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2F5D50] leading-tight">
          Focus on making.
          <br />
          We handle the rest.
        </h1>
        <p className="text-sm font-sans text-[#2C2C2C] opacity-70 leading-relaxed">
          Inventory, orders, customer support, and marketing —
          <br />
          all in one place.
        </p>
      </div>
      <Card className="w-full max-w-[400px] border-warm-gold/20 bg-white shadow-soft-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Speed.Sales"
              className="h-9 w-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Create an account" : "Sign in to continue"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full bg-forest-green hover:bg-forest-green/90 text-white focus-visible:ring-warm-gold" disabled={loading}>
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign Up
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <p className="text-charcoal/70">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
