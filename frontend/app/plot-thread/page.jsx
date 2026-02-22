"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlotFlowCanvas } from "@/app/components/plot-thread/PlotFlowCanvas";
import { PlotThreadSidebar } from "@/app/components/plot-thread/PlotThreadSidebar";
import { PlotControls } from "@/app/components/plot-thread/PlotControls";
import { fetchPlotThread, extractPlotPoints } from "@/lib/api";
import { EditorNavbar } from "@/app/components/editor/EditorNavbar";
import toast from "react-hot-toast";

function PlotThreadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  const [plotData, setPlotData] = useState({
    plot_threads: [],
    plot_points: [],
    connections: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);

  useEffect(() => {
    if (!projectId) {
      router.replace("/new-project");
      return;
    }
    loadPlotData();
  }, [projectId, router]);

  const loadPlotData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await fetchPlotThread(projectId);
      if (data.status === "success") {
        setPlotData({
          plot_threads: data.plot_threads || [],
          plot_points: data.plot_points || [],
          connections: data.connections || [],
        });
        if (data.plot_threads?.length > 0 && !selectedThread) {
          setSelectedThread(data.plot_threads[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load plot thread:", err);
      toast.error("Failed to load plot thread data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!projectId || isExtracting) return;
    setIsExtracting(true);
    try {
      const result = await extractPlotPoints(projectId);
      if (result.status === "success") {
        toast.success(`Extracted ${result.plot_points_created} plot points`);
        await loadPlotData();
      } else {
        toast.error(result.message || "Failed to extract plot points");
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      toast.error("Failed to extract plot points");
    } finally {
      setIsExtracting(false);
    }
  };

  if (!projectId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-[#888]">Loading plot thread...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorNavbar />
      <div className="flex flex-1 overflow-hidden">
        <PlotThreadSidebar
          className="hidden lg:flex"
          plotThreads={plotData.plot_threads}
          selectedThread={selectedThread}
          onThreadSelect={setSelectedThread}
          onExtract={handleExtract}
          isExtracting={isExtracting}
        />
        <div className="flex flex-1 flex-col overflow-hidden bg-[#fffff2]">
          <PlotControls
            onExtract={handleExtract}
            isExtracting={isExtracting}
            hasData={plotData.plot_points.length > 0}
          />
          <PlotFlowCanvas
            plotThreads={plotData.plot_threads}
            plotPoints={plotData.plot_points}
            connections={plotData.connections}
            selectedThread={selectedThread}
            onUpdate={loadPlotData}
          />
        </div>
      </div>
    </div>
  );
}

export default function PlotThreadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <PlotThreadPageContent />
    </Suspense>
  );
}
