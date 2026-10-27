import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { site } from "@/config/site";

// Fonts are stored in /public/fonts so the site works without reaching Google.
const figtree = localFont({
  src: "../../public/fonts/Figtree-latin-variable.woff2",
  variable: "--font-figtree",
  display: "swap",
  weight: "300 900",
});

const bricolage = localFont({
  src: "../../public/fonts/BricolageGrotesque-latin-variable.woff2",
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: { default: `${site.name} | Trusted tutors for every child`, template: `%s | ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${bricolage.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
