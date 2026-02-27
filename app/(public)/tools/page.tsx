import { cache } from "react";
import { Metadata } from "next";
import { Tool } from "@/lib/types";
import ToolsClient from "@/components/public/tools-client";

const getTools = cache(async (): Promise<Tool[]> => {
    try {
        const res = await fetch(`${process.env.API_URL}/tools`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        return (await res.json()).data || [];
    } catch {
        return [];
    }
});

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Tools" };
}

export default async function ToolsPage() {
    const tools = await getTools();
    return <ToolsClient tools={tools} />;
}