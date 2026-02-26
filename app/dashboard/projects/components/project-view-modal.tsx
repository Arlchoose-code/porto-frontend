"use client";

import { Project } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { X, FolderOpen, Link, Layers, Monitor, Calendar, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    project: Project | null;
}

const PLATFORM_COLORS: Record<string, string> = {
    Web: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Mobile: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    Desktop: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    API: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    CLI: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    Other: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

export default function ProjectViewModal({ open, onClose, project }: Props) {
    const [activeImage, setActiveImage] = useState(0);

    if (!open || !project) return null;

    const images = project.images || [];

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-800 overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                    <FolderOpen className="w-4 h-4 text-blue-500" />
                                </div>
                                <h2 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{project.title}</h2>
                            </div>
                            <button onClick={onClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto max-h-[75vh] sm:max-h-[70vh]">
                            {/* Image gallery */}
                            {images.length > 0 && (
                                <div className="relative">
                                    <img src={images[activeImage]?.image_url} alt={project.title}
                                        className="w-full h-48 object-cover" />
                                    {images.length > 1 && (
                                        <>
                                            <button onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                                {images.map((_, i) => (
                                                    <button key={i} onClick={() => setActiveImage(i)}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImage ? "bg-white" : "bg-white/40"}`} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="p-5 space-y-4">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {project.platform && (
                                        <Badge className={`gap-1 ${PLATFORM_COLORS[project.platform] || PLATFORM_COLORS["Other"]}`}>
                                            <Monitor className="w-3 h-3" /> {project.platform}
                                        </Badge>
                                    )}
                                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(project.created_at), "dd MMM yyyy", { locale: id })}
                                    </Badge>
                                </div>

                                {/* Description */}
                                {project.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{project.description}</p>
                                )}

                                {/* URL */}
                                {project.url && (
                                    <a href={project.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                        <Link className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{project.url}</span>
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                )}

                                {/* Tech stacks */}
                                {project.tech_stacks && project.tech_stacks.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Layers className="w-3 h-3" /> Tech Stacks
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {project.tech_stacks.map((tech) => (
                                                <Badge key={tech.id} variant="outline"
                                                    className="text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                                                    {tech.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}