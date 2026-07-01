import type { Config } from "tailwindcss";

// Tailwind CSS v4 is CSS-first configured via `@import "tailwindcss"` in
// app/globals.css (see the `@theme` block there). This file is kept for
// tooling/editor compatibility and to make content globs explicit.
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
