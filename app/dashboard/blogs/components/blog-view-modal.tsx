"use client";

import { Blog } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { X, Bot, FileText, Calendar, Tag, User } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props {
    open: boolean;
    onClose: () => void;
    blog: Blog | null;
}

export default function BlogViewModal({ open, onClose, blog }: Props) {
    if (!blog) return null;

    const getAuthorName = () => {
        if (blog.author === "aibys") return "Syahril's AI Assistant (Aibys AI)";
        return blog.user?.name || "Unknown";
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    >
                        {/* Header sticky */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {blog.author === "aibys" ? (
                                    <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1">
                                        <Bot className="w-3 h-3" /> AI
                                    </Badge>
                                ) : (
                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1">
                                        <FileText className="w-3 h-3" /> Manual
                                    </Badge>
                                )}
                                {blog.status === "published" && (
                                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Published</Badge>
                                )}
                                {blog.status === "pending" && (
                                    <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
                                )}
                                {blog.status === "rejected" && (
                                    <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Rejected</Badge>
                                )}
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                whileTap={{ scale: 0.85 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Scrollable content */}
                        <div className="overflow-y-auto flex-1">

                            {/* Cover */}
                            {blog.cover_image && (
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={blog.cover_image}
                                        alt={blog.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                            )}

                            <div className="p-6 space-y-4">

                                {/* Title */}
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {blog.title}
                                </h1>

                                {/* Description */}
                                {blog.description && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed border-l-4 border-blue-500 pl-3">
                                        {blog.description}
                                    </p>
                                )}

                                {/* Meta */}
                                <div className="flex flex-wrap items-center gap-4 py-3 border-y border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                                    {/* Author */}
                                    <div className="flex items-center gap-1.5">
                                        {blog.author === "aibys" ? (
                                            <Bot className="w-3.5 h-3.5 text-purple-500" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                        <span className={blog.author === "aibys" ? "text-purple-600 dark:text-purple-400 font-medium" : "font-medium"}>
                                            {getAuthorName()}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>
                                            {format(new Date(blog.created_at), "dd MMM yyyy", { locale: id })}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    {blog.tags?.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Tag className="w-3.5 h-3.5" />
                                            {blog.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Reject comment */}
                                {blog.reject_comment && (
                                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
                                        <strong>Alasan penolakan:</strong> {blog.reject_comment}
                                    </div>
                                )}

                                {/* Blog content — rendered as HTML */}
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: blog.content }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}