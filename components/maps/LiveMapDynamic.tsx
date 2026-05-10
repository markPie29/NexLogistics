"use client";
import dynamic from "next/dynamic";

export const LiveMapDynamic = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
      Loading map…
    </div>
  ),
});
