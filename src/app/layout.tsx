import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawerProvider";
import { GlobalSearchProvider } from "@/components/dashboard/GlobalSearchProvider";
import { EditorPreferencesProvider } from "@/components/dashboard/EditorPreferencesProvider";
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
  title: "DevDrop — Developer Knowledge Hub",
  description:
    "A unified hub for developer knowledge & resources — snippets, prompts, commands, notes, files, images, and links, all in one searchable place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <EditorPreferencesProvider>
            <ItemDrawerProvider>
              <GlobalSearchProvider>{children}</GlobalSearchProvider>
            </ItemDrawerProvider>
          </EditorPreferencesProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
