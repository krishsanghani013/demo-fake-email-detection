"use client";

import React from "react";
import { FolderSearch, Plus, ShieldCheck } from "lucide-react";

/**
 * Reusable EmptyState Component
 *
 * Displays a clean, professional cybersecurity empty state when data is not yet present.
 *
 * @param {Object} props
 * @param {React.ComponentType} [props.icon=FolderSearch] - Icon component.
 * @param {string} props.title - Main title.
 * @param {string} props.description - Explanatory subtitle.
 * @param {string} [props.actionLabel] - Primary CTA button label.
 * @param {Function} [props.onAction] - Primary CTA click handler.
 * @param {string} [props.secondaryActionLabel] - Optional secondary button label.
 * @param {Function} [props.onSecondaryAction] - Optional secondary click handler.
 */
export default function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#1C2436] bg-[#111723] p-10 sm:p-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#161D2D] border border-[#253046] text-[#60A5FA] shadow-[0_0_24px_rgba(59,130,246,0.12)]">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-[#F8FAFC]">
        {title}
      </h3>

      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#94A3B8]">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#253046] bg-[#161D2D] px-4 text-xs font-medium text-[#F8FAFC] transition-all hover:bg-[#1D263B] hover:border-[#384A6E]"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
