import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteNav } from "@/components/site-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "AGI Countdown",
  description: "A deterministic digital countdown clock to AGI."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
