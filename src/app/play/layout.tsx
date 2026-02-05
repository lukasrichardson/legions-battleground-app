import { Metadata } from "next";
import ClientLayout from "./clientLayout";

export const metadata: Metadata = {
  title: "Legions Battleground",
  description: "A Legions Realms At War online simulator",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
    
  )
}
