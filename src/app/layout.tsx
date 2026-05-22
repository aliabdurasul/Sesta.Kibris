import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const TAGLINE = "Kıbrıs'ın günlük yaşam uygulaması";

export const metadata: Metadata = {
  title: `SestaKıbrıs — ${TAGLINE}`,
  description:
    "Market, su, tüp ve yerel dükkan siparişi — hızlı teslimat, güvenli ödeme.",
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
  themeColor: "#101828",
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
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
