import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SestaKıbrıs",
  description: "Mahalle ticaretinin işletim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
