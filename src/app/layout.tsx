import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

const metadata = {
    title: "FoloUp - AI-powered Interview Platform",
    description: "AI-powered interview platform with integrated ATS resume matching and candidate management",
    openGraph: {
        title: "FoloUp - AI-powered Interview Platform",
        description: "AI-powered interview platform with integrated ATS resume matching and candidate management",
        siteName: "FoloUp",
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
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
                <link rel="icon" href="/browser-client-icon.ico" />
            </head>
            <body
                className={cn(
                    inter.className,
                    "antialiased min-h-screen",
                )}
            >
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
