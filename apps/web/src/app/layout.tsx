import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PublicHeader } from "@/components/public-header";
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-muted/40 font-sans text-foreground antialiased">
        <ThemeProvider>
          {session ? (
            <AppShell user={session.user}>{children}</AppShell>
          ) : (
            <>
              <PublicHeader />
              <main id="main">{children}</main>
            </>
          )}
          <Toaster position="top-center" closeButton />
          <Suspense><Flash /></Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
