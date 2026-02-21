"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getGhostSuggestion } from "@/lib/api";

import { EditorCanvas } from "../components/EditorCanvas";

const DEFAULT_HTML = `<p>Elias descended the worn stone steps, the smell of dried herbs and decay thickening with each step. The apothecary's cellar had always felt like a threshold between worlds—half laboratory, half crypt.</p><p><span style="text-decoration: underline; text-decoration-color: #cff8ff; text-underline-offset: 2px;">He remembered the sunlit garden outside, a stark contrast to the darkness he now inhabited.</span> The memory felt distant, almost belonging to another man.</p><p><span style="border-radius: 4px; background-color: #fff5e1; padding: 0 2px;">He stood up and looked around the room, wondering where the potion could have gone.</span> The shelves were lined with amber bottles, their labels faded beyond recognition. None of them resembled what he had come for.</p><p>A faint draft stirred the dust. Elias turned, but the shadows yielded nothing. The silence was total—the kind of silence that seemed to listen.</p>`;

function EditorContainer({ onContentChange, alerts, className, ...props }) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const hasInitialized = useRef(false);
  const [suggestion, setSuggestion] = useState("");
  const idleTimerRef = useRef(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

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

    alerts.forEach((alert) => {
      if (alert.original_text && alert.type === "INCONSISTENCY") {
        // Prevent infinite loops or redundant wrapping
        if (
          html.includes(alert.original_text) &&
          !html.includes(`data-alert-text="${alert.original_text}"`)
        ) {
          const escapedText = alert.original_text.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );
          const regex = new RegExp(escapedText, "g");
          html = html.replace(
            regex,
            `<span class="inconsistency-highlight" data-alert-text="${alert.original_text}" style="background-color: rgba(255, 230, 230, 1); border-bottom: 2px solid #ff4d4d; border-radius: 2px; cursor: help;" title="${alert.explanation}">${alert.original_text}</span>`,
          );
          modified = true;
        }
      }
    });

    if (modified) {
      // Save cursor position if possible or just update
      // For this demo, we update. In production, use a state-managed editor.
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
}

export { EditorContainer };
