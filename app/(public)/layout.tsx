import PublicNavbar from "@/components/shared/public-navbar";
import PublicFooter from "@/components/shared/public-footer";
import { Settings, Profile } from "@/lib/types";

async function getSettings(): Promise<Settings> {
    try {
        const res = await fetch(`${process.env.API_URL}/settings`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return {};
        const json = await res.json();
        return json.data || {};
    } catch {
        return {};
    }
}

async function getProfile(): Promise<Profile | null> {
    try {
        const res = await fetch(`${process.env.API_URL}/profile`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || null;
    } catch {
        return null;
    }
}

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