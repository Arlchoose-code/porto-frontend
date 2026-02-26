import { MetadataRoute } from "next";

const base = process.env.API_URL;

async function fetchAll(endpoint: string) {
    try {
        const res = await fetch(`${base}/${endpoint}`, { next: { revalidate: 3600 } });
        return res.ok ? (await res.json()).data || [] : [];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [settingsRes, blogs, projects, tools] = await Promise.all([
        fetch(`${base}/settings`, { next: { revalidate: 3600 } }),
        fetchAll("blogs?status=published&limit=100"),
        fetchAll("projects?limit=100"),
        fetchAll("tools?limit=100"),
    ]);

    const settings = settingsRes.ok ? (await settingsRes.json()).data || {} : {};
    const siteUrl = settings.site_url || "http://localhost:3000";

    const staticPages: MetadataRoute.Sitemap = [
        { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${siteUrl}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
        { url: `${siteUrl}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
        { url: `${siteUrl}/bookmarks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
        { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ];

    const blogPages: MetadataRoute.Sitemap = blogs
        .filter((b: any) => b.slug)
        .map((b: any) => ({
            url: `${siteUrl}/blog/${b.slug}`,
            lastModified: new Date(b.updated_at || b.created_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

    const projectPages: MetadataRoute.Sitemap = projects
        .filter((p: any) => p.slug)
        .map((p: any) => ({
            url: `${siteUrl}/projects/${p.slug}`,
            lastModified: new Date(p.updated_at || p.created_at),
            changeFrequency: "monthly" as const,
            priority: 0.6,
        }));

    const toolPages: MetadataRoute.Sitemap = tools
        .filter((t: any) => t.slug)
        .map((t: any) => ({
            url: `${siteUrl}/tools/${t.slug}`,
            lastModified: new Date(t.updated_at || t.created_at),
            changeFrequency: "monthly" as const,
            priority: 0.6,
        }));

    return [...staticPages, ...blogPages, ...projectPages, ...toolPages];
}