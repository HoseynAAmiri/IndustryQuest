import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Suspense } from "react";
import { Flash } from "@/components/flash";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/server/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "IndustryQuest", template: "%s · IndustryQuest" },
  description: "Real projects. Real mentors. Proven skills.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="en" className={`${inter.variable} bg-background`} suppressHydrationWarning>
      <body className="min-h-screen bg-muted/40 font-sans text-foreground antialiased">
        <ThemeProvider>
          {session ? (
            <AppShell user={session.user}>{children}</AppShell>
          ) : (
            <div className="flex min-h-screen flex-col">
              <PublicHeader />
              <main id="main" className="flex-1">{children}</main>
              <PublicFooter />
            </div>
          )}
          <Toaster position="top-center" closeButton />
          <Suspense><Flash /></Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
