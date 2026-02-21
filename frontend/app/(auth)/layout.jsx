import Link from "next/link";
import { MessageSquare } from "lucide-react";
// import { ParticleBackground } from "@/components/ui/particle-backgournd";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#030014]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* <ParticleBackground /> */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7047EB]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#7047EB]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header / Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-[#7047EB] p-2.5 rounded-xl shadow-[0_0_20px_rgba(112,71,235,0.4)]">
            <MessageSquare className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Bharat Biz-Agent
          </span>
        </Link>
      </div>

      {/* Auth Card Content */}
      <div className="relative z-10 w-full max-w-[440px]">{children}</div>

      {/* Footer Links */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-xs text-gray-500">
          Built for Indian businesses • Secure • Privacy-first
        </p>
      </div>
    </div>
  );
}
