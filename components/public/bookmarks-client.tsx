"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, ExternalLink, X, Hash, Bookmark as BookmarkIcon, Loader2 } from "lucide-react";
import { Bookmark } from "@/lib/types";

const LIMIT = 15;

interface BookmarksClientProps {
    bookmarks: Bookmark[];
    meta: { total_pages: number; total: number };
    topics: string[];
    currentSearch: string;
    currentTopic: string;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div ref={ref} className={className}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
}

function BookmarkRow({ bookmark, index }: { bookmark: Bookmark; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    let domain = "";
    try { domain = new URL(bookmark.url).hostname; } catch {}

    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}>
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row gap-5 sm:gap-8 py-8 border-b border-border hover:border-foreground/20 transition-colors duration-200">

                {/* Favicon / icon block */}
                <div className="relative w-full sm:w-52 sm:shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center"
                    style={{ aspectRatio: "16/10" }}>
                    {domain ? (
                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                alt=""
                                width={32}
                                height={32}
                                className="rounded-md opacity-60 group-hover:opacity-90 transition-opacity"
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px] px-2">{domain}</span>
                        </div>
                    ) : (
                        <BookmarkIcon className="w-8 h-8 text-muted-foreground/30" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                    <div>
                        {/* Title + arrow */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h2 className="text-xl font-bold text-foreground group-hover:text-foreground/70 transition-colors leading-tight">
                                {bookmark.title || bookmark.url}
                            </h2>
                            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground transition-all duration-200" />
                        </div>

                        {/* Description */}
                        {bookmark.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {bookmark.description}
                            </p>
                        )}
                    </div>

                    {/* All topics — no slice */}
                    {bookmark.topics && bookmark.topics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {bookmark.topics.map(topic => (
                                <span key={topic.id}
                                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
                                    {topic.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </a>
        </motion.div>
    );
}

function getPaginationItems(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function BookmarksClient({ bookmarks: initialBookmarks, meta: initialMeta, topics, currentSearch: initialSearch, currentTopic: initialTopic }: BookmarksClientProps) {
    const [displayBookmarks, setDisplayBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const [displayMeta, setDisplayMeta] = useState(initialMeta);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentSearch, setCurrentSearch] = useState(initialSearch);
    const [currentTopic, setCurrentTopic] = useState(initialTopic);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState(initialSearch);
    const [topicSearch, setTopicSearch] = useState("");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionRef = useRef<HTMLElement>(null);

    const base = "/api";

    const fetchBookmarks = useCallback(async (page: number, search: string, topic: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(search && { search }),
                ...(topic && { topic }),
            });
            const res = await fetch(`${base}/bookmarks?${params}`);
            const json = res.ok ? await res.json() : null;
            if (json) {
                setDisplayBookmarks(json.data || []);
                setDisplayMeta(json.meta || { total_pages: 1, total: 0 });
            }
        } catch {}
        setLoading(false);
    }, [base]);

    const updateUrl = (topic: string) => {
        const params = new URLSearchParams();
        if (topic) params.set("topic", topic);
        const q = params.toString();
        window.history.replaceState(null, "", `/bookmarks${q ? "?" + q : ""}`);
    };

    const handleSearch = (val: string) => {
        setSearchValue(val);
        setCurrentSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchBookmarks(1, val, currentTopic);
        }, 400);
    };

    const handleTopic = (topic: string) => {
        const newTopic = currentTopic === topic ? "" : topic;
        setCurrentTopic(newTopic);
        setCurrentPage(1);
        updateUrl(newTopic);
        fetchBookmarks(1, currentSearch, newTopic);
    };

    const handlePage = (page: number) => {
        setCurrentPage(page);
        fetchBookmarks(page, currentSearch, currentTopic);
        setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };

    const filteredTopics = topicSearch.trim()
        ? topics.filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()))
        : topics;

    const paginationItems = getPaginationItems(currentPage, displayMeta.total_pages);

    return (
        <div className="overflow-x-hidden w-full">
            {/* HERO */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 py-20 lg:py-28">
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4 block">Collection</span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">Bookmarks</h1>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        GitHub repositories and resources I find useful or interesting.
                    </p>
                </motion.div>
            </section>

            {/* SEARCH + FILTER */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 pb-8">
                <FadeUp>
                    {/* Search bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Search bookmarks..."
                            className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                        />
                        {searchValue && (
                            <button onClick={() => handleSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Topics filter */}
                    {topics.length > 0 && (
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter by Topic</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={topicSearch}
                                        onChange={e => setTopicSearch(e.target.value)}
                                        placeholder="Search topics..."
                                        className="pl-7 pr-7 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all w-36"
                                    />
                                    {topicSearch && (
                                        <button onClick={() => setTopicSearch("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleTopic("")}
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                                        !currentTopic
                                            ? "bg-foreground text-background border-foreground shadow-sm"
                                            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-background"
                                    }`}>
                                    <BookmarkIcon className="w-3 h-3" /> All
                                </button>

                                <AnimatePresence mode="popLayout">
                                    {filteredTopics.map(topic => (
                                        <motion.button
                                            key={topic}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.15 }}
                                            onClick={() => handleTopic(topic)}
                                            className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                                                currentTopic === topic
                                                    ? "bg-foreground text-background border-foreground shadow-sm"
                                                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-background"
                                            }`}>
                                            {topic}
                                        </motion.button>
                                    ))}
                                </AnimatePresence>

                                {topicSearch && filteredTopics.length === 0 && (
                                    <span className="text-xs text-muted-foreground py-1.5">No topics match &quot;{topicSearch}&quot;</span>
                                )}
                            </div>

                            {currentTopic && (
                                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Filtering by:</span>
                                    <button
                                        onClick={() => handleTopic(currentTopic)}
                                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-foreground text-background hover:opacity-80 transition-opacity">
                                        {currentTopic}
                                        <X className="w-3 h-3 ml-0.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </FadeUp>
            </section>

            {/* BOOKMARKS LIST */}
            <section ref={sectionRef} className="max-w-6xl mx-auto px-8 sm:px-16 pb-24">
                {(currentSearch || currentTopic) && (
                    <p className="text-sm text-muted-foreground mb-6">
                        {displayMeta.total} bookmark{displayMeta.total !== 1 ? "s" : ""} found
                        {currentSearch && <> for <span className="text-foreground font-medium">&quot;{currentSearch}&quot;</span></>}
                        {currentTopic && <> in <span className="text-foreground font-medium">{currentTopic}</span></>}
                    </p>
                )}

                <div className="border-t border-border">
                    {loading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                        </div>
                    ) : displayBookmarks.length > 0 ? (
                        displayBookmarks.map((bookmark, i) => (
                            <BookmarkRow key={bookmark.id} bookmark={bookmark} index={i} />
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                <BookmarkIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">No bookmarks found</p>
                            <p className="text-xs text-muted-foreground">
                                {currentSearch || currentTopic ? "Try adjusting your search or filter." : "Nothing here yet."}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {displayMeta.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-10">
                        <button
                            onClick={() => handlePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {paginationItems.map((item, i) =>
                            item === "..." ? (
                                <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground">
                                    &hellip;
                                </span>
                            ) : (
                                <button key={item}
                                    onClick={() => handlePage(item as number)}
                                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                                        currentPage === item
                                            ? "bg-foreground text-background"
                                            : "border border-border hover:bg-muted text-foreground"
                                    }`}>
                                    {item}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => handlePage(currentPage + 1)}
                            disabled={currentPage === displayMeta.total_pages}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}