import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const TAGLINE = "Kıbrıs'ın Sepeti";

export const metadata: Metadata = {
  title: `SestaKıbrıs — ${TAGLINE}`,
  description:
    "Kıbrıs'ın Sepeti — yerel marketlerden çevrimiçi sipariş ve hızlı teslimat.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SestaKıbrıs",
    description: TAGLINE,
    type: "website",
    locale: "tr_TR",
    siteName: "SestaKıbrıs",
  },
  twitter: {
    card: "summary",
    title: "SestaKıbrıs",
    description: TAGLINE,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SestaKıbrıs",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E2B51",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
