import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FocusOnIt - Task Manager",
  description: "Gestión de tareas simple y práctica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
        <SpeedInsights />
        {/* Sentry client-side initialization happens via sentry.client.config.ts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize Sentry client-side
              if (typeof window !== 'undefined') {
                window.__sentryReady = true;
              }
            `,
          }}
        />
      </body>
    </html>
  );
}