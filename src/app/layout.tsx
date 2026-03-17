import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} antialiased bg-background min-h-screen`}>
        <main className="pb-20 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
