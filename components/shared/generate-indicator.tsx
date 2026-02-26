"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, RefreshCw, CheckCircle, Sparkles, AlertCircle, Wand2 } from "lucide-react";

interface GenerateJob {
    id: string;
    type: "generate" | "regenerate";
    keyword?: string;
    // Single regenerate
    blogId?: number;
    blogTitle?: string;
    // Bulk regenerate
    blogIds?: number[];
    blogTitles?: string[];
    completedIds?: number[];
    totalTarget: number;
    saved: number;
    currentTitle?: string;
    startedAt: Date;
    done: boolean;
    failed?: boolean;
}

// Single regenerate — dari reject 1 blog
export const startRegenerateJob = (blogId: number, blogTitle: string) => {
    const job: GenerateJob = {
        id: `regen_${blogId}_${Date.now()}`,
        type: "regenerate",
        blogId,
        blogTitle,
        totalTarget: 1,
        saved: 0,
        completedIds: [],
        startedAt: new Date(),
        done: false,
    };
    const jobs = JSON.parse(localStorage.getItem("generate_jobs") || "[]");
    jobs.push(job);
    localStorage.setItem("generate_jobs", JSON.stringify(jobs));
    window.dispatchEvent(new Event("generate_jobs_updated"));
    return job;
};

// Bulk regenerate — dari bulk reject beberapa blog AI → 1 indicator saja
export const startBulkRegenerateJob = (blogs: { id: number; title: string }[]) => {
    if (blogs.length === 0) return null;
    // Kalau cuma 1, pakai single
    if (blogs.length === 1) return startRegenerateJob(blogs[0].id, blogs[0].title);

    const job: GenerateJob = {
        id: `bulk_regen_${Date.now()}`,
        type: "regenerate",
        blogIds: blogs.map(b => b.id),
        blogTitles: blogs.map(b => b.title),
        completedIds: [],
        totalTarget: blogs.length,
        saved: 0,
        startedAt: new Date(),
        done: false,
    };
    const jobs = JSON.parse(localStorage.getItem("generate_jobs") || "[]");
    jobs.push(job);
    localStorage.setItem("generate_jobs", JSON.stringify(jobs));
    window.dispatchEvent(new Event("generate_jobs_updated"));
    return job;
};

export const startGenerateJob = (keyword: string, total: number) => {
    const job: GenerateJob = {
        id: Date.now().toString(),
        type: "generate",
        keyword: keyword || "random",
        totalTarget: total,
        saved: 0,
        startedAt: new Date(),
        done: false,
    };
    const jobs = JSON.parse(localStorage.getItem("generate_jobs") || "[]");
    jobs.push(job);
    localStorage.setItem("generate_jobs", JSON.stringify(jobs));
    window.dispatchEvent(new Event("generate_jobs_updated"));
    return job;
};

