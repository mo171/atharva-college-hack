import { cn } from "@/lib/utils";

function FormSection({ number, title, icon: Icon, subtitle, children, className, ...props }) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="text-[#5a5fd8]">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
          {number}. {title}
        </h3>
      </div>
      {subtitle && (
        <p className="text-sm text-[#666]">{subtitle}</p>
      )}
      {children}
    </section>
  );
}

export { FormSection };
