import {
  Navbar,
  HeroSection,
  EditorMockup,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffff2]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <HeroSection />
        <section
          id="demo"
          className="mx-auto max-w-5xl pb-16 pt-12 sm:pb-24 sm:pt-16"
        >
          <EditorMockup />
        </section>
        <Footer />
      </main>
    </div>
  );
}
