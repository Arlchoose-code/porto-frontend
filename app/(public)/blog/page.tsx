import { Metadata } from "next";
import { Blog, Tag } from "@/lib/types";
import BlogClient from "@/components/public/blog-client";

const LIMIT = 9;

interface BlogPageProps {
    searchParams: Promise<{ page?: string; search?: string; tag?: string }>;
}

async function getData(page: number, search: string, tag: string) {
    const base = process.env.API_URL;
    const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(tag && { tag }),
    });

    const [blogsRes, tagsRes] = await Promise.all([
        fetch(`${base}/blogs?${params}`, { next: { revalidate: 60 } }),
        fetch(`${base}/tags?limit=10`, { next: { revalidate: 3600 } }),
    ]);

    const blogsJson = blogsRes.ok ? await blogsRes.json() : { data: [], meta: { total_pages: 1, total: 0, page: 1, limit: LIMIT } };
    const blogs: Blog[] = blogsJson.data || [];
    const meta = blogsJson.meta || { total_pages: 1, total: 0, page: 1, limit: LIMIT };
    const tagsJson = tagsRes.ok ? await tagsRes.json() : { data: [], meta: { total_pages: 1 } };
    const tags: Tag[] = tagsJson.data || [];
    const tagsMeta = tagsJson.meta || { total_pages: 1 };

    return { blogs, meta, tags, tagsMeta };
}

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Blog" };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const sp = await searchParams;
    const page = Number(sp.page) || 1;
    const search = sp.search || "";
    const tag = sp.tag || "";

    const { blogs, meta, tags, tagsMeta } = await getData(page, search, tag);

    return <BlogClient blogs={blogs} meta={meta} tags={tags} tagsTotalPages={tagsMeta.total_pages} currentPage={page} currentSearch={search} currentTag={tag} />;
}