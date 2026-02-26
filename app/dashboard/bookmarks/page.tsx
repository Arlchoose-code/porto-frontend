"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Bookmark } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Search, Trash2, Bookmark as BookmarkIcon,
    Loader2, Link, Tag, ExternalLink,
    ChevronLeft, ChevronRight, FileText, Plus, X, Pencil
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.18 } }
};

interface BookmarkFormData {
    url: string;
    title: string;
    description: string;
    topics: string;
}

const emptyForm: BookmarkFormData = { url: "", title: "", description: "", topics: "" };

export default function BookmarksPage() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTopic, setActiveTopic] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [allTopics, setAllTopics] = useState<string[]>([]);
    const [topicSearch, setTopicSearch] = useState("");
    const [visibleTopics, setVisibleTopics] = useState(10);
    const TOPICS_STEP = 10;

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form modal
    const [formOpen, setFormOpen] = useState(false);
    const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
    const [form, setForm] = useState<BookmarkFormData>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const fetchAllTopics = useCallback(async () => {
        try {
            const first = await api.get("/bookmarks", { params: { page: 1, limit: 100 } });
            const tp = first.data.meta?.total_pages || 1;
            const all: Bookmark[] = [...(first.data.data || [])];
            if (tp > 1) {
                const rest = await Promise.all(
                    Array.from({ length: tp - 1 }, (_, i) =>
                        api.get("/bookmarks", { params: { page: i + 2, limit: 100 } })
                    )
                );
                rest.forEach((r) => all.push(...(r.data.data || [])));
            }
            const topics = new Set<string>();
            all.forEach((b) => b.topics?.forEach((t) => topics.add(t.name)));
            setAllTopics([...topics].sort());
        } catch { /* silent */ }
    }, []);

    const fetchBookmarks = useCallback(async (isPageChange = false) => {
        if (isPageChange) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 10 };
            if (search) params.search = search;
            if (activeTopic) params.topic = activeTopic;
            const res = await api.get("/bookmarks", { params });
            setBookmarks(res.data.data || []);
            setTotalPages(res.data.meta?.total_pages || 1);
            setTotal(res.data.meta?.total || 0);
        } catch {
            toast.error("Gagal memuat bookmarks");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, [page, search, activeTopic]);

    useEffect(() => { fetchBookmarks(false); }, []);
    useEffect(() => { if (!initialLoading) fetchBookmarks(true); }, [page]);
    useEffect(() => {
        if (!initialLoading) { setPage(1); fetchBookmarks(true); }
    }, [search, activeTopic]);
    useEffect(() => { fetchAllTopics(); }, [fetchAllTopics]);

    const openCreate = () => {
        setEditingBookmark(null);
        setForm(emptyForm);
        setFormOpen(true);
    };

    const openEdit = (bookmark: Bookmark) => {
        setEditingBookmark(bookmark);
        setForm({
            url: bookmark.url,
            title: bookmark.title,
            description: bookmark.description || "",
            topics: bookmark.topics?.map((t) => t.name).join(", ") || "",
        });
        setFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.url || !form.title) { toast.error("URL dan Judul wajib diisi"); return; }
        setSubmitting(true);
        try {
            const payload = {
                url: form.url,
                title: form.title,
                description: form.description,
                topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean),
            };
            if (editingBookmark) {
                await api.put(`/bookmarks/${editingBookmark.id}`, payload);
                toast.success("Bookmark diperbarui!");
            } else {
                await api.post("/bookmarks", payload);
                toast.success("Bookmark ditambahkan!");
            }
            setFormOpen(false);
            setForm(emptyForm);
            fetchBookmarks(true);
            fetchAllTopics();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Gagal menyimpan bookmark");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBookmark) return;
        setDeleting(true);
        try {
            await api.delete(`/bookmarks/${selectedBookmark.id}`);
            toast.success("Bookmark dihapus!");
            setDeleteDialog(false);
            setSelectedBookmark(null);
            fetchBookmarks(true);
            fetchAllTopics();
        } catch {
            toast.error("Gagal hapus bookmark");
        } finally {
            setDeleting(false);
        }
    };

    const getPaginationPages = () => {
        const pages: (number | string)[] = [];
        const delta = 1;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) pages.push(i);
            else if (i === page - delta - 1 || i === page + delta + 1) pages.push("...");
        }
        return pages;
    };

    const getDomain = (url: string) => {
        try { return new URL(url).hostname.replace("www.", ""); }
        catch { return url; }
    };

    const getFaviconUrl = (url: string) => {
        try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
        catch { return null; }
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <BookmarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                        </motion.div>
                        Bookmarks
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Koleksi link favorit dari berbagai sumber</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button onClick={openCreate} size="sm"
                        className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-sm">Tambah Bookmark</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Stats */}
            {!initialLoading && total > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="grid grid-cols-2 gap-2">
                    {[
                        { label: "Total Bookmark", value: total, color: "text-amber-500" },
                        { label: "Topik", value: allTopics.length, color: "text-blue-500" },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center">
                            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari judul, deskripsi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
                </div>
            </motion.div>

            {/* Topic filter pills */}
            {allTopics.length > 0 && (() => {
                const filteredTopics = topicSearch.trim()
                    ? allTopics.filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()))
                    : allTopics;
                const displayedTopics = topicSearch.trim()
                    ? filteredTopics
                    : filteredTopics.slice(0, visibleTopics);

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
                        className="space-y-2">
                        {/* Topic search */}
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <Input
                                placeholder="Cari topik..."
                                value={topicSearch}
                                onChange={(e) => { setTopicSearch(e.target.value); setVisibleTopics(10); }}
                                className="pl-9 h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-xs"
                            />
                            {topicSearch && (
                                <button onClick={() => { setTopicSearch(""); setVisibleTopics(10); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Pills */}
                        <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => setActiveTopic("")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                                    activeTopic === ""
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700"
                                }`}>
                                Semua
                            </button>
                            {displayedTopics.map((topic) => (
                                <button key={topic} onClick={() => setActiveTopic(activeTopic === topic ? "" : topic)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border flex items-center gap-1 ${
                                        activeTopic === topic
                                            ? "bg-amber-500 text-white border-amber-500"
                                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700"
                                    }`}>
                                    <Tag className="w-2.5 h-2.5" />
                                    {topic}
                                </button>
                            ))}
                            {!topicSearch && filteredTopics.length > visibleTopics && (
                                <button
                                    onClick={() => setVisibleTopics(prev => prev + TOPICS_STEP)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-all">
                                    + {Math.min(TOPICS_STEP, filteredTopics.length - visibleTopics)} more
                                </button>
                            )}
                        </div>
                    </motion.div>
                );
            })()}

            {/* Bookmark List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : bookmarks.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <BookmarkIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search || activeTopic ? "Tidak ada bookmark yang cocok" : "Belum ada bookmark"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search || activeTopic ? "Coba kata kunci atau filter lain" : "Klik Tambah Bookmark untuk mulai"}
                        </p>
                        {!search && !activeTopic && (
                            <Button onClick={openCreate} size="sm" className="mt-4 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                                <Plus className="w-3.5 h-3.5" />
                                Tambah Bookmark
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        <AnimatePresence>
                            {bookmarks.map((bookmark) => {
                                const favicon = getFaviconUrl(bookmark.url);
                                const domain = getDomain(bookmark.url);
                                const hasTopics = bookmark.topics && bookmark.topics.length > 0;
                                const hasDesc = !!bookmark.description?.trim();

                                return (
                                    <motion.div key={bookmark.id} variants={itemVariants} exit="exit" layout
                                        whileHover={{ y: -1, transition: { duration: 0.15 } }}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 transition-all duration-200 group hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-sm">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <motion.div whileHover={{ scale: 1.05 }} className="shrink-0 mt-0.5">
                                                {favicon ? (
                                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                        <img src={favicon} alt={domain} className="w-5 h-5"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center">
                                                        <Link className="w-4 h-4 text-amber-400" />
                                                    </div>
                                                )}
                                            </motion.div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1 mb-1">
                                                    {hasTopics && (
                                                        <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {bookmark.topics!.length}
                                                        </Badge>
                                                    )}
                                                    {hasDesc && (
                                                        <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                                            <FileText className="w-2.5 h-2.5" />
                                                            desc
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                    {bookmark.title}
                                                </h3>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate block max-w-[180px] sm:max-w-[260px] mt-0.5">
                                                    {domain}
                                                </span>
                                                {hasDesc && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                        {bookmark.description}
                                                    </p>
                                                )}
                                                {hasTopics && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {bookmark.topics!.slice(0, 4).map((topic) => (
                                                            <Badge key={topic.id}
                                                                className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                                                {topic.name}
                                                            </Badge>
                                                        ))}
                                                        {bookmark.topics!.length > 4 && (
                                                            <span className="text-[10px] text-gray-400">+{bookmark.topics!.length - 4}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-[10px] text-gray-400 hidden sm:block">
                                                    {format(new Date(bookmark.created_at), "dd MMM yyyy", { locale: id })}
                                                </span>
                                                <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                                    <motion.a href={bookmark.url} target="_blank" rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                        whileTap={{ scale: 0.85 }} title="Buka link">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </motion.a>
                                                    <motion.button onClick={() => openEdit(bookmark)}
                                                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                        whileTap={{ scale: 0.85 }} title="Edit">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </motion.button>
                                                    <motion.button
                                                        onClick={() => { setSelectedBookmark(bookmark); setDeleteDialog(true); }}
                                                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        whileTap={{ scale: 0.85 }} title="Hapus">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-1 pt-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1} className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </motion.div>
                    {getPaginationPages().map((p, i) => (
                        p === "..." ? (
                            <span key={`dots-${i}`} className="px-1 text-gray-400 text-sm">···</span>
                        ) : (
                            <motion.div key={p} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                                <Button variant={page === p ? "default" : "outline"} size="sm"
                                    onClick={() => setPage(Number(p))}
                                    className={`h-8 w-8 p-0 text-sm ${page === p ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" : "border-gray-200 dark:border-gray-700"}`}>
                                    {p}
                                </Button>
                            </motion.div>
                        )
                    ))}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages} className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </motion.div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {formOpen && (
                    <>
                        <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setFormOpen(false)} />
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.div
                                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-5 space-y-4"
                                initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                                onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookmarkIcon className="w-4 h-4 text-amber-500" />
                                        {editingBookmark ? "Edit Bookmark" : "Tambah Bookmark"}
                                    </h2>
                                    <button onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">URL *</Label>
                                        <Input placeholder="https://github.com/..." value={form.url}
                                            onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                                            className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Judul *</Label>
                                        <Input placeholder="Nama bookmark" value={form.title}
                                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                            className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Deskripsi</Label>
                                        <Input placeholder="Deskripsi singkat (opsional)" value={form.description}
                                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                            className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Topik <span className="text-gray-400">(pisah koma)</span></Label>
                                        <Input placeholder="golang, nextjs, tools" value={form.topics}
                                            onChange={(e) => setForm(f => ({ ...f, topics: e.target.value }))}
                                            className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <Button type="button" variant="outline" onClick={() => setFormOpen(false)}
                                        className="flex-1 h-9 text-sm border-gray-200 dark:border-gray-700">
                                        Batal
                                    </Button>
                                    <Button type="button" onClick={handleSubmit} disabled={submitting}
                                        className="flex-1 h-9 text-sm bg-amber-500 hover:bg-amber-600 text-white">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingBookmark ? "Simpan" : "Tambah")}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Bookmark?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Bookmark <strong className="text-gray-700 dark:text-gray-300">"{selectedBookmark?.title}"</strong> akan dihapus permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-700 text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm">
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}