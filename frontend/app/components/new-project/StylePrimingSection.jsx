import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { FormSection } from "./FormSection";
import { cn } from "@/lib/utils";

function StylePrimingSection({
  file,
  onFileChange,
  analysisResult,
  className,
  ...props
}) {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <FormSection
      number={5}
      title="Behavioral Priming (Meso Scale)"
      description="Upload a previous manuscript (PDF/TXT) to prime the brain with your unique writing style."
      icon={UploadCloud}
      className={cn(className)}
      {...props}
    >
      <div className="space-y-4">
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#ced3ff] bg-[#f8f9ff] transition-colors hover:bg-[#f0f2ff]">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {file ? (
              <>
                <FileText className="mb-3 h-8 w-8 text-[#4a4a7a]" />
                <p className="text-sm font-medium text-[#4a4a7a]">
                  {file.name}
                </p>
                <p className="text-xs text-[#888]">Click to change file</p>
              </>
            ) : (
              <>
                <UploadCloud className="mb-3 h-8 w-8 text-[#ced3ff]" />
                <p className="text-sm text-[#888]">
                  <span className="font-semibold text-[#4a4a7a]">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-[#888]">PDF or TXT (Max 5MB)</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt"
            onChange={handleFileChange}
          />
        </label>

        {analysisResult && (
          <div className="rounded-lg bg-green-50 p-4 border border-green-100 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Style Analysis Complete
              </p>
              <p className="text-xs text-green-700 mt-1">
                Detected: {analysisResult.genre} genre,{" "}
                {analysisResult.dominant_emotion} tone.
              </p>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}

export { StylePrimingSection };
