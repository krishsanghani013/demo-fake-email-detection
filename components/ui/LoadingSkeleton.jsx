"use client";

import React from "react";

/**
 * Loading Skeleton Primitives
 *
 * Provides subtle, dark-themed shimmering placeholder skeletons
 * while data is asynchronously loading.
 */

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-[#161D2D]" />
        <div className="h-3 w-20 rounded bg-[#161D2D]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-8 w-16 rounded bg-[#161D2D]" />
        <div className="h-3 w-28 rounded bg-[#161D2D]" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#1C2436] bg-[#111723] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-28 rounded bg-[#161D2D]" />
        <div className="h-4 w-44 rounded bg-[#161D2D]" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-20 rounded-full bg-[#161D2D]" />
        <div className="h-4 w-12 rounded bg-[#161D2D]" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-[#161D2D]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 rounded-lg bg-[#161D2D]" />
          <div className="h-24 rounded-lg bg-[#161D2D]" />
          <div className="h-24 rounded-lg bg-[#161D2D]" />
        </div>
      </div>
      <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-6 space-y-3">
        <div className="h-5 w-36 rounded bg-[#161D2D]" />
        <div className="h-32 rounded-lg bg-[#161D2D]" />
      </div>
    </div>
  );
}
