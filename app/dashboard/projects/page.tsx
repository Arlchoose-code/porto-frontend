"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Project } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Plus, Search, Eye, Pencil, Trash2,
    FolderOpen, Loader2, Link, Layers,
    Monitor, Image as ImageIcon, ChevronLeft, ChevronRight
} from "lucide-react";
import ProjectFormModal from "./components/project-form-modal";
import ProjectViewModal from "./components/project-view-modal";
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

const PLATFORM_COLORS: Record<string, string> = {
    Web: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Mobile: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    Desktop: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    API: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    CLI: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    Other: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

// Warna text untuk stat cards per platform
const PLATFORM_TEXT_COLORS: Record<string, string> = {
    Web: "text-blue-500",
    Mobile: "text-green-500",
    Desktop: "text-purple-500",
    API: "text-amber-500",
    CLI: "text-gray-500",
    Other: "text-pink-500",
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filtered, setFiltered] = useState<Project[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");

    const [formModal, setFormModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchProjects = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/projects");
            setProjects(res.data.data || []);
        } catch {
            toast.error("Gagal memuat projects");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // Client-side search filter
    useEffect(() => {
        if (!search.trim()) {
            setFiltered(projects);
        } else {
            const q = search.toLowerCase();
            setFiltered(projects.filter((p) =>
                p.title.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.platform?.toLowerCase().includes(q) ||
                p.tech_stacks?.some((t) => t.name.toLowerCase().includes(q))
            ));
        }
        setProjectPage(1);
    }, [search, projects]);

    // Client-side pagination
    const PROJECTS_PER_PAGE = 10;
    const [projectPage, setProjectPage] = useState(1);
    const projectTotalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);
    const paginatedProjects = filtered.slice((projectPage - 1) * PROJECTS_PER_PAGE, projectPage * PROJECTS_PER_PAGE);

    const getProjectPaginationItems = (current: number, total: number): (number | "...")[] => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
        if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
        return [1, "...", current - 1, current, current + 1, "...", total];
    };

    const handleDelete = async () => {
        if (!selectedProject) return;
        setDeleting(true);
        try {
            await api.delete(`/projects/${selectedProject.id}`);
            toast.success("Project dihapus!");
            setDeleteDialog(false);
            setSelectedProject(null);
            fetchProjects(true);
        } catch {
            toast.error("Gagal hapus project");
        } finally {
            setDeleting(false);
        }
    };

    // Stats — semua platform tanpa batas
    const platforms = [...new Set(projects.map((p) => p.platform).filter(Boolean))] as string[];
    const statCards = [
        { label: "Total", value: projects.length, color: "text-blue-500" },
        ...platforms.map((platform) => ({
            label: platform,
            value: projects.filter((p) => p.platform === platform).length,
            color: PLATFORM_TEXT_COLORS[platform] ?? "text-gray-500 dark:text-gray-400",
        })),
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                        </motion.div>
                        Projects
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola semua project portfolio</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button onClick={() => { setSelectedProject(null); setFormModal(true); }} size="sm"
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Tambah Project</span>
                        <span className="sm:hidden text-sm">Tambah</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Stats — semua platform, full width */}
            {!initialLoading && projects.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ gridTemplateColumns: `repeat(${statCards.length}, minmax(0, 1fr))` }}
                    className="grid gap-2">
                    {statCards.map((stat, i) => (
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari judul, platform, tech stack..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
                </div>
            </motion.div>

            {/* Project List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-[80px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada project yang cocok" : "Belum ada project"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Tambah project pertamamu"}
                        </p>
                        {!search && (
                            <Button onClick={() => { setSelectedProject(null); setFormModal(true); }} size="sm"
                                className="mt-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-3.5 h-3.5" /> Tambah Project
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        <AnimatePresence>
                            {paginatedProjects.map((project) => (
                                <motion.div key={project.id} variants={itemVariants} exit="exit" layout
                                    whileHover={{ y: -1, transition: { duration: 0.15 } }}
                                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 transition-all duration-200 group hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm">

                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {/* Thumbnail */}
                                        <motion.div whileHover={{ scale: 1.05 }} className="shrink-0">
                                            {project.images && project.images.length > 0 ? (
                                                <img src={project.images[0].image_url} alt={project.title}
                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                                                    <FolderOpen className="w-5 h-5 text-blue-400" />
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                                                {project.platform && (
                                                    <Badge className={`text-xs gap-1 ${PLATFORM_COLORS[project.platform] || PLATFORM_COLORS["Other"]}`}>
                                                        <Monitor className="w-2.5 h-2.5" />
                                                        <span className="hidden sm:inline">{project.platform}</span>
                                                    </Badge>
                                                )}
                                                {project.images && project.images.length > 0 && (
                                                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 text-xs gap-1 hidden sm:flex">
                                                        <ImageIcon className="w-2.5 h-2.5" />
                                                        {project.images.length}
                                                    </Badge>
                                                )}
                                                {project.tech_stacks?.slice(0, 2).map((tech) => (
                                                    <Badge key={tech.id} variant="outline"
                                                        className="text-xs border-gray-200 dark:border-gray-700 hidden md:flex">{tech.name}</Badge>
                                                ))}
                                                {project.tech_stacks && project.tech_stacks.length > 2 && (
                                                    <span className="text-xs text-gray-400 hidden md:block">+{project.tech_stacks.length - 2}</span>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.title}
                                            </h3>

                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                {project.url && (
                                                    <span className="flex items-center gap-1 truncate max-w-[140px] hidden sm:flex">
                                                        <Link className="w-3 h-3 shrink-0 text-blue-400" />
                                                        <span className="truncate">{project.url}</span>
                                                    </span>
                                                )}
                                                {project.tech_stacks && project.tech_stacks.length > 0 && (
                                                    <span className="flex items-center gap-1 sm:hidden">
                                                        <Layers className="w-3 h-3 text-gray-400" />
                                                        {project.tech_stacks.length} stack
                                                    </span>
                                                )}
                                                <span className="hidden sm:block">
                                                    {format(new Date(project.created_at), "dd MMM yyyy", { locale: id })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                            <motion.button onClick={() => { setSelectedProject(project); setViewModal(true); }}
                                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                whileTap={{ scale: 0.85 }} title="Lihat">
                                                <Eye className="w-3.5 h-3.5" />
                                            </motion.button>
                                            <motion.button onClick={() => { setSelectedProject(project); setFormModal(true); }}
                                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                whileTap={{ scale: 0.85 }} title="Edit">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </motion.button>
                                            <motion.button onClick={() => { setSelectedProject(project); setDeleteDialog(true); }}
                                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                whileTap={{ scale: 0.85 }} title="Hapus">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {projectTotalPages > 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-1 pt-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                        <Button variant="outline" size="sm" onClick={() => setProjectPage(p => Math.max(1, p - 1))}
                            disabled={projectPage === 1} className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </motion.div>
                    {getProjectPaginationItems(projectPage, projectTotalPages).map((p, i) => (
                        p === "..." ? (
                            <span key={`dots-${i}`} className="px-1 text-gray-400 text-sm">···</span>
                        ) : (
                            <motion.div key={p} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                                <Button variant={projectPage === p ? "default" : "outline"} size="sm"
                                    onClick={() => setProjectPage(Number(p))}
                                    className={`h-8 w-8 p-0 text-sm ${projectPage === p ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "border-gray-200 dark:border-gray-700"}`}>
                                    {p}
                                </Button>
                            </motion.div>
                        )
                    ))}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                        <Button variant="outline" size="sm" onClick={() => setProjectPage(p => Math.min(projectTotalPages, p + 1))}
                            disabled={projectPage === projectTotalPages} className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </motion.div>
            )}

            {/* Modals */}
            <ProjectFormModal open={formModal} onClose={() => { setFormModal(false); setSelectedProject(null); }}
                onSuccess={() => fetchProjects(true)} project={selectedProject} />
            <ProjectViewModal open={viewModal} onClose={() => { setViewModal(false); setSelectedProject(null); }}
                project={selectedProject} />

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Project <strong className="text-gray-700 dark:text-gray-300">"{selectedProject?.title}"</strong> beserta semua gambarnya akan dihapus permanen.
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