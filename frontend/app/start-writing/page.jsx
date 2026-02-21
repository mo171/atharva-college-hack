"use client";

import { useState } from "react";

import {
  StudioHeader,
  ProjectTabs,
  ViewToggle,
  ProjectGrid,
} from "@/components/studio";

export default function StartWritingPage() {
  const [activeTab, setActiveTab] = useState("recent");
  const [view, setView] = useState("grid");

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8">
      <StudioHeader />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ViewToggle view={view} onViewChange={setView} />
      </div>
      <ProjectGrid />
    </div>
  );
}
