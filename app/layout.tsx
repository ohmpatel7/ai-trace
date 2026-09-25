import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "./components/Shell";

export const metadata: Metadata = {
  title: "AI Trace",
  description: "A Lane 2 AI-use workspace for students and a Process Visualiser for graders. INFOMGMT 399 Team 12 prototype.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
