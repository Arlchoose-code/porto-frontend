import { Metadata } from "next";
import { Bookmark } from "@/lib/types";
import BookmarksClient from "@/components/public/bookmarks-client";

const LIMIT = 15;

interface BookmarksPageProps {
    searchParams: Promise<{ search?: string; topic?: string }>;
}

async function getData(search: string, topic: string) {
    const base = process.env.API_URL;
    const params = new URLSearchParams({
        page: "1",
        limit: String(LIMIT),
        ...(search && { search }),
        ...(topic && { topic }),
    });

    // Fetch bookmarks + all topics in parallel
    const [bookmarksRes, topicsRes] = await Promise.all([
        fetch(`${base}/bookmarks?${params}`, { next: { revalidate: 60 } }),
        fetch(`${base}/bookmarks?page=1&limit=200`, { next: { revalidate: 3600 } }),
    ]);

    const bookmarksJson = bookmarksRes.ok ? await bookmarksRes.json() : { data: [], meta: { total_pages: 1, total: 0 } };
    const bookmarks: Bookmark[] = bookmarksJson.data || [];
    const meta = bookmarksJson.meta || { total_pages: 1, total: 0 };

    // Extract unique topics from all bookmarks
    const allBookmarks: Bookmark[] = topicsRes.ok ? ((await topicsRes.json()).data || []) : [];
    const topicSet = new Set<string>();
    allBookmarks.forEach(b => b.topics?.forEach(t => topicSet.add(t.name)));
    const topics = Array.from(topicSet).sort();

    return { bookmarks, meta, topics };
}

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Bookmarks" };
}

export default async function BookmarksPage({ searchParams }: BookmarksPageProps) {
    const sp = await searchParams;
    const search = sp.search || "";
    const topic = sp.topic || "";

    const { bookmarks, meta, topics } = await getData(search, topic);

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