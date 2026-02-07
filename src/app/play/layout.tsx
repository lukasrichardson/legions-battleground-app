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
      
        <ClientLayout>
          {children}
        </ClientLayout>
    </html>
    
  )
}
