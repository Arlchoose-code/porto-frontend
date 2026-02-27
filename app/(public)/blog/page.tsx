import { cache } from "react";
import { Metadata } from "next";
import { Blog, Tag } from "@/lib/types";
import BlogClient from "@/components/public/blog-client";

const LIMIT = 9;

interface BlogPageProps {
    searchParams: Promise<{ page?: string; search?: string; tag?: string }>;
}

// Tags jarang berubah — cache 1 jam
const getTags = cache(async () => {
    const base = process.env.API_URL;
    const res = await fetch(`${base}/tags?limit=10`, { next: { revalidate: 3600 } });
    const json = res.ok ? await res.json() : { data: [], meta: { total_pages: 1 } };
    return {
        tags: (json.data || []) as Tag[],
        tagsMeta: json.meta || { total_pages: 1 },
    };
});

async function getBlogs(page: number, search: string, tag: string) {
    const base = process.env.API_URL;
    const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(tag && { tag }),
    });
    const res = await fetch(`${base}/blogs?${params}`, { next: { revalidate: 60 } });
    const json = res.ok ? await res.json() : { data: [], meta: { total_pages: 1, total: 0, page: 1, limit: LIMIT } };
    return {
        blogs: (json.data || []) as Blog[],
        meta: json.meta || { total_pages: 1, total: 0, page: 1, limit: LIMIT },
    };
}

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Blog" };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const sp = await searchParams;
    const page = Number(sp.page) || 1;
    const search = sp.search || "";
    const tag = sp.tag || "";

    const [{ blogs, meta }, { tags, tagsMeta }] = await Promise.all([
        getBlogs(page, search, tag),
        getTags(),
    ]);

    return (
        <BlogClient
            blogs={blogs}
            meta={meta}
            tags={tags}
            tagsTotalPages={tagsMeta.total_pages}
            currentPage={page}
            currentSearch={search}
            currentTag={tag}
        />
    );
}