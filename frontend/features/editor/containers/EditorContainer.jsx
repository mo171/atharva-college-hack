"use client";

import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { useSearchParams } from "next/navigation";
import { getGhostSuggestion } from "@/lib/api";

import { EditorCanvas } from "../components/EditorCanvas";

const DEFAULT_HTML = `<p>Elias descended the worn stone steps, the smell of dried herbs and decay thickening with each step. The apothecary's cellar had always felt like a threshold between worlds—half laboratory, half crypt.</p><p><span class="insight-highlight insight-highlight-grammar" data-tooltip="This sentence has a complex structure. Consider shortening it for better flow.">He remembered the sunlit garden outside, a stark contrast to the darkness he now inhabited.</span> The memory felt distant, almost belonging to another man.</p><p><span class="insight-highlight insight-highlight-style" data-tooltip="This action feels abrupt. You might want to describe Elias's physical reaction to the draft.">He stood up and looked around the room, wondering where the potion could have gone.</span> The shelves were lined with amber bottles, their labels faded beyond recognition. None of them resembled what he had come for.</p><p>A faint draft stirred the dust. Elias turned, but the shadows yielded <span class="insight-highlight insight-highlight-spelling" data-tooltip="Possible typo: 'nothin'. Did you mean: nothing, notion, north?">nothin</span>. The silence was total—the kind of silence that seemed to listen.</p>`;

const EditorContainer = forwardRef(function EditorContainer({ onContentChange, alerts, className, ...props }, ref) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const hasInitialized = useRef(false);
  const [suggestion, setSuggestion] = useState("");
  const idleTimerRef = useRef(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setContent: (text) => {
      const el = editorRef.current;
      if (el) {
        // Convert plain text to HTML paragraphs
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
        const html = paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
        el.innerHTML = html || '<p></p>';
        setIsEmpty(!text.trim());
        if (onContentChange) {
          onContentChange(text);
        }
      }
    },
    getContent: () => {
      const el = editorRef.current;
      return el ? el.innerText : "";
    }
  }));

  const checkEmpty = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText?.trim() ?? "";
    setIsEmpty(text.length === 0);
  }, []);

  const handleInput = useCallback(() => {
    checkEmpty();
    const el = editorRef.current;
    if (el && onContentChange) {
      onContentChange(el.innerText ?? "");
    }

    // --- MESO (GHOST TEXT) TRIGGER ---
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setSuggestion(""); // Clear existing suggestion on type

    idleTimerRef.current = setTimeout(async () => {
      if (!el || !projectId) return;
      const text = el.innerText || "";
      const lastWords = text.split(/\s+/).slice(-200).join(" ");

      try {
        const res = await getGhostSuggestion({ projectId, content: lastWords });
        if (res.status === "success" && res.suggestion) {
          setSuggestion(res.suggestion);
        }
      } catch (err) {
        console.error("Ghost suggestion error:", err);
      }
    }, 2000);
  }, [checkEmpty, onContentChange, projectId]);

  // Handle Tab key to commit suggestion
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const handleKeyDown = (e) => {
      if (e.key === "Tab" && suggestion) {
        e.preventDefault();

        // Simple implementation: append to end or cursor
        // For contenteditable, we can append to innerText
        const currentText = el.innerText || "";
        const newText = currentText.endsWith(" ")
          ? currentText + suggestion
          : currentText + " " + suggestion;

        // This is a destructive update, in production use Document fragments or selection API
        el.innerText = newText;
        setSuggestion("");
        if (onContentChange) onContentChange(newText);

        // Focus end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [suggestion, onContentChange]);

  useEffect(() => {
    if (!alerts || alerts.length === 0 || !editorRef.current) return;

    const el = editorRef.current;
    let html = el.innerHTML;
    let modified = false;

    // Helper to map alert types to CSS classes
    const getHighlightClass = (type) => {
      switch (type?.toUpperCase()) {
        case "SPELLING":
          return "insight-highlight-spelling";
        case "GRAMMAR":
          return "insight-highlight-grammar";
        case "STYLE":
          return "insight-highlight-style";
        case "INCONSISTENCY":
          return "insight-highlight-inconsistency";
        default:
          return "insight-highlight-style";
      }
    };

    alerts.forEach((alert) => {
      if (alert.original_text) {
        // Prevent redundant wrapping
        if (
          html.includes(alert.original_text) &&
          !html.includes(`data-insight-id`)
        ) {
          const escapedText = alert.original_text.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );
          const regex = new RegExp(`(?<!<[^>]*)${escapedText}(?![^<]*>)`, "g"); // Avoid wrapping text inside tags

          const highlightClass = getHighlightClass(alert.type);
          const tooltipText = alert.explanation;

          html = html.replace(
            regex,
            `<span class="insight-highlight ${highlightClass}" data-insight-id="${Math.random().toString(36).substr(2, 9)}" data-tooltip="${tooltipText.replace(/"/g, "&quot;")}">${alert.original_text}</span>`,
          );
          modified = true;
        }
      }
    });

    if (modified) {
      el.innerHTML = html;
    }
  }, [alerts]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || hasInitialized.current) return;
    hasInitialized.current = true;
    el.innerHTML = DEFAULT_HTML;
    // setIsEmpty(false);
    requestAnimationFrame(() => {
      el.focus();
    });
  }, []);

  return (
    <div className="relative">
      <EditorCanvas
        editorRef={editorRef}
        initialHtml={DEFAULT_HTML}
        onInput={handleInput}
        placeholder="Start writing your story..."
        isEmpty={isEmpty}
        className={className}
        {...props}
      />
      {suggestion && (
        <div className="pointer-events-none absolute right-10 bottom-10 max-w-xs animate-in fade-in slide-in-from-bottom-2 bg-white/80 backdrop-blur p-3 rounded-lg border border-[#ced3ff] shadow-sm text-sm text-[#4a4a7a] italic">
          <span className="text-xs font-bold text-[#ced3ff] block mb-1 uppercase tracking-widest">
            Ghost Suggestion (Tab to Accept)
          </span>
          "{suggestion}"
        </div>
      )}
    </div>
  );
});

export { EditorContainer };
