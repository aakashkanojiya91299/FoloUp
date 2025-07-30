import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: "STS - AI-powered Interview Platform",
  description:
    "AI-powered interview platform with integrated ATS resume matching and candidate management",
  icons: {
    icon: "/browser-client-icon.ico",
  },
  openGraph: {
    title: "STS - AI-powered Interview Platform",
    description:
      "AI-powered interview platform with integrated ATS resume matching and candidate management",
    siteName: "STS",
    images: [
      {
        url: "/sts-logo.svg",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STS - AI-powered Interview Platform",
    description:
      "AI-powered interview platform with integrated ATS resume matching and candidate management",
    images: ["/sts-logo.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased min-h-screen")}>
        {children}
        <Toaster
          toastOptions={{
            classNames: {
              toast: "bg-white",
              title: "text-black",
              description: "text-red-400",
              actionButton: "bg-[#06546e]",
              cancelButton: "bg-[#f26622]",
              closeButton: "bg-white-400",
            },
          }}
        />
      </body>
    </html>
  );
}
