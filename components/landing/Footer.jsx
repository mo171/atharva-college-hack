import { cn } from "@/lib/utils";

function Footer({
  text = "Trusted by over 50,000 novelists and screenwriters worldwide",
  className,
  ...props
}) {
  return (
    <footer
      className={cn(
        "py-12 text-center text-sm text-[#888]",
        className
      )}
      {...props}
    >
      {text}
    </footer>
  );
}

export { Footer };
