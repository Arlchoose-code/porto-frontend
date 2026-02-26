import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blog } from "@/lib/types";
import BlogDetailClient from "@/components/public/blog-detail-client";

async function getBlog(slug: string): Promise<Blog | null> {
    try {
        const res = await fetch(`${process.env.API_URL}/blogs/${slug}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return (await res.json()).data || null;
    } catch {
        return null;
    }
}

async function getSettings() {
    try {
        const res = await fetch(`${process.env.API_URL}/settings`, { next: { revalidate: 3600 } });
        return res.ok ? (await res.json()).data || {} : {};
    } catch { return {}; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const [blog, settings] = await Promise.all([getBlog(slug), getSettings()]);
    if (!blog) return { title: "Post Not Found" };

    const siteUrl = settings.site_url || "";
    const siteName = settings.site_title || "Portfolio";
    const ogImage = blog.cover_image || `${siteUrl}/api/og?title=${encodeURIComponent(blog.title)}&description=${encodeURIComponent(blog.description || "")}&type=blog&site=${encodeURIComponent(siteName)}`;

    return {
        title: { absolute: blog.title },
        description: blog.description || "",
        openGraph: {
            title: blog.title,
            description: blog.description || "",
            images: [{ url: ogImage, width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: blog.title,
            description: blog.description || "",
            images: [ogImage],
        },
    };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const blog = await getBlog(slug);
    if (!blog) notFound();
    return <BlogDetailClient blog={blog} />;
}