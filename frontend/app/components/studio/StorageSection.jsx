import { Progress } from "@/app/components/ui/progress";
import { cn } from "@/lib/utils";

function StorageSection({
  used = "1.2GB",
  total = "2.0GB",
  value = 60,
  className,
  ...props
}) {
  return (
    <div className={cn("px-3 space-y-3", className)} {...props}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Storage
        </p>
        <p className="text-[10px] font-bold text-slate-600">
          {value}%
        </p>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50">
        <div
          className="h-full rounded-full bg-slate-800 transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 font-medium">
        {used} of {total} Used
      </p>
    </div>
  );
}

export { StorageSection };
