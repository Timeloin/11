import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simran Mobile",
  description: "Simran Mobile Inventory & Shop Management System",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/api/app-icon",
    shortcut: "/api/app-icon",
    apple: "/api/app-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Simran Mobile",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4965fa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/api/app-icon" />
        <link rel="apple-touch-icon" href="/api/app-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Simran Mobile" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#4965fa" />
      </head>
      <body className="min-h-full bg-gray-100 antialiased">{children}</body>
    </html>
  );
}

