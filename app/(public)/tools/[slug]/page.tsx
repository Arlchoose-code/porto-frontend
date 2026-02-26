import { Metadata } from "next";
import { Tool } from "@/lib/types";
import ToolDetailClient, { FieldSchema } from "@/components/public/tool-detail-client";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ slug: string }>;
}

interface ToolWithSchema {
    tool: Tool;
    inputSchema: FieldSchema[];
    docs?: any;
}

async function getToolWithSchema(slug: string): Promise<ToolWithSchema | null> {
    try {
        const res = await fetch(`${process.env.API_URL}/tools/${slug}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        const data = json.data;
        if (!data) return null;
        return {
            tool: data.tool as Tool,
            inputSchema: (data.input_schema ?? []) as FieldSchema[],
            docs: data.docs ?? null,
        };
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const [result, settings] = await Promise.all([getToolWithSchema(slug), getSettings()]);
    if (!result?.tool) return { title: "Tool Not Found" };

    const siteUrl = settings.site_url || "";
    const siteName = settings.site_title || "Portfolio";
    const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(result.tool.name)}&description=${encodeURIComponent(result.tool.description || "")}&type=tool&site=${encodeURIComponent(siteName)}`;

    return {
        title: { absolute: result.tool.name },
        description: result.tool.description || "",
        openGraph: {
            title: result.tool.name,
            description: result.tool.description || "",
            images: [{ url: ogImage, width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: result.tool.name,
            description: result.tool.description || "",
            images: [ogImage],
        },
    };
}

export default async function ToolDetailPage({ params }: Props) {
    const { slug } = await params;
    const result = await getToolWithSchema(slug);
    if (!result) notFound();
    return <ToolDetailClient tool={result.tool} inputSchema={result.inputSchema} docs={result.docs} />;
}