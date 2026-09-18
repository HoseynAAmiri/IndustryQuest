import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IndustryQuest",
  description: "Real projects. Real mentors. Proven skills.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
