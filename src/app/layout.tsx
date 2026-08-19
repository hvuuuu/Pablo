import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pablo — Memory Card Game",
  description: "A fast-paced Memory/Golf-style card game for 2-6 players. Remember your cards, track your opponents, and call Pablo when you think you have the lowest score!",
  keywords: ["pablo", "card game", "memory game", "golf card game", "multiplayer"],
  authors: [{ name: "Pablo Game" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)] bg-background text-foreground">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="top-center"
          richColors
          theme="dark"
          toastOptions={{
            className: "border-slate-800 bg-slate-900",
          }}
        />
      </body>
    </html>
  );
}
