"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BlurImage } from "@/components/shared/blur-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ArrowLeft, ChevronLeft, ChevronRight, X, Monitor, Smartphone, Globe, Terminal } from "lucide-react";
import { Project } from "@/lib/types";
import ShareButton from "@/components/public/share-button";

interface ProjectDetailClientProps {
    project: Project;
}

function Lightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
    const [idx, setIdx] = useState(startIdx);
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") setIdx(i => (i - 1 + images.length) % images.length);
            if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [images.length, onClose]);

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}>
            <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10" onClick={onClose}>
                <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{idx + 1} / {images.length}</div>
            <motion.img key={idx} src={images[idx]} alt=""
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()} />
            {images.length > 1 && (
                <>
                    <button className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}>
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}>
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
                        ))}
                    </div>
                </>
            )}
        </motion.div>
    );
}

function PlatformIcon({ platform }: { platform: string }) {
    const p = platform?.toLowerCase();
    if (p?.includes("mobile") || p?.includes("android") || p?.includes("ios")) return <Smartphone className="w-4 h-4" />;
    if (p?.includes("web")) return <Globe className="w-4 h-4" />;
    if (p?.includes("desktop")) return <Monitor className="w-4 h-4" />;
    if (p?.includes("cli") || p?.includes("terminal")) return <Terminal className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const sortedImages = [...(project.images || [])].sort((a, b) => a.order - b.order);
    const imageUrls = sortedImages.map(i => i.image_url);
    const [mainIdx, setMainIdx] = useState(0);

    return (
        <div>
            <div className="max-w-6xl mx-auto px-8 sm:px-16 py-12 lg:py-20">
                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                    <Link href="/projects"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        All Projects
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* LEFT: images */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                        {sortedImages.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {/* Main image */}
                                <div className="relative rounded-2xl overflow-hidden bg-muted cursor-zoom-in"
                                    style={{ aspectRatio: "16/10" }}
                                    onClick={() => setLightboxIdx(mainIdx)}>
                                    <BlurImage src={sortedImages[mainIdx].image_url} alt={project.title} fill
                                        className="object-cover" priority />
                                    {/* Counter badge */}
                                    {sortedImages.length > 1 && (
                                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                                            {mainIdx + 1} / {sortedImages.length}
                                        </div>
                                    )}
                                    {sortedImages.length > 1 && (
                                        <>
                                            <button onClick={e => { e.stopPropagation(); setMainIdx(i => (i - 1 + sortedImages.length) % sortedImages.length); }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
                                                <ChevronLeft className="w-4 h-4 text-white" />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); setMainIdx(i => (i + 1) % sortedImages.length); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
                                                <ChevronRight className="w-4 h-4 text-white" />
                                            </button>
                                            {/* Dot indicators */}
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {sortedImages.map((_, i) => (
                                                    <button key={i} onClick={e => { e.stopPropagation(); setMainIdx(i); }}
                                                        className={`h-1.5 rounded-full transition-all duration-200 ${i === mainIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {/* Thumbnails strip — scrollable, show all */}
                                {sortedImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                        {sortedImages.map((img, i) => (
                                            <button key={img.id} onClick={() => setMainIdx(i)}
                                                className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${mainIdx === i ? "border-foreground opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}>
                                                <BlurImage src={img.image_url} alt="" fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-muted flex items-center justify-center" style={{ aspectRatio: "16/10" }}>
                                <span className="text-6xl font-black text-muted-foreground/20">{project.title[0]}</span>
                            </div>
                        )}
                    </motion.div>

                    {/* RIGHT: detail */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-6">

                        {/* Title */}
                        <div>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3 block">Project</span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">{project.title}</h1>
                        </div>

                        {/* Description */}
                        {project.description && (
                            <p className="text-base text-muted-foreground leading-relaxed">{project.description}</p>
                        )}

                        {/* Meta */}
                        <div className="flex flex-col gap-4 py-6 border-y border-border">
                            {project.platform && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Platform</span>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <PlatformIcon platform={project.platform} />
                                        {project.platform}
                                    </span>
                                </div>
                            )}
                            {project.tech_stacks && project.tech_stacks.length > 0 && (
                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium shrink-0 mt-1">Tech Stack</span>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        {project.tech_stacks.map(t => (
                                            <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
                                                {t.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA + Share */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {project.url && (
                                <a href={project.url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity">
                                    <ExternalLink className="w-4 h-4" /> Visit Project
                                </a>
                            )}
                            <ShareButton title={project.title} description={project.description} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIdx !== null && (
                    <Lightbox images={imageUrls} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}