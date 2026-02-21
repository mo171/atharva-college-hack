"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { EditorCanvas } from "../components/EditorCanvas";

const DEFAULT_HTML = `<p>Elias descended the worn stone steps, the smell of dried herbs and decay thickening with each step. The apothecary's cellar had always felt like a threshold between worlds—half laboratory, half crypt.</p><p><span style="text-decoration: underline; text-decoration-color: #cff8ff; text-underline-offset: 2px;">He remembered the sunlit garden outside, a stark contrast to the darkness he now inhabited.</span> The memory felt distant, almost belonging to another man.</p><p><span style="border-radius: 4px; background-color: #fff5e1; padding: 0 2px;">He stood up and looked around the room, wondering where the potion could have gone.</span> The shelves were lined with amber bottles, their labels faded beyond recognition. None of them resembled what he had come for.</p><p>A faint draft stirred the dust. Elias turned, but the shadows yielded nothing. The silence was total—the kind of silence that seemed to listen.</p>`;

function EditorContainer({ onContentChange, className, ...props }) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const hasInitialized = useRef(false);

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
  }, [checkEmpty, onContentChange]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || hasInitialized.current) return;
    hasInitialized.current = true;
    el.innerHTML = DEFAULT_HTML;
    requestAnimationFrame(() => {
      el.focus();
    });
  }, []);

  return (
    <EditorCanvas
      editorRef={editorRef}
      initialHtml={DEFAULT_HTML}
      onInput={handleInput}
      placeholder="Start writing your story..."
      isEmpty={isEmpty}
      className={className}
      {...props}
    />
  );
}

export { EditorContainer };
