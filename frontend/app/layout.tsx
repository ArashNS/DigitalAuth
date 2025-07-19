import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Digital Document Manager",
  description: "",
  generator: "v0.dev",
  icons: "/icon.svg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
