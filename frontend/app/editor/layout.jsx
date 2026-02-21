export default function EditorLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fffff2]">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
