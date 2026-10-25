import type { Metadata } from "next";
import "./globals.css";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
