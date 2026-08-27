"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from "lucide-react";

/**
 * Maximum permitted .eml file size in bytes (5 MB).
 */
export const MAX_EML_FILE_SIZE = 5 * 1024 * 1024;

/**
 * EmailFileUpload Component (Dark SOC Drag & Drop Uploader)
 *
 * Provides drag-and-drop and file-picker upload for .eml files.
 * Validates file presence, extension (.eml), and file size (<= 5 MB),
 * sends the content to the server-side parser, and returns the parsed result.
 *
 * @param {Object} props
 * @param {Function} props.onEmailParsed - Callback invoked with the parsed email structure.
 * @param {boolean} [props.disabled=false] - Whether upload interaction is disabled.
 */
export default function EmailFileUpload({ onEmailParsed, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Validates and processes the selected .eml file.
   */
  async function processFile(file) {
    if (!file) return;

    setUploadError(null);

    // Validate file extension
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".eml")) {
      setUploadError("Invalid file type. Only .eml files are accepted (e.g., sample.eml).");
      return;
    }

    // Validate file size limit (5 MB)
    if (file.size > MAX_EML_FILE_SIZE) {
      setUploadError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`
      );
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      // Read file content and send to server-side parser
      const fileText = await file.text();

      if (!fileText.trim()) {
        throw new Error("The uploaded .eml file is empty.");
      }

      const response = await fetch("/api/parse-eml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emlContent: fileText }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to parse the .eml file structure.");
      }

      if (typeof onEmailParsed === "function") {
        onEmailParsed(result.data);
      }
    } catch (err) {
      console.error("EML upload/parse error:", err);
      setUploadError(err.message || "Failed to parse .eml file. Please ensure it is a valid email.");
    } finally {
      setIsParsing(false);
    }
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleInputChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isParsing && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-[#27272A] bg-[#141417] hover:border-[#3F3F46] hover:bg-[#18181B]"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml,message/rfc822"
          onChange={handleInputChange}
          disabled={disabled || isParsing}
          className="hidden"
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-xs font-semibold text-[#F4F4F5]">
              Parsing RFC 5322 .eml structure & headers...
            </p>
            <p className="text-[11px] text-[#71717A]">
              Extracting sender, recipient, body, URLs, and attachments
            </p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-[#F4F4F5] font-mono">
              {fileName}
            </p>
            <p className="text-[11px] text-[#71717A]">
              Click or drag another .eml file to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18181B] text-indigo-400 border border-[#27272A]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F4F4F5]">
                Click to browse or drag & drop an .eml file
              </p>
              <p className="mt-0.5 text-[11px] text-[#71717A]">
                Only RFC 5322 .eml files up to 5 MB are supported
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {uploadError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
