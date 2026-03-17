import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "0815Poll - Easy Polling",
  description: "Create and share polls easily. Standard, schedule, location, and custom polls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background min-h-screen">
        <main className="pb-20 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
