"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Blog, Tag } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Plus, Search, Bot, Eye, Pencil, Trash2,
    CheckCircle, XCircle, Filter, FileText,
    AlertCircle, ChevronLeft, ChevronRight,
    User, Sparkles, Clock, Globe, Archive,
    Loader2, SquareCheck, Square
} from "lucide-react";
import BlogFormModal from "./components/blog-form-modal";
import BlogGenerateModal from "./components/blog-generate-modal";
import BlogRejectModal from "./components/blog-reject-modal";
import BlogViewModal from "./components/blog-view-modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { startBulkRegenerateJob } from "@/components/shared/generate-indicator";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.18 } }
};

interface BlogStats {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    archived: number;
}

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState<BlogStats>({ total: 0, published: 0, pending: 0, rejected: 0, archived: 0 });

    const [formModal, setFormModal] = useState(false);
    const [generateModal, setGenerateModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [bulkRejectDialog, setBulkRejectDialog] = useState(false);
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    const [bulkRejectComment, setBulkRejectComment] = useState("");

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get("/blogs/stats");
            setStats(res.data.data);
        } catch { /* silent */ }
    }, []);

    const fetchBlogs = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(search && { search }),
                ...(status !== "all" && { status }),
            });
            const res = await api.get(`/blogs/all?${params}`);
            setBlogs(res.data.data || []);
            setTotalPages(res.data.meta?.total_pages || 1);
        } catch {
            toast.error("Gagal memuat blogs");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, [page, status, search]);

    useEffect(() => { fetchBlogs(); }, [fetchBlogs]);
    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => {
    const fetchAllTags = async () => {
        try {
            let allTags: Tag[] = [];
            let page = 1;
            let totalPages = 1;
            do {
                const res = await api.get(`/tags?limit=100&page=${page}`);
                allTags = [...allTags, ...(res.data.data || [])];
                totalPages = res.data.meta?.total_pages || 1;
                page++;
            } while (page <= totalPages);
            setTags(allTags);
        } catch { /* silent */ }
    };
    fetchAllTags();
}, []);

    useEffect(() => {
    const handleRefresh = () => {
        setTimeout(() => {
            fetchBlogs(true);
            fetchStats();
        }, 0);
    };

    window.addEventListener("blogs_refresh", handleRefresh);
    return () => window.removeEventListener("blogs_refresh", handleRefresh);
}, [fetchBlogs, fetchStats]);

    useEffect(() => {
        const handleToast = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.type === "success") toast.success(detail.message, { description: detail.description });
            else toast.error(detail.message);
        };
        window.addEventListener("show_toast", handleToast);
        return () => window.removeEventListener("show_toast", handleToast);
    }, []);

    useEffect(() => { setSelectedIds(new Set()); }, [status, search, page]);

    const handlePublish = async (blog: Blog) => {
        try {
            await api.put(`/blogs/${blog.id}/publish`);
            toast.success("Blog dipublish!");
            fetchBlogs(true); fetchStats();
        } catch { toast.error("Gagal publish blog"); }
    };

    const handleArchive = async (blog: Blog) => {
        try {
            await api.put(`/blogs/${blog.id}/archive`);
            toast.success("Blog diarsipkan");
            fetchBlogs(true); fetchStats();
        } catch { toast.error("Gagal arsipkan blog"); }
    };

    const handleDelete = async () => {
        if (!selectedBlog) return;
        try {
            await api.delete(`/blogs/${selectedBlog.id}`);
            toast.success("Blog dihapus!");
            setDeleteDialog(false); setSelectedBlog(null);
            fetchBlogs(true); fetchStats();
        } catch { toast.error("Gagal hapus blog"); }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === blogs.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(blogs.map(b => b.id)));
    };

    const handleBulkAction = async (action: "publish" | "archive" | "delete" | "reject", comment?: string) => {
        if (selectedIds.size === 0) return;
        setBulkLoading(true);
        try {
            const res = await api.post("/blogs/bulk", {
                ids: Array.from(selectedIds),
                action,
                comment: comment || "",
            });

            const affected = res.data.data?.affected || selectedIds.size;
            const aiRegenerate: number = res.data.data?.ai_regenerate || 0;

            if (action === "reject" && aiRegenerate > 0) {
                // Kumpulkan semua blog AI yang di-reject → 1 indicator bulk
                const aiBlogs = blogs
                    .filter(b => selectedIds.has(b.id) && b.author === "aibys")
                    .map(b => ({ id: b.id, title: b.title }));

                startBulkRegenerateJob(aiBlogs);

                toast.success(`${affected} blog ditolak`, {
                    description: `${aiRegenerate} blog AI diperbaiki Aibys di background`,
                    duration: 5000,
                });
            } else {
                const label = { publish: "dipublish", archive: "diarsipkan", reject: "ditolak", delete: "dihapus" }[action];
                toast.success(`${affected} blog berhasil ${label}!`);
            }

            setSelectedIds(new Set());
            setBulkRejectDialog(false);
            setBulkDeleteDialog(false);
            setBulkRejectComment("");
            fetchBlogs(true); fetchStats();
        } catch {
            toast.error(`Gagal bulk ${action}`);
        } finally {
            setBulkLoading(false);
        }
    };

    const getStatusConfig = (s: string) => {
        switch (s) {
            case "published": return { label: "Published", icon: Globe, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
            case "pending": return { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
            case "rejected": return { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
            case "archived": return { label: "Archived", icon: Archive, className: "bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20" };
            default: return { label: s, icon: FileText, className: "" };
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

    const isAllSelected = blogs.length > 0 && selectedIds.size === blogs.length;
    const isPartialSelected = selectedIds.size > 0 && selectedIds.size < blogs.length;

    const statCards = [
        { label: "Total", value: stats.total, color: "text-blue-500", filter: "all" },
        { label: "Published", value: stats.published, color: "text-emerald-500", filter: "published" },
        { label: "Pending", value: stats.pending, color: "text-amber-500", filter: "pending" },
        { label: "Rejected", value: stats.rejected, color: "text-red-500", filter: "rejected" },
        { label: "Archived", value: stats.archived, color: "text-gray-500", filter: "archived" },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                        </motion.div>
                        Blogs
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola semua blog dan artikel</p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button onClick={() => setGenerateModal(true)} variant="outline" size="sm"
                            className="gap-1.5 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10">
                            <Bot className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm">Generate AI</span>
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button onClick={() => { setSelectedBlog(null); setFormModal(true); }} size="sm"
                            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm">Tambah Blog</span>
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="grid grid-cols-5 gap-2">
                {statCards.map((stat, i) => (
                    <motion.button key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }} onClick={() => { setStatus(stat.filter); setPage(1); }}
                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3 text-center transition-all cursor-pointer hover:shadow-sm ${
                            status === stat.filter
                                ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30"
                                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}>
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </motion.button>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari judul, deskripsi..." value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
                </div>
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-36 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm">
                        <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Bulk action bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mr-1">
                                {selectedIds.size} dipilih
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Button size="sm" onClick={() => handleBulkAction("publish")} disabled={bulkLoading}
                                    className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <CheckCircle className="w-3 h-3" /> Publish
                                </Button>
                                <Button size="sm" onClick={() => setBulkRejectDialog(true)} disabled={bulkLoading}
                                    className="h-7 text-xs gap-1 bg-orange-500 hover:bg-orange-600 text-white">
                                    <XCircle className="w-3 h-3" /> Reject
                                </Button>
                                <Button size="sm" onClick={() => handleBulkAction("archive")} disabled={bulkLoading}
                                    className="h-7 text-xs gap-1 bg-gray-500 hover:bg-gray-600 text-white">
                                    <Archive className="w-3 h-3" /> Archive
                                </Button>
                                <Button size="sm" onClick={() => setBulkDeleteDialog(true)} disabled={bulkLoading}
                                    className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white">
                                    <Trash2 className="w-3 h-3" /> Hapus
                                </Button>
                            </div>
                            <button onClick={() => setSelectedIds(new Set())}
                                className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                Batal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blog list */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : blogs.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Belum ada blog</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tambah blog manual atau generate dengan AI</p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Button onClick={() => setGenerateModal(true)} size="sm" variant="outline"
                                className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400">
                                <Sparkles className="w-3.5 h-3.5" /> Generate AI
                            </Button>
                            <Button onClick={() => { setSelectedBlog(null); setFormModal(true); }} size="sm"
                                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Manual
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="list" variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        {/* Select all row */}
                        <div className="flex items-center gap-2 px-1 pb-1">
                            <button onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                {isAllSelected
                                    ? <SquareCheck className="w-4 h-4 text-blue-500" />
                                    : isPartialSelected
                                        ? <SquareCheck className="w-4 h-4 text-blue-400 opacity-60" />
                                        : <Square className="w-4 h-4" />
                                }
                                {isAllSelected ? "Batalkan semua" : "Pilih semua"}
                            </button>
                        </div>

                        <AnimatePresence>
                            {blogs.map((blog) => {
                                const statusConfig = getStatusConfig(blog.status);
                                const StatusIcon = statusConfig.icon;
                                const isSelected = selectedIds.has(blog.id);

                                return (
                                    <motion.div key={blog.id} variants={itemVariants} exit="exit" layout
                                        whileHover={{ y: -1, transition: { duration: 0.15 } }}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3.5 transition-all duration-200 group ${
                                            isSelected
                                                ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/20 bg-blue-50/30 dark:bg-blue-500/5"
                                                : "border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
                                        }`}>
                                        <div className="flex items-center gap-2 sm:gap-3">

                                            {/* Checkbox — selalu visible di mobile */}
                                            <button onClick={() => toggleSelect(blog.id)}
                                                className={`shrink-0 transition-colors ${
                                                    isSelected
                                                        ? "text-blue-500"
                                                        : "text-gray-300 dark:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100"
                                                }`}>
                                                {isSelected
                                                    ? <SquareCheck className="w-4 h-4" />
                                                    : <Square className="w-4 h-4" />
                                                }
                                            </button>

                                            {/* Cover */}
                                            <motion.div whileHover={{ scale: 1.05 }} className="shrink-0">
                                                {blog.cover_image ? (
                                                    <img src={blog.cover_image} alt={blog.title}
                                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                                    </div>
                                                )}
                                            </motion.div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                                                    <Badge className={`text-xs gap-1 ${statusConfig.className}`}>
                                                        <StatusIcon className="w-2.5 h-2.5" />
                                                        <span className="hidden sm:inline">{statusConfig.label}</span>
                                                    </Badge>
                                                    {blog.author === "aibys" ? (
                                                        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs gap-1">
                                                            <Bot className="w-2.5 h-2.5" /> <span className="hidden sm:inline">AI</span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs gap-1">
                                                            <User className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Manual</span>
                                                        </Badge>
                                                    )}
                                                    {blog.tags?.slice(0, 2).map((tag) => (
                                                        <Badge key={tag.id} variant="outline" className="text-xs hidden md:flex">{tag.name}</Badge>
                                                    ))}
                                                </div>

                                                <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {blog.title}
                                                </h3>

                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        {blog.author === "aibys"
                                                            ? <><Bot className="w-3 h-3 text-purple-400" /><span className="hidden sm:inline"> Aibys AI</span></>
                                                            : <><User className="w-3 h-3 text-blue-400" /><span className="hidden sm:inline"> {blog.user?.name || "Unknown"}</span></>
                                                        }
                                                    </span>
                                                    <span className="hidden sm:block">
                                                        {format(new Date(blog.created_at), "dd MMM yyyy", { locale: id })}
                                                    </span>
                                                </div>

                                                {blog.status === "rejected" && blog.reject_comment && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{blog.reject_comment}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions — selalu visible di mobile, opacity hover di desktop */}
                                            <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                                <motion.button onClick={() => { setSelectedBlog(blog); setViewModal(true); }}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Lihat">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </motion.button>

                                                {blog.status === "pending" && (
                                                    <>
                                                        <motion.button onClick={() => handlePublish(blog)}
                                                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                            whileTap={{ scale: 0.85 }} title="Publish">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                        </motion.button>
                                                        <motion.button onClick={() => { setSelectedBlog(blog); setRejectModal(true); }}
                                                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                                                            whileTap={{ scale: 0.85 }} title="Reject">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </motion.button>
                                                    </>
                                                )}

                                                {(blog.status === "published" || blog.status === "pending") && (
                                                    <motion.button onClick={() => handleArchive(blog)}
                                                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        whileTap={{ scale: 0.85 }} title="Archive">
                                                        <Archive className="w-3.5 h-3.5" />
                                                    </motion.button>
                                                )}

                                                <motion.button onClick={() => { setSelectedBlog(blog); setFormModal(true); }}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Edit">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </motion.button>

                                                <motion.button onClick={() => { setSelectedBlog(blog); setDeleteDialog(true); }}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Hapus">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </motion.button>
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
                        p === "..." ? <span key={`dots-${i}`} className="px-1 text-gray-400 text-sm">···</span> : (
                            <motion.div key={p} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                                <Button variant={page === p ? "default" : "outline"} size="sm"
                                    onClick={() => setPage(Number(p))}
                                    className={`h-8 w-8 p-0 text-sm ${page === p ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "border-gray-200 dark:border-gray-700"}`}>
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

            {/* Modals */}
            <BlogFormModal open={formModal} onClose={() => { setFormModal(false); setSelectedBlog(null); }}
                onSuccess={() => { fetchBlogs(true); fetchStats(); }} blog={selectedBlog} tags={tags} />
            <BlogGenerateModal open={generateModal} onClose={() => setGenerateModal(false)}
                onSuccess={() => { fetchBlogs(true); fetchStats(); }} />
            <BlogRejectModal open={rejectModal} onClose={() => { setRejectModal(false); setSelectedBlog(null); }}
                onSuccess={() => { fetchBlogs(true); fetchStats(); }} blog={selectedBlog} />
            <BlogViewModal open={viewModal} onClose={() => { setViewModal(false); setSelectedBlog(null); }} blog={selectedBlog} />

            {/* Delete single */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Blog?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Blog <strong className="text-gray-700 dark:text-gray-300">"{selectedBlog?.title}"</strong> akan dihapus permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-700 text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white text-sm">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk delete */}
            <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus {selectedIds.size} Blog?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            {selectedIds.size} blog yang dipilih akan dihapus permanen dan tidak bisa dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-700 text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBulkAction("delete")} disabled={bulkLoading}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm">
                            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Semua"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk reject — FIXED dark mode */}
<AlertDialog open={bulkRejectDialog} onOpenChange={setBulkRejectDialog}>
    <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
        <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
                Reject {selectedIds.size} Blog?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                Masukkan catatan penolakan. Blog AI akan diperbaiki Aibys secara otomatis.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6 pb-2">
            <Textarea
                value={bulkRejectComment}
                onChange={(e) => setBulkRejectComment(e.target.value)}
                placeholder="Alasan penolakan..."
                rows={3}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
        </div>
        <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                Batal
            </AlertDialogCancel>
            {/* FIXED: Button dengan background orange konsisten */}
            <AlertDialogAction
                onClick={() => handleBulkAction("reject", bulkRejectComment)}
                disabled={bulkLoading || !bulkRejectComment.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white text-sm border-0 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                style={{ backgroundColor: '#f97316' }} // force orange background
            >
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject Semua"}
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
        </div>
    );
}