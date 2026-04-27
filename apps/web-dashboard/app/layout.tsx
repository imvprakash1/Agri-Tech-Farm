import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NODE_LABELS, ALL_NODES } from "@/app/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farm Monitor",
  description: "Agri-Tech Farm monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <div className="flex h-screen">
          <nav className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface p-4">
            <Link href="/" className="text-lg font-bold mb-6 tracking-tight">
              Farm Monitor
            </Link>
            <div className="space-y-1">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                Overview
              </Link>
              {ALL_NODES.map((nodeId) => (
                <Link
                  key={nodeId}
                  href={`/nodes/${nodeId}`}
                  className="block rounded-lg px-3 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  {NODE_LABELS[nodeId]}
                </Link>
              ))}
            </div>
          </nav>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
