import { MetadataRoute } from "next";

async function getSiteUrl() {
    try {
        const res = await fetch(`${process.env.API_URL}/settings`, {
            next: { revalidate: 3600 },
        });
        const data = res.ok ? (await res.json()).data || {} : {};
        return data.site_url || "http://localhost:3000";
    } catch {
        return "http://localhost:3000";
    }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
    const siteUrl = await getSiteUrl();

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard", "/login", "/api", "/maintenance"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}