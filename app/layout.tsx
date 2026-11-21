import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import PrismIntro from "@/components/PrismIntro";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRISM",
  description: "See your progress. Shape your future.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} style={{ ["--font-sans" as string]: "var(--font-geist-sans)" }}>
      <body><PrismIntro />{children}</body>
    </html>
  );
}
