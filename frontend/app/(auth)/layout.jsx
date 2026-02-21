import Link from "next/link";
import { MessageSquare } from "lucide-react";
// import { ParticleBackground } from "@/app/components/ui/particle-backgournd";

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#fffff2] p-6 sm:p-8">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#ced3ff]/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#f8deff]/20 blur-[100px]" />
      </div>

      {/* Header / Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="rounded-xl bg-[#ced3ff] p-2.5 shadow-lg shadow-[#ced3ff]/30">
            <MessageSquare className="h-6 w-6 fill-[#5a5fd8] text-[#5a5fd8]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2e2e2e]">
            Bharat Biz-Agent
          </span>
        </Link>
      </div>

      {/* Auth Card Content */}
      <div className="relative z-10 w-full max-w-[440px]">{children}</div>

      {/* Footer Links */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-xs text-[#888]">
          Built for Indian businesses • Secure • Privacy-first
        </p>
      </div>
    </div>
  );
}
