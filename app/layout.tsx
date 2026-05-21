import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { BRAND } from "@/lib/config/brand";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B1220" },
    { media: "(prefers-color-scheme: dark)",  color: "#0B1220" },
  ],
};

export const metadata: Metadata = {
  title: `${BRAND.title} — ${BRAND.tagline}`,
  description: BRAND.description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: BRAND.title,
    description: `${BRAND.tagline} by ${BRAND.vendor}`,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pre-hydration theme detection — runs before React mounts to prevent FOUC.
  // Inline script with no user input; safe by construction. Errors are caught
  // because localStorage may be unavailable (private browsing) or contain
  // invalid JSON; in either case we fall back to light mode silently.
  const themeKey = `${BRAND.storeKey}-ui`;
  const themeScript = `try{var u=JSON.parse(localStorage.getItem(${JSON.stringify(themeKey)})||'{}');if(u&&u.state&&u.state.darkMode){document.documentElement.classList.add('dark')}}catch(_){}`;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
