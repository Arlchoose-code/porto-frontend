import { cache } from "react";
import { Metadata } from "next";
import { Bookmark } from "@/lib/types";
import BookmarksClient from "@/components/public/bookmarks-client";

const LIMIT = 15;

interface BookmarksPageProps {
    searchParams: Promise<{ search?: string; topic?: string }>;
}

// Topics adalah data statis (jarang berubah) — cache lebih lama
const getTopics = cache(async (): Promise<string[]> => {
    try {
        const base = process.env.API_URL;
        const res = await fetch(`${base}/bookmarks?page=1&limit=200`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const allBookmarks: Bookmark[] = (await res.json()).data || [];
        const topicSet = new Set<string>();
        allBookmarks.forEach(b => b.topics?.forEach(t => topicSet.add(t.name)));
        return Array.from(topicSet).sort();
    } catch {
        return [];
    }
});

async function getBookmarks(search: string, topic: string) {
    const base = process.env.API_URL;
    const params = new URLSearchParams({
        page: "1",
        limit: String(LIMIT),
        ...(search && { search }),
        ...(topic && { topic }),
    });
    const res = await fetch(`${base}/bookmarks?${params}`, { next: { revalidate: 60 } });
    const json = res.ok ? await res.json() : { data: [], meta: { total_pages: 1, total: 0 } };
    return {
        bookmarks: (json.data || []) as Bookmark[],
        meta: json.meta || { total_pages: 1, total: 0 },
    };
}

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Bookmarks" };
}

export default async function BookmarksPage({ searchParams }: BookmarksPageProps) {
    const sp = await searchParams;
    const search = sp.search || "";
    const topic = sp.topic || "";

    const [{ bookmarks, meta }, topics] = await Promise.all([
        getBookmarks(search, topic),
        getTopics(),
    ]);

    return (
        <BookmarksClient
            bookmarks={bookmarks}
            meta={meta}
            topics={topics}
            currentSearch={search}
            currentTopic={topic}
        />
    );
}