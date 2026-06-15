import "./globals.css";
import { Providers } from "@/components/Providers";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const metadata: Metadata = {
  title: "Client Issue Tracker | Monitor & Resolve",
  description: "A premium modern SaaS platform to monitor websites, create support requests, track issues, and communicate progress.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
