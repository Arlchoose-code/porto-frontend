import { Settings } from "@/lib/types";

async function getSettings(): Promise<Settings> {
    try {
        const res = await fetch(`${process.env.API_URL}/settings`, {
            cache: "no-store",
        });
        const json = await res.json();
        return json.data || {};
    } catch {
        return {};
    }
}

export default async function MaintenancePage() {
    const settings = await getSettings();

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {settings.logo_url ? (
                    <img
                        src={settings.logo_url}
                        alt={settings.site_title || "Logo"}
                        className="w-16 h-16 mx-auto mb-6 rounded-xl object-contain"
                    />
                ) : (
                    <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>
                )}

                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Sedang Maintenance
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    {settings.site_title || "Website"}
                </h1>

                <p className="text-gray-400 text-sm leading-relaxed">
                    {settings.maintenance_message || "Website sedang dalam perbaikan. Silakan kunjungi kembali nanti."}
                </p>

                {settings.contact_email && (
                    <a
                        href={`mailto:${settings.contact_email}`}
                        className="inline-flex items-center gap-1.5 mt-6 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {settings.contact_email}
                    </a>
                )}
            </div>
        </div>
    );
}