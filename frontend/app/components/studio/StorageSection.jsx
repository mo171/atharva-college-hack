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
    <div className={cn("space-y-2", className)} {...props}>
      <p className="text-xs font-medium uppercase tracking-wider text-[#888]">
        Storage
      </p>
      <p className="text-sm text-[#666]">
        {used} of {total} Used
      </p>
      <Progress
        value={value}
        className="h-1.5 rounded-full bg-[#e8e8e0] [&>div]:bg-[#7cb87c]"
      />
    </div>
  );
}

export { StorageSection };
