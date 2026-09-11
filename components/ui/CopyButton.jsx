"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Reusable CopyButton Component
 *
 * Copies text to clipboard and displays brief visual confirmation.
 *
 * @param {Object} props
 * @param {string} props.text - Text to copy.
 * @param {string} [props.label] - Optional label to show next to icon.
 * @param {string} [props.className] - Additional CSS classes.
 */
export default function CopyButton({ text, label, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      aria-label={copied ? "Copied" : `Copy ${text}`}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-mono transition-colors ${
        copied
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-[#161D2D] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1D263B] border border-[#253046]"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span>{label ? "Copied" : ""}</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{label || ""}</span>
        </>
      )}
    </button>
  );
}
