"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/store/authStore";
import { Loader2, Mail, MessageCircle, AlertCircle } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [genericError, setGenericError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setGenericError("");
    try {
      await signIn(data.email, data.password);
      router.push("/dashboard"); // or wherever the user goes after login
    } catch (error) {
      setGenericError(error.message || "Invalid email or password");
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white shadow-lg shadow-black/5">
      <CardHeader className="space-y-1 pb-6 text-center sm:text-left">
        <CardTitle className="text-2xl text-[#2e2e2e]">Welcome Back</CardTitle>
        <CardDescription className="text-[#6a6a6a]">
          Sign in to your Bharat Biz-Agent account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Toggle / Tabs (Visual only since WA is disabled per request, or we just show Email generic) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Visual "disabled" state for WA as user requested no WA auth */}
          <div className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#e0e0d8] bg-[#f5f5f0] py-2.5 text-sm font-medium text-[#888] opacity-60">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#ced3ff] bg-[#e8ecff] py-2.5 text-sm font-medium text-[#5a5fd8]">
            <Mail className="h-4 w-4" />
            Email
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isSubmitting}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-[#5a5fd8] hover:text-[#4a4fd0] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              disabled={isSubmitting}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {genericError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {genericError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#ced3ff] text-base text-[#4a4a7a] shadow-md shadow-[#ced3ff]/30 transition-colors hover:bg-[#b8bff5]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#e8e8e0]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-[#888]">New user?</span>
          </div>
        </div>

        <Link href="/signup">
          <Button
            variant="secondary"
            className="h-11 w-full rounded-xl border border-[#e0e0d8] bg-[#f8f7ff] text-[#4a4a7a] transition-colors hover:border-[#ced3ff] hover:bg-[#e8ecff]"
          >
            Create Account
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
