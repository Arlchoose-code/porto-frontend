"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Education } from "@/lib/types";
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
    Plus, Search, Pencil, Trash2,
    GraduationCap, Loader2, BookOpen, ChevronDown, ChevronUp
} from "lucide-react";
import EducationFormModal from "./components/education-form-modal";

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.18 } }
};

function getPeriod(edu: Education): string {
    const start = edu.start_year || "—";
    const end = edu.end_year || "Sekarang";
    return `${start} – ${end}`;
}

function getDuration(edu: Education): string {
    if (!edu.start_year) return "";
    const end = edu.end_year || new Date().getFullYear();
    const years = end - edu.start_year;
    if (years <= 0) return "";
    return `${years} tahun`;
}

export default function EducationsPage() {
    const [educations, setEducations] = useState<Education[]>([]);
    const [filtered, setFiltered] = useState<Education[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [formModal, setFormModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedEdu, setSelectedEdu] = useState<Education | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchEducations = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/educations");
            setEducations(res.data.data || []);
        } catch {
            toast.error("Gagal memuat educations");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchEducations(); }, [fetchEducations]);

    useEffect(() => {
        if (!search.trim()) { setFiltered(educations); return; }
        const q = search.toLowerCase();
        setFiltered(educations.filter((e) =>
            e.school.toLowerCase().includes(q) ||
            e.degree?.toLowerCase().includes(q) ||
            e.field?.toLowerCase().includes(q)
        ));
    }, [search, educations]);

    const handleDelete = async () => {
        if (!selectedEdu) return;
        setDeleting(true);
        try {
            await api.delete(`/educations/${selectedEdu.id}`);
            toast.success("Education dihapus!");
            setDeleteDialog(false);
            setSelectedEdu(null);
            if (expandedId === selectedEdu.id) setExpandedId(null);
            fetchEducations(true);
        } catch {
            toast.error("Gagal hapus education");
        } finally {
            setDeleting(false);
        }
    };

    const stats = [
        { label: "Total", value: educations.length, color: "text-sky-500" },
        { label: "Formal", value: educations.filter((e) => e.degree && !e.degree.includes("Lainnya")).length, color: "text-indigo-500" },
        {
            label: "Rentang",
            value: educations.length > 0
                ? (() => {
                    const years = educations.filter((e) => e.start_year).map((e) => e.start_year);
                    if (!years.length) return "—";
                    const earliest = Math.min(...years);
                    const latest = educations.some((e) => !e.end_year)
                        ? new Date().getFullYear()
                        : Math.max(...educations.filter((e) => e.end_year).map((e) => e.end_year));
                    return `${latest - earliest} thn`;
                })()
                : "—",
            color: "text-gray-600 dark:text-gray-300"
        },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500" />
                        </motion.div>
                        Educations
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola riwayat pendidikan</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={() => { setSelectedEdu(null); setFormModal(true); }}
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md shadow-sky-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Tambah Education</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Stats */}
            {!initialLoading && educations.length > 0 && (
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
                        placeholder="Cari sekolah, jurusan, jenjang..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm"
                    />
                </div>
            </motion.div>

            {/* List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="h-[80px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada education yang cocok" : "Belum ada education"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Tambah riwayat pendidikan pertamamu!"}
                        </p>
                        {!search && (
                            <Button onClick={() => { setSelectedEdu(null); setFormModal(true); }} size="sm"
                                className="mt-4 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Education
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Timeline */}
                        <div className="relative">
                            <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-800" />

                            <div className="space-y-2">
                                <AnimatePresence>
                                    {filtered.map((edu) => {
                                        const isExpanded = expandedId === edu.id;
                                        const duration = getDuration(edu);
                                        const isOngoing = !edu.end_year;

                                        return (
                                            <motion.div
                                                key={edu.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="show"
                                                exit="exit"
                                                layout
                                            >
                                                <div className="relative pl-11">
                                                    {/* Timeline dot */}
                                                    <div className={`absolute left-4 top-4 w-3 h-3 rounded-full border-2 z-10 transition-colors ${
                                                        isOngoing
                                                            ? "bg-sky-400 border-sky-500 shadow-sm shadow-sky-500/40"
                                                            : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-600"
                                                    }`}>
                                                        {isOngoing && (
                                                            <motion.div
                                                                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className="absolute inset-0 rounded-full bg-sky-400"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Card */}
                                                    <div className={`bg-white dark:bg-gray-900 border rounded-xl transition-all duration-200 group ${
                                                        isExpanded
                                                            ? "border-sky-200 dark:border-sky-800/60 shadow-sm"
                                                            : "border-gray-200 dark:border-gray-800 hover:border-sky-200 dark:hover:border-sky-800/60 hover:shadow-sm"
                                                    }`}>
                                                        {/* Main row */}
                                                        <div className="flex items-center gap-3 p-3.5">
                                                            {/* Logo / initial */}
                                                            <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-800/30 flex items-center justify-center">
                                                                {edu.logo_url ? (
                                                                    <img src={edu.logo_url} alt={edu.school}
                                                                        className="w-full h-full object-contain p-1" />
                                                                ) : (
                                                                    <span className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase">
                                                                        {edu.school.charAt(0)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                                        {edu.school}
                                                                    </h3>
                                                                    {isOngoing && (
                                                                        <span className="text-[10px] font-semibold bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-md shrink-0">
                                                                            AKTIF
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    {edu.degree && (
                                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{edu.degree}</span>
                                                                    )}
                                                                    {edu.field && (
                                                                        <>
                                                                            {edu.degree && <span className="text-gray-300 dark:text-gray-700">·</span>}
                                                                            <span>{edu.field}</span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                                                    <BookOpen className="w-3 h-3" />
                                                                    <span>{getPeriod(edu)}</span>
                                                                    {duration && (
                                                                        <>
                                                                            <span className="text-gray-300 dark:text-gray-700">·</span>
                                                                            <span>{duration}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                {edu.description && (
                                                                    <motion.button
                                                                        onClick={() => setExpandedId(isExpanded ? null : edu.id)}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
                                                                        whileTap={{ scale: 0.85 }}
                                                                    >
                                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                                    </motion.button>
                                                                )}
                                                                <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 flex gap-0.5">
                                                                    <motion.button
                                                                        onClick={() => { setSelectedEdu(edu); setFormModal(true); }}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                                        whileTap={{ scale: 0.85 }} title="Edit"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </motion.button>
                                                                    <motion.button
                                                                        onClick={() => { setSelectedEdu(edu); setDeleteDialog(true); }}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                                        whileTap={{ scale: 0.85 }} title="Hapus"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded description */}
                                                        <AnimatePresence>
                                                            {isExpanded && edu.description && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="px-3.5 pb-3.5 border-t border-gray-100 dark:border-gray-800">
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line mt-3">
                                                                            {edu.description}
                                                                        </p>
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
            <EducationFormModal
                open={formModal}
                onClose={() => { setFormModal(false); setSelectedEdu(null); }}
                onSuccess={() => fetchEducations(true)}
                education={selectedEdu}
            />

            {/* Delete dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Education?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Data pendidikan di <strong className="text-gray-700 dark:text-gray-300">"{selectedEdu?.school}"</strong> akan dihapus permanen.
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