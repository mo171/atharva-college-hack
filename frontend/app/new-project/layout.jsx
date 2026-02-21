import { NewProjectNavbar } from "@/app/components/new-project";

export default function NewProjectLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fffff2]">
      <NewProjectNavbar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