export default function GenerateIndicator() {
    const [jobs, setJobs] = useState<GenerateJob[]>([]);
    const sseRef = useRef<EventSource | null>(null);
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const loadJobs = () => {
        try {
            const stored = JSON.parse(localStorage.getItem("generate_jobs") || "[]");
            setJobs(stored);
        } catch { setJobs([]); }
    };

    useEffect(() => {
        loadJobs();
        window.addEventListener("generate_jobs_updated", loadJobs);
        return () => window.removeEventListener("generate_jobs_updated", loadJobs);
    }, []);

    // Auto-dismiss done jobs setelah 8s
    useEffect(() => {
        const doneJobs = jobs.filter(j => j.done);
        if (doneJobs.length === 0) return;
        const timers = doneJobs.map(job => {
            const elapsed = Date.now() - new Date(job.startedAt).getTime();
            return setTimeout(() => dismiss(job.id), Math.max(0, 8000 - elapsed));
        });
        return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs.map(j => j.id + j.done).join(",")]);

    // SSE connection
    useEffect(() => {
        const activeJobs = jobs.filter(j => !j.done);
        if (activeJobs.length === 0) {
            if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
            return;
        }
        if (sseRef.current) return;

        const token = localStorage.getItem("token");
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const sse = new EventSource(`${baseUrl}/api/blogs/stream?token=${token}`);
        sseRef.current = sse;

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Progress per blog (generate)
                if (data.type === "generate_progress") {
                    setJobs(prev => {
                        const updated = prev.map(j =>
                            j.type === "generate" && !j.done
                                ? { ...j, saved: data.saved, totalTarget: data.total_target, currentTitle: data.current_title }
                                : j
                        );
                        localStorage.setItem("generate_jobs", JSON.stringify(updated));
                        return updated;
                    });
                    if (data.status === "saved") window.dispatchEvent(new Event("blogs_refresh"));
                }

                // Generate semua selesai
                if (data.type === "generate_done") {
                    setJobs(prev => {
                        const updated = prev.map(j =>
                            j.type === "generate" && !j.done
                                ? { ...j, done: true, saved: data.saved, totalTarget: data.total_target, failed: data.failed }
                                : j
                        );
                        localStorage.setItem("generate_jobs", JSON.stringify(updated));
                        return updated;
                    });
                    window.dispatchEvent(new Event("blogs_refresh"));
                    window.dispatchEvent(new CustomEvent("show_toast", {
                        detail: data.failed
                            ? { message: "Gagal generate blog", type: "error" }
                            : { message: "Aibys selesai menulis!", description: `${data.saved} dari ${data.total_target} blog berhasil disimpan`, type: "success" }
                    }));
                }

                // Regenerate done — handle single & bulk dalam 1 job
                if (data.type === "regenerate_done") {
                    setJobs(prev => {
                        const updated = prev.map(j => {
                            if (j.type !== "regenerate" || j.done) return j;

                            const isBulk = Array.isArray(j.blogIds) && j.blogIds.length > 1;

                            if (isBulk) {
                                // Cek apakah blog_id ini masuk ke job ini
                                if (!j.blogIds!.includes(data.blog_id)) return j;

                                const completedIds = [...(j.completedIds || [])];
                                // Hindari double-count
                                if (completedIds.includes(data.blog_id)) return j;
                                completedIds.push(data.blog_id);

                                const newSaved = data.success ? j.saved + 1 : j.saved;
                                const allDone = completedIds.length >= j.totalTarget;

                                // Refresh list tiap satu blog selesai
                                window.dispatchEvent(new Event("blogs_refresh"));

                                return {
                                    ...j,
                                    saved: newSaved,
                                    completedIds,
                                    done: allDone,
                                    failed: allDone && newSaved === 0,
                                };
                            } else {
                                // Single regenerate
                                if (j.blogId !== data.blog_id) return j;
                                window.dispatchEvent(new Event("blogs_refresh"));
                                if (data.success) {
                                    window.dispatchEvent(new CustomEvent("show_toast", {
                                        detail: { message: "Aibys selesai memperbaiki blog!", type: "success" }
                                    }));
                                }
                                return { ...j, done: true, saved: data.success ? 1 : 0, failed: !data.success };
                            }
                        });
                        localStorage.setItem("generate_jobs", JSON.stringify(updated));
                        return updated;
                    });
                }
            } catch (e) {
                console.error("SSE parse error:", e);
            }
        };

        sse.onerror = () => { sse.close(); sseRef.current = null; };
        return () => { sse.close(); sseRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs.map(j => j.id).join(",")]);

    const dismiss = (id: string) => {
        setJobs(prev => {
            const updated = prev.filter(j => j.id !== id);
            localStorage.setItem("generate_jobs", JSON.stringify(updated));
            return updated;
        });
    };

    const getElapsed = (startedAt: Date) => {
        const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        if (secs < 60) return `${secs}s`;
        return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    };

    if (jobs.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[320px] w-full">
            <AnimatePresence mode="popLayout">
                {jobs.map((job) => {
                    const isRegenerate = job.type === "regenerate";
                    const isBulkRegen = isRegenerate && Array.isArray(job.blogIds) && job.blogIds.length > 1;
                    const isDone = job.done;
                    const isFailed = job.failed;
                    const progress = job.totalTarget > 0 ? Math.round((job.saved / job.totalTarget) * 100) : 0;

                    const borderColor = isDone
                        ? isFailed ? "border-red-200 dark:border-red-800" : "border-emerald-200 dark:border-emerald-800"
                        : isRegenerate ? "border-blue-200 dark:border-blue-800" : "border-purple-200 dark:border-purple-800";

                    const iconBg = isDone
                        ? isFailed ? "bg-red-500/10" : "bg-emerald-500/10"
                        : isRegenerate ? "bg-blue-500/10" : "bg-purple-500/10";

                    const titleText = isDone
                        ? isFailed ? "Proses gagal"
                            : isBulkRegen ? `${job.saved}/${job.totalTarget} blog diperbaiki!`
                            : isRegenerate ? "Blog diperbaiki!" : "Selesai!"
                        : isBulkRegen ? "Aibys memperbaiki semua..."
                            : isRegenerate ? "Aibys memperbaiki..."
                            : "Aibys sedang menulis...";

                    const subtitleEl = () => {
                        if (isBulkRegen && !isDone) {
                            return (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
                                    {job.saved}/{job.totalTarget} selesai · {job.blogIds!.length} blog AI
                                </span>
                            );
                        }
                        if (isBulkRegen && isDone) {
                            return (
                                <span className={isFailed ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}>
                                    {isFailed ? "Tidak ada yang berhasil" : `${job.saved}/${job.totalTarget} blog diperbaiki ✓`}
                                </span>
                            );
                        }
                        if (isRegenerate) {
                            const t = job.blogTitle || "";
                            return <span>{isDone ? `"${t.slice(0, 32)}..." ✓` : `"${t.slice(0, 28)}..."`}</span>;
                        }
                        // Generate
                        if (!isDone) return (
                            <span className="text-purple-600 dark:text-purple-400 font-semibold font-mono">
                                {job.saved}/{job.totalTarget} blog
                            </span>
                        );
                        return (
                            <span className={isFailed ? "text-red-500" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
                                {isFailed ? "0" : job.saved}/{job.totalTarget} blog tersimpan
                            </span>
                        );
                    };

                    return (
                        <motion.div
                            key={job.id}
                            layout
                            initial={{ opacity: 0, y: 24, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.92 }}
                            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                            className={`bg-white dark:bg-gray-950 border ${borderColor} rounded-2xl shadow-lg overflow-hidden`}
                        >
                            <div className={`h-0.5 w-full ${
                                isDone
                                    ? isFailed ? "bg-red-500" : "bg-emerald-500"
                                    : isRegenerate ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-purple-500 to-blue-500"
                            }`} />

                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="relative shrink-0 mt-0.5">
                                        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                                            <AnimatePresence mode="wait">
                                                {isDone ? (
                                                    <motion.div key="done" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ type: "spring", bounce: 0.6 }}>
                                                        {isFailed ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                                    </motion.div>
                                                ) : (
                                                    <motion.div key="loading" animate={{ rotate: 360 }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                                                        {isRegenerate ? <Wand2 className="w-5 h-5 text-blue-500" /> : <Bot className="w-5 h-5 text-purple-500" />}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        {!isDone && (
                                            <motion.div
                                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${isRegenerate ? "bg-blue-500" : "bg-purple-500"} border-2 border-white dark:border-gray-950`}
                                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                                transition={{ duration: 1.2, repeat: Infinity }}
                                            />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{titleText}</p>
                                                <p className="text-xs mt-0.5 truncate text-gray-500 dark:text-gray-400">{subtitleEl()}</p>
                                            </div>
                                            <motion.button onClick={() => dismiss(job.id)}
                                                className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}>
                                                <X className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {!isDone ? (
                                                <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2.5">
                                                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                        {isRegenerate && !isBulkRegen ? (
                                                            // Shimmer untuk single regenerate (tidak bisa prediksi progress)
                                                            <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                                animate={{ x: ["-100%", "100%"] }}
                                                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                                                        ) : (
                                                            // Real progress bar untuk generate & bulk regenerate
                                                            <motion.div
                                                                className={`h-full rounded-full ${isRegenerate ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gradient-to-r from-purple-500 to-blue-500"}`}
                                                                initial={{ width: "5%" }}
                                                                animate={{ width: `${Math.max(5, progress)}%` }}
                                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                            />
                                                        )}
                                                    </div>
                                                    {job.currentTitle && (
                                                        <p className="text-xs text-gray-400 mt-1 truncate">✍️ {job.currentTitle}</p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            {getElapsed(job.startedAt)}
                                                        </span>
                                                        {(isBulkRegen || !isRegenerate) && (
                                                            <span className="text-xs text-gray-400">{progress}%</span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    className={`mt-2 flex items-center gap-1 text-xs ${isFailed ? "text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                                    {isFailed
                                                        ? <><AlertCircle className="w-3 h-3" /> Coba lagi nanti</>
                                                        : <><Sparkles className="w-3 h-3" /> {isRegenerate ? "Cek status blog" : "Review di halaman blog"}</>
                                                    }
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}