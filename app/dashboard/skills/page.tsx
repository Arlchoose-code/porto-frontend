"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Skill } from "@/lib/types";
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
    Plus, Search, Pencil, Trash2, Star,
    Loader2, Code2, Database, Wrench, Layers, Sparkles
} from "lucide-react";
import SkillFormModal from "./components/skill-form-modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const CATEGORY_CONFIG: Record<string, {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    bar: string;
}> = {
    language:  { label: "Language",  icon: Code2,    color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",   bar: "bg-blue-500" },
    framework: { label: "Framework", icon: Layers,   color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", bar: "bg-violet-500" },
    database:  { label: "Database",  icon: Database, color: "text-green-600 dark:text-green-400",  bg: "bg-green-500/10 border-green-500/20",  bar: "bg-green-500" },
    tool:      { label: "Tool",      icon: Wrench,   color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",  bar: "bg-amber-500" },
    other:     { label: "Other",     icon: Sparkles, color: "text-pink-600 dark:text-pink-400",    bg: "bg-pink-500/10 border-pink-500/20",    bar: "bg-pink-500" },
};

const LEVEL_CONFIG: Record<string, { label: string; pct: number; color: string }> = {
    beginner:     { label: "Beginner",     pct: 25,  color: "bg-gray-400" },
    intermediate: { label: "Intermediate", pct: 50,  color: "bg-blue-500" },
    advanced:     { label: "Advanced",     pct: 75,  color: "bg-violet-500" },
    expert:       { label: "Expert",       pct: 100, color: "bg-emerald-500" },
};

const CATEGORY_ORDER = ["language", "framework", "database", "tool", "other"];

export default function SkillsPage() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const [formModal, setFormModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSkills = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/skills");
            setSkills(res.data.data || []);
        } catch {
            toast.error("Gagal memuat skills");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchSkills(); }, [fetchSkills]);

    const handleDelete = async () => {
        if (!selectedSkill) return;
        setDeleting(true);
        try {
            await api.delete(`/skills/${selectedSkill.id}`);
            toast.success("Skill dihapus!");
            setDeleteDialog(false);
            setSelectedSkill(null);
            fetchSkills(true);
        } catch {
            toast.error("Gagal hapus skill");
        } finally {
            setDeleting(false);
        }
    };

    // Filter
    const filtered = skills.filter((s) => {
        const matchSearch = !search.trim() ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.category.toLowerCase().includes(search.toLowerCase());
        const matchCategory = activeCategory === "all" || s.category === activeCategory;
        return matchSearch && matchCategory;
    });

    // Group by category, respecting CATEGORY_ORDER
    const grouped = CATEGORY_ORDER.reduce<Record<string, Skill[]>>((acc, cat) => {
        const items = filtered.filter((s) => s.category === cat);
        if (items.length > 0) acc[cat] = items;
        return acc;
    }, {});

    // Stats
    const stats = [
        { label: "Total", value: skills.length, color: "text-violet-500", filter: "all" },
        ...CATEGORY_ORDER
            .filter((cat) => skills.some((s) => s.category === cat))
            .map((cat) => ({
                label: CATEGORY_CONFIG[cat].label,
                value: skills.filter((s) => s.category === cat).length,
                color: CATEGORY_CONFIG[cat].color,
                filter: cat,
            })),
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.04 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
                        </motion.div>
                        Skills
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola semua skill & keahlian</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={() => { setSelectedSkill(null); setFormModal(true); }}
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-md shadow-violet-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Tambah Skill</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Stats — full width dynamic grid */}
            {!initialLoading && skills.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
                    className="grid gap-2"
                >
                    {stats.map((stat, i) => (
                        <motion.button
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setActiveCategory(stat.filter)}
                            className={`bg-white dark:bg-gray-900 border rounded-xl p-3 text-center transition-all cursor-pointer hover:shadow-sm ${
                                activeCategory === stat.filter
                                    ? "border-violet-400 dark:border-violet-600 ring-1 ring-violet-400/30"
                                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                            }`}
                        >
                            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                        placeholder="Cari skill..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm"
                    />
                </div>
            </motion.div>

            {/* Skill list grouped by category */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        {[1, 2].map((g) => (
                            <div key={g} className="space-y-2">
                                <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : Object.keys(grouped).length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada skill yang cocok" : "Belum ada skill"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Tambah skill pertamamu!"}
                        </p>
                        {!search && (
                            <Button onClick={() => { setSelectedSkill(null); setFormModal(true); }} size="sm"
                                className="mt-4 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Skill
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                        {Object.entries(grouped).map(([category, items]) => {
                            const cfg = CATEGORY_CONFIG[category];
                            const Icon = cfg.icon;
                            return (
                                <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    {/* Category header */}
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            {cfg.label}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-600">{items.length} skill</span>
                                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                    </div>

                                    {/* Skill cards grid */}
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                                    >
                                        <AnimatePresence>
                                            {items.map((skill) => {
                                                const level = LEVEL_CONFIG[skill.level];
                                                return (
                                                    <motion.div
                                                        key={skill.id}
                                                        variants={itemVariants}
                                                        exit="exit"
                                                        layout
                                                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                                                        className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 hover:border-violet-200 dark:hover:border-violet-800/60 hover:shadow-sm transition-all duration-200 overflow-hidden"
                                                    >
                                                        {/* Level bar bottom */}
                                                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-100 dark:bg-gray-800">
                                                            <motion.div
                                                                className={`h-full ${level?.color ?? "bg-gray-300"}`}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${level?.pct ?? 0}%` }}
                                                                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                                                            />
                                                        </div>

                                                        <div className="flex items-start justify-between gap-1 mb-2">
                                                            {/* Icon */}
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                                                                {skill.icon_url ? (
                                                                    <img src={skill.icon_url} alt={skill.name}
                                                                        className="w-5 h-5 object-contain" />
                                                                ) : (
                                                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                                                )}
                                                            </div>

                                                            {/* Action buttons - hidden until hover */}
                                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                                                                <motion.button
                                                                    onClick={() => { setSelectedSkill(skill); setFormModal(true); }}
                                                                    className="p-1 rounded-md text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                                    whileTap={{ scale: 0.85 }}
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                </motion.button>
                                                                <motion.button
                                                                    onClick={() => { setSelectedSkill(skill); setDeleteDialog(true); }}
                                                                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                                    whileTap={{ scale: 0.85 }}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </motion.button>
                                                            </div>
                                                        </div>

                                                        {/* Name */}
                                                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                            {skill.name}
                                                        </p>

                                                        {/* Level label */}
                                                        <p className={`text-[10px] mt-0.5 font-medium ${level?.color.replace("bg-", "text-").replace("-500", "-500").replace("-400", "-400") ?? "text-gray-400"}`}
                                                            style={{ color: undefined }}
                                                        >
                                                            <span className={`
                                                                ${skill.level === "expert" ? "text-emerald-500" :
                                                                  skill.level === "advanced" ? "text-violet-500" :
                                                                  skill.level === "intermediate" ? "text-blue-500" :
                                                                  "text-gray-400"}
                                                            `}>
                                                                {level?.label ?? skill.level}
                                                            </span>
                                                        </p>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <SkillFormModal
                open={formModal}
                onClose={() => { setFormModal(false); setSelectedSkill(null); }}
                onSuccess={() => fetchSkills(true)}
                skill={selectedSkill}
            />

            {/* Delete dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Skill?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Skill <strong className="text-gray-700 dark:text-gray-300">"{selectedSkill?.name}"</strong> akan dihapus permanen.
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