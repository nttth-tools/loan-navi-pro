import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // 親フォルダに package-lock.json があるため、
    // Turbopack がワークスペースルートを誤認する問題を修正
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
