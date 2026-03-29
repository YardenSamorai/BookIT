import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SerwistProvider } from "./serwist-provider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "BookIT",
  description: "Premium appointment booking for small businesses",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BookIT",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={cn("font-sans antialiased", geist.variable)}>
      <body className="bg-background text-foreground">
        <SerwistProvider swUrl="/serwist/sw.js">
          <TooltipProvider>{children}</TooltipProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
