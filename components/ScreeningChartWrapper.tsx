"use client";

import dynamic from "next/dynamic";

const ScreeningChart = dynamic(() => import("./ScreeningChart"), { ssr: false });

export default function ScreeningChartWrapper() {
  return <ScreeningChart />;
}
