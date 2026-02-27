import { cache } from "react";
import PublicNavbar from "@/components/shared/public-navbar";
import PublicFooter from "@/components/shared/public-footer";
import { Settings, Profile } from "@/lib/types";

// cache() = deduplicate fetch dalam 1 request
const getSettings = cache(async (): Promise<Settings> => {
    try {
        const res = await fetch(`${process.env.API_URL}/settings`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return {};
        return (await res.json()).data || {};
    } catch {
        return {};
    }
});

const getProfile = cache(async (): Promise<Profile | null> => {
    try {
        const res = await fetch(`${process.env.API_URL}/profile`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return (await res.json()).data || null;
    } catch {
        return null;
    }
});

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [settings, profile] = await Promise.all([getSettings(), getProfile()]);

    return (
        <div className="min-h-screen flex flex-col bg-background transition-colors duration-300 overflow-x-hidden">
            <PublicNavbar settings={settings} />
            <main className="flex-1">
                {children}
            </main>
            <PublicFooter settings={settings} profile={profile} />
        </div>
    );
}