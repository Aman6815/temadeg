import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ተማደግ | Temadeg",
  description: "Tutoring for students from KG to Grade 12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}