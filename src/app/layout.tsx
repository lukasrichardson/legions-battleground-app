import type { Metadata } from "next";
import "@/app/globals.css";
import StoreProvider from "@/client/redux/StoreProvider";
import NextAuthSessionProvider from "@/app/providers/SessionProvider";
import Script from "next/script";
import { ToastProvider } from "@/app/components/ToastProvider";

const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL || "";
const serviceWorkerUrl = (() => {
  try {
    const imageHost = new URL(r2PublicBaseUrl).hostname;
    return `/sw.js?imageHost=${encodeURIComponent(imageHost)}`;
  } catch {
    return "/sw.js";
  }
})();


export const metadata: Metadata = {
  title: "Legions Battleground",
  description: "A Legions Realms At War TCG simulator",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <NextAuthSessionProvider>
          <StoreProvider>
            <ToastProvider>{children}</ToastProvider>
            {/* Service Worker Registration for Image Caching */}
            <Script
              id="sw-registration"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register(${JSON.stringify(serviceWorkerUrl)})
                      .then(function(registration) {
                        var worker = registration.active || registration.waiting || registration.installing;
                        if (worker) {
                          worker.postMessage({
                            type: 'CONFIGURE_IMAGE_HOST',
                            publicBaseUrl: ${JSON.stringify(r2PublicBaseUrl)}
                          });
                        }
                        console.log('[App] Service Worker registered:', registration.scope);
                      })
                      .catch(function(error) {
                        console.warn('[App] Service Worker registration failed:', error);
                      });
                  } else {
                    console.warn('[App] Service Worker not supported');
                  }
                `
              }}
            />
          </StoreProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
