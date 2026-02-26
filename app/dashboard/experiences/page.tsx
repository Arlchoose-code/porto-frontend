"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Experience } from "@/lib/types";
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
    Plus, Search, Eye, Pencil, Trash2, Briefcase,
    Loader2, MapPin, Calendar, ImageIcon, ChevronDown, ChevronUp
} from "lucide-react";
import ExperienceFormModal from "./components/experience-form-modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.18 } }
};

function formatPeriod(exp: Experience): string {
    const start = exp.start_date ? format(new Date(exp.start_date), "MMM yyyy", { locale: id }) : "—";
    const end = exp.is_current ? "Present" : exp.end_date ? format(new Date(exp.end_date), "MMM yyyy", { locale: id }) : "—";
    return `${start} – ${end}`;
}

function calcDuration(exp: Experience): string {
    if (!exp.start_date) return "";
    const start = new Date(exp.start_date);
    const end = exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : null;
    if (!end) return "";
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 1) return "< 1 bln";
    if (months < 12) return `${months} bln`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y} thn ${m} bln` : `${y} thn`;
}

function ImageCarousel({ images }: { images: Experience["images"] }) {
    const [active, setActive] = useState(0);
    if (!images || images.length === 0) return null;
    return (
        <div className="mt-3">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video">
                <img src={images[active].image_url} alt="" className="w-full h-full object-cover" />
                {images.length > 1 && (
                    <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                        {images.map((_, i) => (
                            <button key={i} onClick={() => setActive(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white" : "bg-white/40"}`} />
                        ))}
                    </div>
                )}
            </div>
            {images.length > 1 && (
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button key={img.id} onClick={() => setActive(i)}
                            className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === active ? "border-emerald-400" : "border-transparent opacity-60 hover:opacity-100"}`}>
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ExperiencesPage() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [filtered, setFiltered] = useState<Experience[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [formModal, setFormModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchExperiences = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/experiences");
            setExperiences(res.data.data || []);
        } catch {
            toast.error("Gagal memuat experiences");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

    useEffect(() => {
        if (!search.trim()) { setFiltered(experiences); return; }
        const q = search.toLowerCase();
        setFiltered(experiences.filter((e) =>
            e.company.toLowerCase().includes(q) ||
            e.role.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q)
        ));
    }, [search, experiences]);

    const handleDelete = async () => {
        if (!selectedExp) return;
        setDeleting(true);
        try {
            await api.delete(`/experiences/${selectedExp.id}`);
            toast.success("Experience dihapus!");
            setDeleteDialog(false);
            setSelectedExp(null);
            if (expandedId === selectedExp.id) setExpandedId(null);
            fetchExperiences(true);
        } catch {
            toast.error("Gagal hapus experience");
        } finally {
            setDeleting(false);
        }
    };

    const totalMonths = experiences.reduce((acc, exp) => {
        if (!exp.start_date) return acc;
        const start = new Date(exp.start_date);
        const end = exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : null;
        if (!end) return acc;
        return acc + (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    }, 0);
    const totalYears = Math.floor(totalMonths / 12);
    const remainMonths = totalMonths % 12;
    const totalLabel = totalYears > 0 ? `${totalYears} thn${remainMonths > 0 ? ` ${remainMonths} bln` : ""}` : `${totalMonths} bln`;

    const currentCount = experiences.filter((e) => e.is_current).length;
    const stats = [
        { label: "Total", value: experiences.length, color: "text-emerald-500" },
        { label: "Aktif", value: currentCount, color: "text-teal-500" },
        { label: "Total Durasi", value: totalLabel, color: "text-gray-600 dark:text-gray-300" },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                        </motion.div>
                        Experiences
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola riwayat pengalaman kerja</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={() => { setSelectedExp(null); setFormModal(true); }}
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Tambah Experience</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Stats */}
            {!initialLoading && experiences.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="grid grid-cols-3 gap-2"
                >
                    {stats.map((stat, i) => (
                        <motion.div key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center"
                        >
                            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                        placeholder="Cari perusahaan, role, lokasi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm"
                    />
                </div>
            </motion.div>

            {/* Experience list */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="h-[88px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada experience yang cocok" : "Belum ada experience"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Tambah riwayat pekerjaan pertamamu!"}
                        </p>
                        {!search && (
                            <Button onClick={() => { setSelectedExp(null); setFormModal(true); }} size="sm"
                                className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Experience
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        {/* Timeline line */}
                        <div className="relative">
                            <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-800" />

                            <div className="space-y-2">
                                <AnimatePresence>
                                    {filtered.map((exp, idx) => {
                                        const isExpanded = expandedId === exp.id;
                                        const duration = calcDuration(exp);
                                        const hasImages = exp.images && exp.images.length > 0;

                                        return (
                                            <motion.div
                                                key={exp.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="show"
                                                exit="exit"
                                                layout
                                            >
                                                <div className={`relative pl-11 transition-all duration-200`}>
                                                    {/* Timeline dot */}
                                                    <div className={`absolute left-4 top-4 w-3 h-3 rounded-full border-2 transition-colors z-10 ${
                                                        exp.is_current
                                                            ? "bg-emerald-400 border-emerald-500 shadow-sm shadow-emerald-500/40"
                                                            : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-600"
                                                    }`}>
                                                        {exp.is_current && (
                                                            <motion.div
                                                                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className="absolute inset-0 rounded-full bg-emerald-400"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Card */}
                                                    <div className={`bg-white dark:bg-gray-900 border rounded-xl transition-all duration-200 group ${
                                                        isExpanded
                                                            ? "border-emerald-200 dark:border-emerald-800/60 shadow-sm"
                                                            : "border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800/60 hover:shadow-sm"
                                                    }`}>
                                                        {/* Main row */}
                                                        <div className="flex items-center gap-3 p-3.5">
                                                            {/* Company initial avatar */}
                                                            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-800/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
                                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                                                    {exp.company.charAt(0)}
                                                                </span>
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                                        {exp.role}
                                                                    </h3>
                                                                    {exp.is_current && (
                                                                        <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                                                                            PRESENT
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium line-clamp-1">{exp.company}</p>
                                                                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {formatPeriod(exp)}
                                                                        {duration && <span className="text-gray-300 dark:text-gray-600">·</span>}
                                                                        {duration && <span>{duration}</span>}
                                                                    </span>
                                                                    {exp.location && (
                                                                        <span className="flex items-center gap-1 hidden sm:flex">
                                                                            <MapPin className="w-3 h-3" />
                                                                            {exp.location}
                                                                        </span>
                                                                    )}
                                                                    {hasImages && (
                                                                        <span className="flex items-center gap-1">
                                                                            <ImageIcon className="w-3 h-3" />
                                                                            {exp.images.length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                {/* Expand toggle */}
                                                                {(exp.description || hasImages) && (
                                                                    <motion.button
                                                                        onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                                        whileTap={{ scale: 0.85 }}
                                                                        title="Lihat detail"
                                                                    >
                                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                                    </motion.button>
                                                                )}
                                                                <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 flex gap-0.5">
                                                                    <motion.button
                                                                        onClick={() => { setSelectedExp(exp); setFormModal(true); }}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                                        whileTap={{ scale: 0.85 }} title="Edit"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </motion.button>
                                                                    <motion.button
                                                                        onClick={() => { setSelectedExp(exp); setDeleteDialog(true); }}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                                        whileTap={{ scale: 0.85 }} title="Hapus"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded content */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-100 dark:border-gray-800 mt-0">
                                                                        {exp.location && (
                                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-3 sm:hidden mb-2">
                                                                                <MapPin className="w-3 h-3 text-emerald-400" />
                                                                                {exp.location}
                                                                            </div>
                                                                        )}
                                                                        {exp.description && (
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line mt-3">
                                                                                {exp.description}
                                                                            </p>
                                                                        )}
                                                                        {hasImages && <ImageCarousel images={exp.images} />}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <ExperienceFormModal
                open={formModal}
                onClose={() => { setFormModal(false); setSelectedExp(null); }}
                onSuccess={() => fetchExperiences(true)}
                experience={selectedExp}
            />

            {/* Delete dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Experience?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Experience di <strong className="text-gray-700 dark:text-gray-300">"{selectedExp?.company}"</strong> akan dihapus permanen beserta semua fotonya.
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