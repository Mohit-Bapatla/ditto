import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./consumer.css";
import localFont from "next/font/local";
const manrope = localFont({
  src: [
    { path: "../public/fonts/manrope-400.ttf", weight: "400" },
    { path: "../public/fonts/manrope-600.ttf", weight: "600" },
    { path: "../public/fonts/manrope-700.ttf", weight: "700" },
  ],
  variable: "--font-body",
  display: "swap",
});
const syne = localFont({
  src: [
    { path: "../public/fonts/syne-700.ttf", weight: "700" },
    { path: "../public/fonts/syne-800.ttf", weight: "800" },
  ],
  variable: "--font-display",
  display: "swap",
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff9fa",
  interactiveWidget: "resizes-content",
};
export const metadata: Metadata = {
  title: "Ditto — Less scrolling. More living.",
  description:
    "Find your people through the things you love. Discover activities, match with friends, and make it happen.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${syne.variable}`}>
      <body>{children}</body>
    </html>
  );
}
