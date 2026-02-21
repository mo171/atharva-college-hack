import { StudioSidebar } from "@/app/components/studio";

export default function StartWritingLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#fffff2]">
      <StudioSidebar />
      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
