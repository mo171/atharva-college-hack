"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/store/authStore";
import { Loader2, Mail, MessageCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
    <Card className="border-[#1E1E2D] bg-[#0A0A12] shadow-2xl backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6 text-center sm:text-left">
        <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
        <CardDescription className="text-[#9496A1]">
          Sign in to your Bharat Biz-Agent account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Toggle / Tabs (Visual only since WA is disabled per request, or we just show Email generic) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Visual "disabled" state for WA as user requested no WA auth */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#2D2D3A] bg-[#0E0E16] py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed opacity-50">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl bg-[#7047EB]/10 border border-[#7047EB]/50 py-2.5 text-sm font-medium text-[#A888FF]">
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
                className="text-xs text-[#7047EB] hover:text-[#A888FF] hover:underline"
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
            className="w-full h-11 text-base shadow-[0_0_20px_rgba(112,71,235,0.2)]"
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
            <span className="w-full border-t border-[#2D2D3A]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0A0A12] px-2 text-muted-foreground">
              New user?
            </span>
          </div>
        </div>

        <Link href="/signup">
          <Button
            variant="secondary"
            className="w-full h-11 border-[#2D2D3A] bg-transparent hover:bg-[#1A1A24]"
          >
            Create Account
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
