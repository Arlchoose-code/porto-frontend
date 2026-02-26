import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SettingsProvider } from "@/components/shared/settings-provider";
import DynamicHead from "@/components/shared/dynamic-head";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

async function getSettingsData() {
    try {
        const res = await fetch(`${process.env.API_URL}/settings`, {
            next: { revalidate: 3600 },
        });
        const json = await res.json();
        return json.data || {};
    } catch {
        return {};
    }
}

export async function generateMetadata(): Promise<Metadata> {
    try {
        const s = await getSettingsData();
        const siteName = s.site_title || "Syahril Portfolio";
        const faviconHref = s.favicon_url || "/favicon.ico";

        return {
            title: {
                default: siteName,
                template: `%s - ${siteName}`,
            },
            description: s.site_description || "",
            keywords: s.site_keywords || "",
            authors: s.site_author ? [{ name: s.site_author }] : undefined,
            metadataBase: new URL(s.site_url || "http://localhost:3001"),
            icons: {
                icon: [{ url: faviconHref }],
                shortcut: [{ url: faviconHref }],
                apple: [{ url: faviconHref }],
            },
            openGraph: {
                title: siteName,
                description: s.site_description || "",
                url: s.site_url || undefined,
                siteName: siteName,
                images: s.og_image ? [{ url: s.og_image }] : [],
                locale: s.og_locale || "id_ID",
                type: (s.og_type as any) || "website",
            },
            twitter: {
                card: "summary_large_image",
                site: s.twitter_handle || undefined,
                creator: s.twitter_handle || undefined,
                title: siteName,
                description: s.site_description || "",
                images: s.og_image ? [s.og_image] : [],
            },
            other: {
                ...(s.theme_color ? { "theme-color": s.theme_color } : {}),
            },
        };
    } catch {
        return {
            title: { default: "Syahril Portfolio", template: "%s - Syahril Portfolio" },
            description: "",
        };
    }
}

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const s = await getSettingsData();

    return (
        <html lang={s.site_language || "en"} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ThemeProvider>
                    <SettingsProvider>
                        <DynamicHead />
                        {children}
                    </SettingsProvider>
                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}