import { StudioSidebar } from "@/app/components/studio";
import { BackgroundDecorations } from "@/app/components/landing";

export default function StartWritingLayout({ children }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#fffff2]">
      <BackgroundDecorations />
      <StudioSidebar className="relative z-20" />
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
