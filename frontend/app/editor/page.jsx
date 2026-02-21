"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  EditorNavbar,
  StoryBrainSidebar,
  EditorContent,
  AIInsightsSidebar,
} from "@/app/components/editor";
import { fetchStoryBrain } from "@/lib/api";

function EditorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  const [storyBrain, setStoryBrain] = useState({
    entities: [],
    recentHistory: [],
  });
  const [alerts, setAlerts] = useState([]);
  const [activeEntityNames, setActiveEntityNames] = useState([]);

  useEffect(() => {
    if (!projectId) {
      router.replace("/new-project");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchStoryBrain(projectId);
        if (!cancelled) {
          setStoryBrain({
            entities: data.entities ?? [],
            recentHistory: data.recent_history ?? [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load story brain:", err);
        }
      }
    };
    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId, router]);

  if (!projectId) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorNavbar />
      <div className="flex flex-1 overflow-hidden">
        <StoryBrainSidebar
          className="hidden lg:flex"
          projectId={projectId}
          entities={storyBrain.entities}
          activeEntityNames={activeEntityNames}
          recentHistory={storyBrain.recentHistory}
          onStoryBrainUpdate={setStoryBrain}
        />
        <EditorContent
          projectId={projectId}
          alerts={alerts}
          onAnalysis={(payload) => {
            setAlerts(payload?.alerts ?? []);
            if (payload?.entities) {
              const names = payload.entities.map((e) => e.name);
              setActiveEntityNames(names);
            }
          }}
          onStoryBrainRefresh={() => {
            if (projectId) {
              fetchStoryBrain(projectId).then((data) =>
                setStoryBrain({
                  entities: data.entities ?? [],
                  recentHistory: data.recent_history ?? [],
                }),
              );
            }
          }}
        />
        <AIInsightsSidebar className="hidden xl:flex" alerts={alerts} />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <EditorPageContent />
    </Suspense>
  );
}
