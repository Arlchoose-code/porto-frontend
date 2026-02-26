"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Course } from "@/lib/types";
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
    Plus, Search, Pencil, Trash2, Award,
    Loader2, ExternalLink, CalendarDays,
    ChevronDown, ChevronUp, ShieldCheck, ShieldX, ShieldAlert
} from "lucide-react";
import CourseFormModal from "./components/course-form-modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function getCertStatus(course: Course): "valid" | "expired" | "no-expiry" {
    if (!course.expired_at) return "no-expiry";
    return new Date(course.expired_at) >= new Date() ? "valid" : "expired";
}

const STATUS_CONFIG = {
    valid:      { label: "Berlaku",        icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/50" },
    expired:    { label: "Kedaluwarsa",    icon: ShieldX,     color: "text-red-500 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800/50" },
    "no-expiry":{ label: "Seumur Hidup",   icon: ShieldAlert, color: "text-blue-500 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/50" },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.22 } },
    exit:   { opacity: 0, x: -16, transition: { duration: 0.16 } },
};

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [filtered, setFiltered] = useState<Course[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [formModal, setFormModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCourses = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/courses");
            setCourses(res.data.data || []);
        } catch {
            toast.error("Gagal memuat courses");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    useEffect(() => {
        if (!search.trim()) { setFiltered(courses); return; }
        const q = search.toLowerCase();
        setFiltered(courses.filter((c) =>
            c.title.toLowerCase().includes(q) ||
            c.issuer?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        ));
    }, [search, courses]);

    const handleDelete = async () => {
        if (!selectedCourse) return;
        setDeleting(true);
        try {
            await api.delete(`/courses/${selectedCourse.id}`);
            toast.success("Course dihapus!");
            setDeleteDialog(false);
            setSelectedCourse(null);
            if (expandedId === selectedCourse.id) setExpandedId(null);
            fetchCourses(true);
        } catch {
            toast.error("Gagal hapus course");
        } finally {
            setDeleting(false);
        }
    };

    const validCount    = courses.filter((c) => getCertStatus(c) === "valid").length;
    const expiredCount  = courses.filter((c) => getCertStatus(c) === "expired").length;
    const noExpiryCount = courses.filter((c) => getCertStatus(c) === "no-expiry").length;

    const stats = [
        { label: "Total",        value: courses.length, color: "text-orange-500" },
        { label: "Berlaku",      value: validCount,     color: "text-emerald-500" },
        { label: "Expired",      value: expiredCount,   color: "text-red-500" },
        { label: "Seumur Hidup", value: noExpiryCount,  color: "text-blue-500" },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                        </motion.div>
                        Courses & Sertifikasi
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola sertifikasi & kursus</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={() => { setSelectedCourse(null); setFormModal(true); }}
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Tambah Course</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Stats */}
            {!initialLoading && courses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ gridTemplateColumns: `repeat(${stats.filter(s => s.value > 0 || s.label === "Total").length}, minmax(0, 1fr))` }}
                    className="grid gap-2"
                >
                    {stats.filter(s => s.value > 0 || s.label === "Total").map((stat, i) => (
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
                        placeholder="Cari judul, penerbit..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm"
                    />
                </div>
            </motion.div>

            {/* List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="h-[82px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Award className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada course yang cocok" : "Belum ada course"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Tambah sertifikasi pertamamu!"}
                        </p>
                        {!search && (
                            <Button onClick={() => { setSelectedCourse(null); setFormModal(true); }} size="sm"
                                className="mt-4 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Course
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        <AnimatePresence>
                            {filtered.map((course) => {
                                const status = getCertStatus(course);
                                const statusCfg = STATUS_CONFIG[status];
                                const StatusIcon = statusCfg.icon;
                                const isExpanded = expandedId === course.id;
                                const hasDetail = course.description || course.certificate_image;

                                return (
                                    <motion.div
                                        key={course.id}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit="exit"
                                        layout
                                        whileHover={{ y: -1, transition: { duration: 0.13 } }}
                                    >
                                        <div className={`bg-white dark:bg-gray-900 border rounded-xl transition-all duration-200 group ${
                                            isExpanded
                                                ? "border-orange-200 dark:border-orange-800/50 shadow-sm"
                                                : "border-gray-200 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-sm"
                                        }`}>
                                            {/* Main row */}
                                            <div className="flex items-center gap-3 p-3.5">
                                                {/* Cert thumbnail / award icon */}
                                                <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-800/20 flex items-center justify-center">
                                                    {course.certificate_image ? (
                                                        <img src={course.certificate_image} alt={course.title}
                                                            className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Award className="w-5 h-5 text-orange-400" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                            {course.title}
                                                        </h3>
                                                        {/* Status badge */}
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 ${statusCfg.bg} ${statusCfg.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            <span className="hidden sm:inline">{statusCfg.label}</span>
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                                        {course.issuer && (
                                                            <span className="font-medium text-gray-600 dark:text-gray-400">{course.issuer}</span>
                                                        )}
                                                        {course.issued_at && (
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="w-3 h-3" />
                                                                {format(new Date(course.issued_at), "MMM yyyy", { locale: id })}
                                                                {course.expired_at && (
                                                                    <span> – {format(new Date(course.expired_at), "MMM yyyy", { locale: id })}</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    {/* External link */}
                                                    {course.credential_url && (
                                                        <motion.a
                                                            href={course.credential_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                            whileTap={{ scale: 0.85 }}
                                                            title="Lihat kredensial"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </motion.a>
                                                    )}
                                                    {/* Expand */}
                                                    {hasDetail && (
                                                        <motion.button
                                                            onClick={() => setExpandedId(isExpanded ? null : course.id)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                                                            whileTap={{ scale: 0.85 }}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                        </motion.button>
                                                    )}
                                                    <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 flex gap-0.5">
                                                        <motion.button
                                                            onClick={() => { setSelectedCourse(course); setFormModal(true); }}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                            whileTap={{ scale: 0.85 }} title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => { setSelectedCourse(course); setDeleteDialog(true); }}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                            whileTap={{ scale: 0.85 }} title="Hapus"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded detail */}
                                            <AnimatePresence>
                                                {isExpanded && hasDetail && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-3.5 pb-3.5 border-t border-gray-100 dark:border-gray-800">
                                                            {/* Certificate image preview */}
                                                            {course.certificate_image && (
                                                                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                                                    <img
                                                                        src={course.certificate_image}
                                                                        alt="Certificate"
                                                                        className="w-full object-contain max-h-48 bg-gray-50 dark:bg-gray-800"
                                                                    />
                                                                </div>
                                                            )}
                                                            {course.description && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line mt-3">
                                                                    {course.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <CourseFormModal
                open={formModal}
                onClose={() => { setFormModal(false); setSelectedCourse(null); }}
                onSuccess={() => fetchCourses(true)}
                course={selectedCourse}
            />

            {/* Delete dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Course?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Course <strong className="text-gray-700 dark:text-gray-300">"{selectedCourse?.title}"</strong> dan sertifikatnya akan dihapus permanen.
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