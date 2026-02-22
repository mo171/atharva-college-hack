"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getGhostSuggestion } from "@/lib/api";

import { EditorCanvas } from "@/features/editor/components/EditorCanvas";

const DEFAULT_HTML = `<p>Elias descended the worn stone steps, the smell of dried herbs and decay thickening with each step. The apothecary's cellar had always felt like a threshold between worlds—half laboratory, half crypt.</p><p><span class="insight-highlight insight-highlight-grammar" data-tooltip="This sentence has a complex structure. Consider shortening it for better flow.">He remembered the sunlit garden outside, a stark contrast to the darkness he now inhabited.</span> The memory felt distant, almost belonging to another man.</p><p><span class="insight-highlight insight-highlight-style" data-tooltip="This action feels abrupt. You might want to describe Elias's physical reaction to the draft.">He stood up and looked around the room, wondering where the potion could have gone.</span> The shelves were lined with amber bottles, their labels faded beyond recognition. None of them resembled what he had come for.</p><p>A faint draft stirred the dust. Elias turned, but the shadows yielded <span class="insight-highlight insight-highlight-spelling" data-tooltip="Possible typo: 'nothin'. Did you mean: nothing, notion, north?">nothin</span>. The silence was total—the kind of silence that seemed to listen.</p>`;

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

  const handleCompare = async () => {
    if (!projectId || !lastContentRef.current.trim() || isComparing) return;

    setIsComparing(true);
    try {
      const result = await generateSuggestions({
        projectId,
        content: lastContentRef.current,
      });

      if (result && result.status === "success") {
        setComparisonData({
          original: result.original_text || lastContentRef.current,
          suggested: result.suggested_text || lastContentRef.current,
        });
        setComparisonOpen(true);
      } else {
        console.error("Comparison failed: Invalid response", result);
        alert("Failed to generate suggestions. Please try again.");
      }
    } catch (err) {
      console.error("Comparison failed:", err);
      const status = err.response?.status;
      const errorMessage =
        err.response?.data?.detail || err.message || "Unknown error";

      if (status === 404) {
        alert(
          "Endpoint not found (404). Please restart your backend server to register the new /editor/generate-suggestions endpoint.\n\n" +
            "Error: " +
            errorMessage,
        );
      } else {
        alert(`Failed to generate suggestions: ${errorMessage}`);
      }
    } finally {
      setIsComparing(false);
    }
  };

  const handleApplyChanges = useCallback(
    (newText) => {
      if (editorContainerRef.current) {
        editorContainerRef.current.setContent(newText);
        // Trigger content change to save
        handleContentChange(newText);
      }
    },
    [handleContentChange],
  );

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    // Remove previously injected highlights before applying fresh ones.
    // This avoids nested spans and stale coloring when alerts change.
    const previousHighlights = el.querySelectorAll("span.insight-highlight");
    previousHighlights.forEach((span) => {
      const textNode = document.createTextNode(span.textContent || "");
      span.replaceWith(textNode);
    });
    el.normalize();

    if (!alerts || alerts.length === 0) return;

    // Helper to map alert types to CSS classes
    const getHighlightClass = (type) => {
      switch (type?.toUpperCase()) {
        case "SPELLING":
          return "insight-highlight-spelling";
        case "GRAMMAR":
        case "PUNCTUATION":
        case "STYLE":
          return "insight-highlight-grammar";
        case "INCONSISTENCY":
          return "insight-highlight-inconsistency";
        default:
          return "insight-highlight-grammar";
      }
    };

    const seen = new Set();
    const filteredAlerts = alerts.filter((alert) => {
      const originalText = (alert?.original_text || "").trim();
      if (!originalText) return false;
      const key = `${(alert?.type || "").toUpperCase()}|${originalText}|${alert?.explanation || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const getTextNodes = (root) => {
      const nodes = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const value = node.nodeValue || "";
          if (!value.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.closest(".insight-highlight")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
      }
      return nodes;
    };

    const highlightText = (root, text, highlightClass, tooltipText) => {
      const target = text.toLowerCase();
      const nodes = getTextNodes(root);

      nodes.forEach((node) => {
        const source = node.nodeValue || "";
        const lowerSource = source.toLowerCase();
        let cursor = 0;
        let matchIndex = lowerSource.indexOf(target, cursor);

        if (matchIndex === -1) return;

        const fragment = document.createDocumentFragment();
        while (matchIndex !== -1) {
          if (matchIndex > cursor) {
            fragment.appendChild(
              document.createTextNode(source.slice(cursor, matchIndex)),
            );
          }

          const matchedText = source.slice(
            matchIndex,
            matchIndex + text.length,
          );
          const span = document.createElement("span");
          span.className = `insight-highlight ${highlightClass}`;
          span.dataset.insightId = Math.random().toString(36).slice(2, 11);
          span.dataset.tooltip = tooltipText || "";
          span.textContent = matchedText;
          fragment.appendChild(span);

          cursor = matchIndex + text.length;
          matchIndex = lowerSource.indexOf(target, cursor);
        }

        if (cursor < source.length) {
          fragment.appendChild(document.createTextNode(source.slice(cursor)));
        }
        node.parentNode?.replaceChild(fragment, node);
      });
    };

    filteredAlerts.forEach((alert) => {
      const originalText = alert.original_text.trim();
      const highlightClass = getHighlightClass(alert.type);
      const tooltipText = alert.explanation || "";
      highlightText(el, originalText, highlightClass, tooltipText);
    });
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
          <span>&ldquo;{suggestion}&rdquo;</span>
        </div>
      )}
    </div>
  );
}

export { EditorContent };
