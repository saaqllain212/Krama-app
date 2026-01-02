import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Krama OS",
  description: "War Room for Competitive Exams",
  manifest: "/manifest.json",
  themeColor: "#000000",
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
