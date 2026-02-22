"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

function Dialog({ open, onOpenChange, children, className, ...props }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
      // Focus trap
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onOpenChange?.(false);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange?.(false);
        }
      }}
      {...props}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          "relative z-50 w-full max-w-7xl max-h-[85vh] bg-white rounded-2xl shadow-xl border border-[#e8e8e0]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ children, className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogTitle({ children, className, ...props }) {
  return (
    <h2
      className={cn("text-lg font-semibold text-[#2e2e2e] leading-none", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

function DialogDescription({ children, className, ...props }) {
  return (
    <p
      className={cn("text-sm text-[#888] mt-2", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function DialogContent({ children, className, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

function DialogFooter({ children, className, ...props }) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogClose({ onClose, className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("absolute right-4 top-4 h-8 w-8 rounded-md", className)}
      onClick={onClose}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  );
}

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
};
