import { cn } from "@/lib/utils";

function CalibrationViz({
  calibrationPercent = 65,
  quote = '"The story is already written, we are just uncovering the synapses."',
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-[#e8e8e0] bg-gradient-to-br from-[#f8f7ff] to-[#f8deff]/40 p-8 shadow-md shadow-black/5",
        className
      )}
      {...props}
    >
      {/* Abstract network SVG with revolving animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="h-48 w-48 animate-spin text-[#ced3ff]"
          aria-hidden
          style={{ animationDuration: "24s" }}
        >
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.3" />
          </pattern>
        </defs>
        {/* Central nodes */}
        <circle cx="100" cy="100" r="4" fill="currentColor" />
        <circle cx="70" cy="80" r="3" fill="currentColor" />
        <circle cx="130" cy="80" r="3" fill="currentColor" />
        <circle cx="70" cy="120" r="3" fill="currentColor" />
        <circle cx="130" cy="120" r="3" fill="currentColor" />
        <circle cx="100" cy="60" r="2.5" fill="currentColor" />
        <circle cx="100" cy="140" r="2.5" fill="currentColor" />
        <circle cx="55" cy="100" r="2.5" fill="currentColor" />
        <circle cx="145" cy="100" r="2.5" fill="currentColor" />
        {/* Lines - solid */}
        <line x1="100" y1="100" x2="70" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="130" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="70" y2="120" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="130" y2="120" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="100" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="100" y2="140" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="55" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="100" x2="145" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        {/* Dashed lines */}
        <line x1="70" y1="80" x2="70" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
        <line x1="130" y1="80" x2="130" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
        <line x1="70" y1="80" x2="130" y2="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
        <line x1="70" y1="120" x2="130" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
      </svg>
      </div>

      {/* Calibration badge with progress indicator */}
      <div className="absolute top-1/2 left-1/2 z-10 flex w-full max-w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 px-6">
        <span className="inline-flex items-center rounded-xl border border-[#e8e8e0] bg-white/95 px-4 py-2.5 text-sm font-semibold tracking-wide text-[#4a4a7a] shadow-sm">
          ATMOSPHERIC CALIBRATION: {calibrationPercent}%
        </span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8e8e0]">
          <div
            className="h-full rounded-full bg-[#ced3ff] transition-all duration-500 ease-out"
            style={{ width: `${calibrationPercent}%` }}
          />
        </div>
      </div>

      {/* Quote - positioned at bottom */}
      <p className="mt-auto pt-8 text-right text-sm italic leading-relaxed text-[#888]">
        {quote}
      </p>
    </div>
  );
}

export { CalibrationViz };
