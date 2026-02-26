"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Tool } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Search, Trash2, Loader2, Plus, Wrench,
    Pencil, X, ChevronLeft, ChevronRight,
    ToggleLeft, ToggleRight, ImageIcon, Hash,
    AlignLeft, Tag, ArrowUpDown, Eye, EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const CATEGORY_COLORS: Record<string, string> = {
    hash:      "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    encoding:  "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    text:      "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    generator: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    json:      "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    network:   "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    ml:        "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800",
};
const getCategoryColor = (cat: string) =>
    CATEGORY_COLORS[cat?.toLowerCase()] ??
    "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700";

interface FormState {
    name: string;
    slug: string;
    description: string;
    category: string;
    order: number;
    is_active: boolean;
    icon: File | null;
    iconPreview: string;
}

const emptyForm = (): FormState => ({
    name: "", slug: "", description: "", category: "",
    order: 0, is_active: true, icon: null, iconPreview: "",
});

export default function ToolsPage() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterActive, setFilterActive] = useState<string>("all");

    // Registry — di-fetch dari API, bukan hardcoded!
    const [registryItems, setRegistryItems] = useState<Array<{ slug: string; name: string }>>([]);
    const [registryLoading, setRegistryLoading] = useState(true);

    // Form modal
    const [formModal, setFormModal] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm());
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Toggle / Delete
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch registry slugs dari backend (auto-sync!) ──
    const fetchRegistry = useCallback(async () => {
        setRegistryLoading(true);
        try {
            const res = await api.get("/tools/registry");
            const raw: Array<{ slug: string; name: string }> = res.data.data || [];
            // Sort by name agar lebih mudah dicari di dropdown
            const sorted = raw
                .map(i => ({ slug: i.slug, name: i.name || i.slug }))
                .sort((a, b) => a.name.localeCompare(b.name));
            setRegistryItems(sorted);
        } catch {
            toast.error("Gagal memuat registry tools");
        } finally {
            setRegistryLoading(false);
        }
    }, []);

    const fetchTools = useCallback(async (isPageChange = false) => {
        if (isPageChange) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/tools/all");
            const all: Tool[] = res.data.data || [];

            // Filter client-side
            let filtered = all;
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(t =>
                    t.name.toLowerCase().includes(q) ||
                    t.slug.toLowerCase().includes(q) ||
                    t.category?.toLowerCase().includes(q) ||
                    t.description?.toLowerCase().includes(q)
                );
            }
            if (filterActive === "active") filtered = filtered.filter(t => t.is_active);
            if (filterActive === "inactive") filtered = filtered.filter(t => !t.is_active);

            const LIMIT = 10;
            const tot = filtered.length;
            const tp = Math.max(1, Math.ceil(tot / LIMIT));
            const safePage = Math.min(page, tp);
            const sliced = filtered.slice((safePage - 1) * LIMIT, safePage * LIMIT);

            setTools(sliced);
            setTotal(tot);
            setTotalPages(tp);
        } catch {
            toast.error("Gagal memuat tools");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, [page, search, filterActive]);

    useEffect(() => {
        fetchRegistry();
        fetchTools(false);
    }, []);
    useEffect(() => { if (!initialLoading) fetchTools(true); }, [page]);
    useEffect(() => { if (!initialLoading) { setPage(1); fetchTools(true); } }, [search, filterActive]);

    // ── Form helpers ──
    const openCreate = () => {
        setEditingTool(null);
        setForm(emptyForm());
        setFormErrors({});
        setFormModal(true);
    };

    const openEdit = (tool: Tool) => {
        setEditingTool(tool);
        setForm({
            name: tool.name,
            slug: tool.slug,
            description: tool.description ?? "",
            category: tool.category ?? "",
            order: tool.order ?? 0,
            is_active: tool.is_active,
            icon: null,
            iconPreview: tool.icon ?? "",
        });
        setFormErrors({});
        setFormModal(true);
    };

    const closeModal = () => {
        setFormModal(false);
        setEditingTool(null);
        setForm(emptyForm());
        setFormErrors({});
    };

    const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const { compressImage } = await import("@/lib/compress-image");
        const compressed = await compressImage(file);
        setForm(prev => ({
            ...prev,
            icon: compressed,
            iconPreview: URL.createObjectURL(compressed),
        }));
    };

    const handleSubmit = async () => {
        const errors: Record<string, string> = {};
        if (!form.name.trim()) errors.name = "Nama wajib diisi";
        if (!form.slug.trim()) errors.slug = "Slug wajib diisi";
        else if (!registryItems.find(i => i.slug === form.slug.trim())) errors.slug = `Slug tidak ada di registry`;
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", form.name.trim());
            fd.append("slug", form.slug.trim());
            fd.append("description", form.description.trim());
            fd.append("category", form.category.trim());
            fd.append("order", String(form.order));
            fd.append("is_active", String(form.is_active));
            if (form.icon) fd.append("icon", form.icon);

            if (editingTool) {
                await api.put(`/tools/${editingTool.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
                toast.success("Tool diperbarui!");
            } else {
                await api.post("/tools", fd, { headers: { "Content-Type": "multipart/form-data" } });
                toast.success("Tool ditambahkan!");
            }
            closeModal();
            fetchTools(true);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { errors?: Record<string, string>; message?: string } } };
            const apiErrors = e?.response?.data?.errors;
            if (apiErrors) setFormErrors(apiErrors);
            else toast.error(e?.response?.data?.message || "Gagal menyimpan tool");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (tool: Tool) => {
        setTogglingId(tool.id);
        try {
            await api.put(`/tools/${tool.id}/toggle`);
            toast.success(tool.is_active ? "Tool dinonaktifkan" : "Tool diaktifkan");
            fetchTools(true);
        } catch {
            toast.error("Gagal toggle tool");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedTool) return;
        setDeleting(true);
        try {
            await api.delete(`/tools/${selectedTool.id}`);
            toast.success(`Tool "${selectedTool.name}" dihapus!`);
            setDeleteDialog(false);
            setSelectedTool(null);
            fetchTools(true);
        } catch {
            toast.error("Gagal hapus tool");
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

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
                        </motion.div>
                        Tools
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Kelola developer tools
                        {!registryLoading && (
                            <span className="ml-1.5 text-teal-500 font-medium">· {registryItems.length} tersedia di registry</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!initialLoading && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-center">
                            <span className="text-base font-bold text-teal-500">{total}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">tool</span>
                        </div>
                    )}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button onClick={openCreate} size="sm"
                            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Tambah Tool</span>
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari nama, slug, kategori..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
                </div>
                <div className="flex gap-1.5">
                    {(["all", "active", "inactive"] as const).map((f) => (
                        <button key={f} onClick={() => setFilterActive(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                filterActive === f
                                    ? "bg-teal-500 text-white border-teal-500"
                                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-teal-300"
                            }`}>
                            {f === "all" ? "Semua" : f === "active" ? "Aktif" : "Nonaktif"}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tool List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : tools.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search || filterActive !== "all" ? "Tidak ada tool yang cocok" : "Belum ada tool"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search || filterActive !== "all" ? "Coba kata kunci atau filter lain" : "Tambah tool pertama sekarang"}
                        </p>
                        {!search && filterActive === "all" && (
                            <Button onClick={openCreate} size="sm"
                                className="mt-4 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Tool
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        {tools.map((tool) => (
                            <div key={tool.id}
                                className={`bg-white dark:bg-gray-900 border rounded-xl p-3.5 transition-all duration-150 group hover:shadow-sm ${
                                    tool.is_active
                                        ? "border-gray-200 dark:border-gray-800 hover:border-teal-200 dark:hover:border-teal-800"
                                        : "border-dashed border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-80"
                                }`}>
                                <div className="flex items-center gap-3">
                                    {/* Icon */}
                                    <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                        {tool.icon ? (
                                            <img src={tool.icon} alt={tool.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Wrench className="w-4 h-4 text-teal-400" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                            {tool.category && (
                                                <Badge className={`text-[10px] px-1.5 py-0 h-4 ${getCategoryColor(tool.category)}`}>
                                                    {tool.category}
                                                </Badge>
                                            )}
                                            <Badge className={`text-[10px] px-1.5 py-0 h-4 gap-0.5 ${
                                                tool.is_active
                                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700"
                                            }`}>
                                                {tool.is_active ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                                                <span className="hidden sm:inline">{tool.is_active ? "Aktif" : "Nonaktif"}</span>
                                            </Badge>
                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                                                #{tool.order}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                            {tool.name}
                                        </h3>

                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                            <span className="font-mono truncate max-w-[120px] sm:max-w-[200px]">{tool.slug}</span>
                                            {tool.description && (
                                                <span className="hidden sm:block truncate max-w-[200px] text-gray-400">— {tool.description}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                        {/* Toggle active */}
                                        <motion.button onClick={() => handleToggle(tool)}
                                            disabled={togglingId === tool.id}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                tool.is_active
                                                    ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                    : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                            }`}
                                            whileTap={{ scale: 0.85 }} title={tool.is_active ? "Nonaktifkan" : "Aktifkan"}>
                                            {togglingId === tool.id
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : tool.is_active
                                                    ? <ToggleRight className="w-3.5 h-3.5" />
                                                    : <ToggleLeft className="w-3.5 h-3.5" />
                                            }
                                        </motion.button>

                                        <motion.button onClick={() => openEdit(tool)}
                                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                                            whileTap={{ scale: 0.85 }} title="Edit">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </motion.button>

                                        <motion.button onClick={() => { setSelectedTool(tool); setDeleteDialog(true); }}
                                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            whileTap={{ scale: 0.85 }} title="Hapus">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                    className={`h-8 w-8 p-0 text-sm ${page === p ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600" : "border-gray-200 dark:border-gray-700"}`}>
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

            {/* ── Form Modal ── */}
            <AnimatePresence>
                {formModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.97 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="relative w-full sm:max-w-[520px] bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-200/80 dark:border-gray-800">

                            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                        <Wrench className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                            {editingTool ? "Edit Tool" : "Tambah Tool"}
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {editingTool ? `Mengubah "${editingTool.name}"` : "Tool baru dari registry"}
                                        </p>
                                    </div>
                                </div>
                                <motion.button onClick={closeModal} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto max-h-[65vh] px-6 pb-2 space-y-4">

                                {/* Icon upload */}
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                                        {form.iconPreview ? (
                                            <img src={form.iconPreview} alt="icon" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Icon Tool</Label>
                                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 transition-colors">
                                            <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs text-gray-500">{form.icon ? form.icon.name : "Pilih gambar..."}</span>
                                            <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
                                        </label>
                                        <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, SVG — maks 2MB</p>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <AlignLeft className="w-3 h-3" /> Nama Tool <span className="text-red-500">*</span>
                                    </Label>
                                    <Input value={form.name}
                                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Contoh: MD5 Hash Generator"
                                        className={`h-9 bg-gray-50 dark:bg-gray-900 text-sm ${formErrors.name ? "border-red-400" : "border-gray-200 dark:border-gray-800"}`} />
                                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                                </div>

                                {/* Slug — select dari registry (auto-fetch dari API!) */}
                                <div>
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <Hash className="w-3 h-3" /> Slug (Registry) <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={form.slug}
                                        disabled={!!editingTool || registryLoading}
                                        onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))}
                                        className={`w-full h-9 px-3 rounded-lg border text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors ${
                                            formErrors.slug ? "border-red-400" : "border-gray-200 dark:border-gray-800"
                                        } ${(editingTool || registryLoading) ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <option value="">
                                            {registryLoading ? "Memuat registry..." : "-- Pilih tool dari registry --"}
                                        </option>
                                        {/* Di-fetch dari backend — tampil nama, value tetap slug */}
                                        {registryItems.map(item => (
                                            <option key={item.slug} value={item.slug}>{item.name}</option>
                                        ))}
                                    </select>
                                    {editingTool && <p className="text-[10px] text-gray-400 mt-1">Slug tidak bisa diubah setelah dibuat</p>}
                                    {!editingTool && !registryLoading && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {registryItems.length} tool tersedia di registry
                                        </p>
                                    )}
                                    {formErrors.slug && <p className="text-xs text-red-500 mt-1">{formErrors.slug}</p>}
                                </div>

                                {/* Description */}
                                <div>
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <AlignLeft className="w-3 h-3" /> Deskripsi
                                    </Label>
                                    <Textarea value={form.description}
                                        onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Jelaskan fungsi tool ini..."
                                        rows={2}
                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 resize-none text-sm" />
                                </div>

                                {/* Category + Order */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                            <Tag className="w-3 h-3" /> Kategori
                                        </Label>
                                        <Input value={form.category}
                                            onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                                            placeholder="hash, text, json, ml..."
                                            className="h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                            <ArrowUpDown className="w-3 h-3" /> Urutan
                                        </Label>
                                        <Input type="number" min={0} value={form.order}
                                            onChange={(e) => setForm(p => ({ ...p, order: Number(e.target.value) }))}
                                            className="h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm" />
                                    </div>
                                </div>

                                {/* Is Active toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Aktif</p>
                                        <p className="text-xs text-gray-400">Tool tampil di halaman publik</p>
                                    </div>
                                    <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                                        className="transition-transform active:scale-95">
                                        {form.is_active
                                            ? <ToggleRight className="w-8 h-8 text-teal-500" />
                                            : <ToggleLeft className="w-8 h-8 text-gray-400" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
                                <Button type="button" variant="ghost" size="sm" onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 text-sm">
                                    Batal
                                </Button>
                                <Button type="button" size="sm" onClick={handleSubmit} disabled={submitting}
                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-teal-500/20">
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingTool ? "Simpan Perubahan" : "Tambah Tool"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Tool?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Tool <strong className="text-gray-700 dark:text-gray-300">"{selectedTool?.name}"</strong> akan dihapus permanen.
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