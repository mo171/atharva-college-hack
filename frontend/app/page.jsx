import {
  Navbar,
  HeroSection,
  EditorMockup,
  Footer,
  BackgroundDecorations,
} from "@/app/components/landing";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fffff2]">
      <BackgroundDecorations />
      <Navbar />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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
