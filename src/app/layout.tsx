import type { Metadata } from "next";
import "@/app/globals.css";
import StoreProvider from "@/client/redux/StoreProvider";
import NextAuthSessionProvider from "@/app/providers/SessionProvider";
import Script from "next/script";
import grue from "PUBLIC/Gemini_Generated_Image_vsbv5avsbv5avsbv.png";


export const metadata: Metadata = {
  title: "Legions Battleground",
  description: "A Legions Realms At War TCG simulator",
  icons: {
    icon: grue.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextAuthSessionProvider>
      <StoreProvider>
        <html lang="en">
          {/* google ads - work in progress */}
          <head>
            {
            process.env.NODE_ENV === "production" &&
            // process.env.NODE_ENV !== "production" &&
            <Script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx"
              crossOrigin="use-credentials"
              strategy="lazyOnload"
            />
          
            // <Script 
            //   async
            //   src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8541093288812908"
            //   crossOrigin="anonymous"
            //   strategy="afterInteractive"
            // />
            }
          </head>
          {/**/}
          <body>
            {children}
            {/* Service Worker Registration for Image Caching */}
            <Script
              id="sw-registration"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
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
          </body>
        </html>
      </StoreProvider>
    </NextAuthSessionProvider>
  );
}
