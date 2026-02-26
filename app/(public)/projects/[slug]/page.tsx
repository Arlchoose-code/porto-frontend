import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Project } from "@/lib/types";
import ProjectDetailClient from "@/components/public/project-detail-client";

async function getProject(slug: string): Promise<Project | null> {
    try {
        const res = await fetch(`${process.env.API_URL}/projects/${slug}`, {
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
    const [project, settings] = await Promise.all([getProject(slug), getSettings()]);
    if (!project) return { title: "Project Not Found" };

    const siteUrl = settings.site_url || "";
    const siteName = settings.site_title || "Portfolio";
    const ogImage = project.images?.[0]?.image_url || `${siteUrl}/api/og?title=${encodeURIComponent(project.title)}&description=${encodeURIComponent(project.description || "")}&type=project&site=${encodeURIComponent(siteName)}`;

    return {
        title: { absolute: project.title },
        description: project.description || "",
        openGraph: {
            title: project.title,
            description: project.description || "",
            images: [{ url: ogImage, width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: project.title,
            description: project.description || "",
            images: [ogImage],
        },
    };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = await getProject(slug);
    if (!project) notFound();
    return <ProjectDetailClient project={project} />;
}