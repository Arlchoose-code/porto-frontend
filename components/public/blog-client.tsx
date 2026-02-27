"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { BlurImage } from "@/components/shared/blur-image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Tag as TagIcon, Bot, User, Loader2, X, Hash } from "lucide-react";
import { Blog, Tag } from "@/lib/types";

const LIMIT = 9;

interface BlogClientProps {
    blogs: Blog[];
    meta: { total_pages: number; total: number; page: number; limit: number };
    tags: Tag[];
    tagsTotalPages: number;
    currentPage: number;
    currentSearch: string;
    currentTag: string;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div ref={ref}
            className={className}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BlogCard({ blog, index }: { blog: Blog; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}>
            <Link href={`/blog/${blog.slug}`}
                className="group flex flex-col h-full rounded-2xl border border-border bg-background hover:border-foreground/20 hover:shadow-sm overflow-hidden transition-all duration-200">
                
                {/* Cover */}
                <div className="relative w-full bg-muted overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    {blog.cover_image ? (
                        <BlurImage src={blog.cover_image} alt={blog.title} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-black text-muted-foreground/20">{blog.title?.charAt(0) || "B"}</span>
                        </div>
                    )}
                    {blog.author === "aibys" && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                            <Bot className="w-3 h-3" /> AI Generated
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {blog.tags.slice(0, 3).map(tag => (
                                <span key={tag.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-foreground/70 transition-colors">
                        {blog.title}
                    </h2>

                    {blog.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                            {blog.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {blog.author === "aibys"
                                ? <><Bot className="w-3 h-3" /> Syahril&apos;s AI Assistant</>
                                : <><User className="w-3 h-3" /> {blog.user?.name || "Syahril"}</>}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(blog.created_at)}</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function getPaginationItems(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const items: (number | "...")[] = [];
    if (current <= 4) {
        items.push(1, 2, 3, 4, 5, "...", total);
    } else if (current >= total - 3) {
        items.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
        items.push(1, "...", current - 1, current, current + 1, "...", total);
    }
    return items;
}

export default function BlogClient({ blogs: initialBlogs, meta: initialMeta, tags, tagsTotalPages, currentPage: initialPage, currentSearch: initialSearch, currentTag: initialTag }: BlogClientProps) {

    // Local state for blogs — updated client-side on search/tag change (no scroll jump)
    const [displayBlogs, setDisplayBlogs] = useState<Blog[]>(initialBlogs);
    const [displayMeta, setDisplayMeta] = useState(initialMeta);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [currentSearch, setCurrentSearch] = useState(initialSearch);
    const [currentTag, setCurrentTag] = useState(initialTag);
    const [loading, setLoading] = useState(false);

    const [allTags, setAllTags] = useState<Tag[]>(tags);
    const [tagsPage, setTagsPage] = useState(1);
    const [loadingMoreTags, setLoadingMoreTags] = useState(false);
    const [tagSearch, setTagSearch] = useState("");
    const [tagSearchResults, setTagSearchResults] = useState<Tag[] | null>(null);
    const [searchingTags, setSearchingTags] = useState(false);
    const [searchValue, setSearchValue] = useState(initialSearch);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tagDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const base = "/api";

    const fetchBlogs = useCallback(async (page: number, search: string, tag: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(search && { search }),
                ...(tag && { tag }),
            });
            const res = await fetch(`${base}/blogs?${params}`);
            const json = res.ok ? await res.json() : null;
            if (json) {
                setDisplayBlogs(json.data || []);
                setDisplayMeta(json.meta || { total_pages: 1, total: 0, page, limit: LIMIT });
            }
        } catch {}
        setLoading(false);
    }, [base]);

    // Update URL silently — only tag, no search, no page
    const updateUrl = (tag: string) => {
        const params = new URLSearchParams();
        if (tag) params.set("tag", tag);
        const q = params.toString();
        window.history.replaceState(null, "", `/blog${q ? "?" + q : ""}`);
    };

    const handleSearch = (val: string) => {
        setSearchValue(val);
        setCurrentSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchBlogs(1, val, currentTag);
        }, 400);
    };

    const handleTag = (slug: string) => {
        const newTag = currentTag === slug ? "" : slug;
        setCurrentTag(newTag);
        setCurrentPage(1);
        updateUrl(newTag);
        fetchBlogs(1, currentSearch, newTag);
    };

    const sectionRef = useRef<HTMLDivElement>(null);

    const handlePage = (page: number) => {
        setCurrentPage(page);
        fetchBlogs(page, currentSearch, currentTag);
        setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };

    const loadMoreTags = async () => {
        const nextPage = tagsPage + 1;
        if (nextPage > tagsTotalPages) return;
        setLoadingMoreTags(true);
        try {
            const res = await fetch(`/api/proxy-tags?page=${nextPage}&limit=10`);
            const json = await res.json();
            setAllTags(prev => [...prev, ...(json.data || [])]);
            setTagsPage(nextPage);
        } catch {}
        setLoadingMoreTags(false);
    };

    const handleTagSearch = (val: string) => {
        setTagSearch(val);
        if (tagDebounceRef.current) clearTimeout(tagDebounceRef.current);
        if (!val.trim()) {
            setTagSearchResults(null);
            return;
        }
        tagDebounceRef.current = setTimeout(async () => {
            setSearchingTags(true);
            try {
                const res = await fetch(`/api/proxy-tags?page=1&limit=50&search=${encodeURIComponent(val)}`);
                const json = await res.json();
                setTagSearchResults(json.data || []);
            } catch {
                setTagSearchResults([]);
            }
            setSearchingTags(false);
        }, 300);
    };

    const displayedTags = tagSearch.trim()
        ? (tagSearchResults ?? [])
        : allTags;

    const paginationItems = getPaginationItems(currentPage, displayMeta.total_pages);

    return (
        <div className="overflow-x-hidden w-full">
            {/* HERO */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 py-20 lg:py-28">
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4 block">Writing</span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">Blog</h1>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        Thoughts, tutorials, and things I find interesting.
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
                            placeholder="Search posts..."
                            className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                        />
                        {searchValue && (
                            <button onClick={() => handleSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Tags section */}
                    {allTags.length > 0 && (
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            {/* Tags header + search */}
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter by Tag</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={tagSearch}
                                        onChange={e => handleTagSearch(e.target.value)}
                                        placeholder="Search tags..."
                                        className="pl-7 pr-7 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all w-36"
                                    />
                                    {tagSearch && (
                                        <button onClick={() => { setTagSearch(""); setTagSearchResults(null); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tag pills */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleTag("")}
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                                        !currentTag
                                            ? "bg-foreground text-background border-foreground shadow-sm"
                                            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-background"
                                    }`}>
                                    <TagIcon className="w-3 h-3" /> All
                                </button>

                                <AnimatePresence mode="popLayout">
                                    {displayedTags.map(tag => (
                                        <motion.button
                                            key={tag.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.15 }}
                                            onClick={() => handleTag(tag.slug)}
                                            className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                                                currentTag === tag.slug
                                                    ? "bg-foreground text-background border-foreground shadow-sm"
                                                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-background"
                                            }`}>
                                            {tag.name}
                                        </motion.button>
                                    ))}
                                </AnimatePresence>

                                {searchingTags && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground py-1.5">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                                    </span>
                                )}

                                {tagSearch && !searchingTags && tagSearchResults !== null && displayedTags.length === 0 && (
                                    <span className="text-xs text-muted-foreground py-1.5">No tags match &quot;{tagSearch}&quot;</span>
                                )}

                                {tagsPage < tagsTotalPages && !tagSearch && (
                                    <button onClick={loadMoreTags} disabled={loadingMoreTags}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors disabled:opacity-50">
                                        {loadingMoreTags ? <Loader2 className="w-3 h-3 animate-spin" /> : "+ More"}
                                    </button>
                                )}
                            </div>

                            {currentTag && (
                                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Filtering by:</span>
                                    <button
                                        onClick={() => handleTag(currentTag)}
                                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-foreground text-background hover:opacity-80 transition-opacity">
                                        #{currentTag}
                                        <X className="w-3 h-3 ml-0.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </FadeUp>
            </section>

            {/* BLOG GRID */}
            <section ref={sectionRef} className="max-w-6xl mx-auto px-8 sm:px-16 pb-24">
                {(currentSearch || currentTag) && (
                    <p className="text-sm text-muted-foreground mb-6">
                        {displayMeta.total} post{displayMeta.total !== 1 ? "s" : ""} found
                        {currentSearch && <> for <span className="text-foreground font-medium">&quot;{currentSearch}&quot;</span></>}
                        {currentTag && <> tagged <span className="text-foreground font-medium">#{currentTag}</span></>}
                    </p>
                )}

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                    </div>
                ) : displayBlogs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayBlogs.map((blog, i) => (
                            <BlogCard key={blog.id} blog={blog} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                            <Search className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No posts found</p>
                        <p className="text-xs text-muted-foreground">
                            {currentSearch || currentTag ? "Try adjusting your search or filter." : "Check back later."}
                        </p>
                    </div>
                )}

                {/* Smart Pagination */}
                {displayMeta.total_pages > 1 && (
                    <>
                        <div className="flex items-center justify-center gap-1.5 mt-16">
                            <button
                                onClick={() => handlePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {paginationItems.map((item, i) =>
                                item === "..." ? (
                                    <span key={`e-${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-muted-foreground">
                                        &hellip;
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => handlePage(item as number)}
                                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
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
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                    </>
                )}
            </section>
        </div>
    );
}