"use client";

// import { useRef, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";

import { StoryBrainForm } from "@/app/components/new-project";
import { CalibrationViz } from "@/app/components/new-project";
import { Button } from "@/app/components/ui/button";



  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="overflow-auto py-8 px-6 lg:px-8 lg:pr-6">
       <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-[#e8e8e0] bg-white p-8 shadow-lg shadow-black/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-black/5">
          <StoryBrainForm />
        </div>
      </div>
      <div className="hidden flex-col gap-6 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:items-center lg:justify-start lg:overflow-auto lg:py-8 lg:pl-6 lg:pr-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <CalibrationViz
            calibrationPercent={65}
            className="min-h-[400px] w-full transition-shadow duration-300 hover:shadow-xl hover:shadow-black/5"
          />
        </div>
        <div className="w-full max-w-md space-y-2">
          <Button
            type="button"
            className="h-12 w-full gap-2 rounded-xl bg-[#2c3e72] text-white shadow-md transition-colors hover:bg-[#1e3a5f]"
            onClick={() => toast.success("Upload coming soon")}
          >
            <Upload className="h-4 w-4" />
            Upload Story for Behavioral Analysis
          </Button>
          <p className="text-center text-xs text-[#888]">
            PDF, DOC/DOCX, Image (PNG/JPG)
          </p>
        </div>
      </div>
    </div>
  );

