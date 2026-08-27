"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from "lucide-react";
import { parseEml } from "@/lib/emlParser";

/**
 * EmlUploader Component
 *
 * Provides a drag-and-drop file upload zone accepting .eml files,
 * parses headers and body content, and exposes the parsed structure.
 *
 * @param {Object} props
 * @param {Function} props.onEmlParsed - Callback invoked with parsed email object and formatted text.
 * @param {boolean} [props.disabled=false] - Whether upload is disabled.
 */
export default function EmlUploader({ onEmlParsed, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Processes a selected or dropped file.
   */
  function handleFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".eml") && !file.name.toLowerCase().endsWith(".txt") && file.type !== "message/rfc822") {
      setUploadError("Please upload a valid .eml file.");
      return;
    }

    setUploadError(null);
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = e.target.result;
        const parsed = parseEml(rawContent);
        if (typeof onEmlParsed === "function") {
          onEmlParsed(parsed);
        }
      } catch (err) {
        console.error("Error parsing .eml file:", err);
        setUploadError(err.message || "Failed to parse the .eml file.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to read the file. Please try again.");
      setIsProcessing(false);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFile(droppedFiles[0]);
    }
  }

  function handleFileInputChange(e) {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFile(selectedFiles[0]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/30"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml,message/rfc822,text/plain"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Parsing .eml structure & headers...
            </p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <FileCheck className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {fileName}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Click or drag another .eml file to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Click to browse or drag & drop .eml file
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Supports RFC 5322 formatted emails with headers, body, and MIME parts
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
