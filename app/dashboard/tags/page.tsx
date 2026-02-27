"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";
import { Tag } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Search, Trash2, Loader2, Plus, Tag as TagIcon,
    Pencil, X, Hash, Check, ChevronLeft, ChevronRight,
    SquareCheck, Square
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const TAG_COLORS = [
    "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
];
const getTagColor = (name: string) => TAG_COLORS[name.charCodeAt(0) % TAG_COLORS.length];

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Add modal
    const [addModal, setAddModal] = useState(false);
    const [addInput, setAddInput] = useState("");
    const [pendingTags, setPendingTags] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);

    // Inline edit
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editInput, setEditInput] = useState("");
    const [saving, setSaving] = useState(false);

    // Bulk select
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Single delete
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Debounce search
    const debouncedSearch = useDebounce(search, 400);
    const abortRef = useRef<AbortController | null>(null);

    const fetchTags = useCallback(async (isPageChange = false) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (isPageChange) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 20 };
            if (debouncedSearch) params.search = debouncedSearch;
            const res = await api.get("/tags", { params, signal: abortRef.current.signal });
            setTags(res.data.data || []);
            setTotalPages(res.data.meta?.total_pages || 1);
            setTotal(res.data.meta?.total || 0);
        } catch (e: any) {
            if (e?.code !== "ERR_CANCELED") toast.error("Gagal memuat tags");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchTags(false); }, [fetchTags]);

    // Reset page saat search berubah
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    // Reset selected saat ganti page/search
    useEffect(() => { setSelectedIds(new Set()); }, [page, debouncedSearch]);

    // ── Add modal handlers ──
    const addToPending = () => {
        const name = addInput.trim();
        if (!name) return;
        // Cegah duplikat di pending list
        if (pendingTags.map(t => t.toLowerCase()).includes(name.toLowerCase())) {
            toast.error(`"${name}" sudah ada di list`);
            return;
        }
        setPendingTags(prev => [...prev, name]);
        setAddInput("");
    };

    const removePending = (name: string) => {
        setPendingTags(prev => prev.filter(t => t !== name));
    };

    const handleAddSubmit = async () => {
        const all = [...pendingTags];
        if (addInput.trim()) all.push(addInput.trim());
        if (all.length === 0) return;

        setAdding(true);
        let success = 0;
        let failed: string[] = [];

        await Promise.allSettled(
            all.map(name =>
                api.post("/tags", { name })
                    .then(() => { success++; })
                    .catch(() => { failed.push(name); })
            )
        );

        if (success > 0) toast.success(`${success} tag berhasil ditambahkan!`);
        if (failed.length > 0) toast.error(`Gagal: ${failed.join(", ")} (mungkin sudah ada)`);

        setAdding(false);
        setAddModal(false);
        setAddInput("");
        setPendingTags([]);
        setPage(1);
        fetchTags(false);
    };

    const closeAddModal = () => {
        setAddModal(false);
        setAddInput("");
        setPendingTags([]);
    };

    // ── Edit handlers ──
    const startEdit = (tag: Tag) => {
        setEditingId(tag.id);
        setEditInput(tag.name);
    };

    const cancelEdit = () => { setEditingId(null); setEditInput(""); };

    const handleSaveEdit = async (tag: Tag) => {
        const name = editInput.trim();
        if (!name || name === tag.name) { cancelEdit(); return; }
        setSaving(true);
        try {
            await api.put(`/tags/${tag.id}`, { name });
            toast.success("Tag diperbarui!");
            cancelEdit();
            fetchTags(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Gagal update tag");
        } finally {
            setSaving(false);
        }
    };

    // ── Bulk select handlers ──
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === tags.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(tags.map(t => t.id)));
    };

    const isAllSelected = tags.length > 0 && selectedIds.size === tags.length;
    const isPartialSelected = selectedIds.size > 0 && selectedIds.size < tags.length;

    // ── Delete handlers ──
    const handleDelete = async () => {
        if (!selectedTag) return;
        setDeleting(true);
        try {
            await api.delete(`/tags/${selectedTag.id}`);
            toast.success(`Tag "${selectedTag.name}" dihapus!`);
            setDeleteDialog(false);
            setSelectedTag(null);
            fetchTags(true);
        } catch {
            toast.error("Gagal hapus tag");
        } finally {
            setDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        let success = 0;
        await Promise.allSettled(
            Array.from(selectedIds).map(id =>
                api.delete(`/tags/${id}`).then(() => { success++; })
            )
        );
        toast.success(`${success} tag dihapus!`);
        setBulkDeleting(false);
        setBulkDeleteDialog(false);
        setSelectedIds(new Set());
        fetchTags(true);
    };

    // ── Pagination ──
    const getPaginationPages = () => {
        const pages: (number | string)[] = [];
        const delta = 1;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) pages.push(i);
            else if (i === page - delta - 1 || i === page + delta + 1) pages.push("...");
        }
        return pages;
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <TagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
                        </motion.div>
                        Tags
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola tag untuk blog & konten</p>
                </div>
                <div className="flex items-center gap-2">
                    {!initialLoading && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-center">
                            <span className="text-base font-bold text-violet-500">{total}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">total</span>
                        </div>
                    )}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button onClick={() => setAddModal(true)} size="sm"
                            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Tambah Tag</span>
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari nama tag atau slug..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
                </div>
            </motion.div>

            {/* Bulk action bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-2.5">
                            <span className="text-sm font-medium text-violet-700 dark:text-violet-300 mr-1">
                                {selectedIds.size} dipilih
                            </span>
                            <Button size="sm" onClick={() => setBulkDeleteDialog(true)}
                                className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white">
                                <Trash2 className="w-3 h-3" /> Hapus
                            </Button>
                            <button onClick={() => setSelectedIds(new Set())}
                                className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                Batal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tag List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="h-[52px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : tags.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <TagIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada tag yang cocok" : "Belum ada tag"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Tambah tag pertama sekarang"}
                        </p>
                        {!search && (
                            <Button onClick={() => setAddModal(true)} size="sm"
                                className="mt-4 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Tag
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        {/* Select all row */}
                        <div className="flex items-center gap-2 px-1 pb-1">
                            <button onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                {isAllSelected
                                    ? <SquareCheck className="w-4 h-4 text-violet-500" />
                                    : isPartialSelected
                                        ? <SquareCheck className="w-4 h-4 text-violet-400 opacity-60" />
                                        : <Square className="w-4 h-4" />
                                }
                                {isAllSelected ? "Batalkan semua" : "Pilih semua"}
                            </button>
                        </div>

                        {tags.map((tag) => {
                            const colorClass = getTagColor(tag.name);
                            const isEditing = editingId === tag.id;
                            const isSelected = selectedIds.has(tag.id);

                            return (
                                <div key={tag.id}
                                    className={`bg-white dark:bg-gray-900 border rounded-xl p-3 transition-all duration-150 group hover:shadow-sm ${
                                        isSelected
                                            ? "border-violet-400 dark:border-violet-600 ring-1 ring-violet-400/20 bg-violet-50/30 dark:bg-violet-500/5"
                                            : "border-gray-200 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800"
                                    }`}>

                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                            <Input autoFocus
                                                value={editInput}
                                                onChange={(e) => setEditInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveEdit(tag);
                                                    if (e.key === "Escape") cancelEdit();
                                                }}
                                                className="h-7 text-sm flex-1 bg-gray-50 dark:bg-gray-800 border-violet-300 dark:border-violet-700 rounded-lg px-2"
                                            />
                                            <motion.button type="button" onClick={() => handleSaveEdit(tag)}
                                                disabled={saving} whileTap={{ scale: 0.85 }}
                                                className="p-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors shrink-0">
                                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            </motion.button>
                                            <motion.button type="button" onClick={cancelEdit}
                                                whileTap={{ scale: 0.85 }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
                                                <X className="w-3 h-3" />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5">
                                            {/* Checkbox */}
                                            <button onClick={() => toggleSelect(tag.id)}
                                                className={`shrink-0 transition-colors ${
                                                    isSelected ? "text-violet-500" : "text-gray-300 dark:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100"
                                                }`}>
                                                {isSelected ? <SquareCheck className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            </button>

                                            {/* Tag chip */}
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${colorClass}`}>
                                                <Hash className="w-3 h-3" />
                                                {tag.name}
                                            </span>

                                            {/* Slug */}
                                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate flex-1 font-mono hidden sm:block">
                                                {tag.slug}
                                            </span>

                                            {/* Date */}
                                            <span className="text-[10px] text-gray-400 hidden md:block shrink-0">
                                                {format(new Date(tag.created_at), "dd MMM yy", { locale: id })}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                                                <motion.button onClick={() => startEdit(tag)}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Edit">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </motion.button>
                                                <motion.button onClick={() => { setSelectedTag(tag); setDeleteDialog(true); }}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Hapus">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
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
                                    className={`h-8 w-8 p-0 text-sm ${page === p ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600" : "border-gray-200 dark:border-gray-700"}`}>
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

            {/* ── Add Modal ── */}
            <AnimatePresence>
                {addModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeAddModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.97 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="relative w-full sm:max-w-[460px] bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-200/80 dark:border-gray-800">

                            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <TagIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">Tambah Tags</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Bisa tambah banyak sekaligus</p>
                                    </div>
                                </div>
                                <motion.button onClick={closeAddModal} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-2 space-y-4">
                                {/* Input + tombol tambah ke list */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <Input
                                            autoFocus
                                            value={addInput}
                                            onChange={(e) => setAddInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToPending(); } }}
                                            placeholder="Nama tag... (Enter untuk tambah ke list)"
                                            className="pl-9 h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-violet-400 dark:focus:border-violet-500 text-sm rounded-xl"
                                        />
                                    </div>
                                    <Button type="button" size="sm" onClick={addToPending}
                                        disabled={!addInput.trim()}
                                        className="h-9 w-9 p-0 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shrink-0">
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {/* Pending tags list */}
                                <AnimatePresence>
                                    {pendingTags.length > 0 && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto py-1">
                                            {pendingTags.map((name) => (
                                                <motion.span key={name}
                                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className={`inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border text-xs font-medium ${getTagColor(name)}`}>
                                                    <Hash className="w-3 h-3" />
                                                    {name}
                                                    <button type="button" onClick={() => removePending(name)}
                                                        className="w-4 h-4 flex items-center justify-center rounded hover:text-red-500 transition-colors ml-0.5">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {pendingTags.length === 0 && !addInput && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                                        Ketik nama tag lalu tekan Enter untuk menambahkan ke list
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
                                <Button type="button" variant="ghost" size="sm" onClick={closeAddModal}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 text-sm">
                                    Batal
                                </Button>
                                <Button type="button" size="sm" onClick={handleAddSubmit}
                                    disabled={adding || (pendingTags.length === 0 && !addInput.trim())}
                                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-violet-500/20">
                                    {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Simpan {pendingTags.length > 0 || addInput.trim()
                                        ? `(${pendingTags.length + (addInput.trim() ? 1 : 0)} tag)`
                                        : ""}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Single Delete Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Tag?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Tag <strong className="text-gray-700 dark:text-gray-300">"{selectedTag?.name}"</strong> akan dihapus permanen dan dilepas dari semua blog yang memakainya.
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

            {/* Bulk Delete Dialog */}
            <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus {selectedIds.size} Tag?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            {selectedIds.size} tag yang dipilih akan dihapus permanen dan dilepas dari semua blog yang memakainya.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-700 text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm">
                            {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Semua"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}