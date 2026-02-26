"use client";

import { useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ExternalLink, ArrowRight, Monitor, Smartphone, Globe, Terminal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Project } from "@/lib/types";

const PROJECTS_PER_PAGE = 5;

interface ProjectsClientProps {
    projects: Project[];
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div ref={ref} className={className}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

function PlatformIcon({ platform }: { platform: string }) {
    const p = platform?.toLowerCase();
    if (p?.includes("mobile") || p?.includes("android") || p?.includes("ios")) return <Smartphone className="w-3.5 h-3.5" />;
    if (p?.includes("web")) return <Globe className="w-3.5 h-3.5" />;
    if (p?.includes("desktop")) return <Monitor className="w-3.5 h-3.5" />;
    if (p?.includes("cli") || p?.includes("terminal")) return <Terminal className="w-3.5 h-3.5" />;
    return <Globe className="w-3.5 h-3.5" />;
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    const firstImage = [...(project.images || [])].sort((a, b) => a.order - b.order)[0]?.image_url;

    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
            <Link href={`/projects/${project.slug}`}
                className="group flex flex-col sm:flex-row gap-5 sm:gap-8 py-8 border-b border-border hover:border-foreground/20 transition-colors duration-200">

                {/* Thumbnail */}
                <div className="relative w-full sm:w-52 sm:shrink-0 rounded-xl overflow-hidden bg-muted"
                    style={{ aspectRatio: "16/10" }}>
                    {firstImage ? (
                        <Image src={firstImage} alt={project.title} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-black text-muted-foreground/20">{project.title[0]}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                    <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h2 className="text-xl font-bold text-foreground group-hover:text-foreground/70 transition-colors leading-tight">
                                {project.title}
                            </h2>
                            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-1 group-hover:text-foreground transition-all duration-200" />
                        </div>

                        {/* Description */}
                        {project.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {project.description}
                            </p>
                        )}
                    </div>

                    {/* Footer: platform + tech stacks + url */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {project.platform && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                                <PlatformIcon platform={project.platform} />
                                {project.platform}
                            </span>
                        )}
                        {project.tech_stacks?.slice(0, 3).map((t) => (
                            <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
                                {t.name}
                            </span>
                        ))}
                        {(project.tech_stacks?.length ?? 0) > 3 && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                +{project.tech_stacks.length - 3}
                            </span>
                        )}
                        {project.url && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                <ExternalLink className="w-3 h-3" /> Live
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function ProjectsClient({ projects }: ProjectsClientProps) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const sectionRef = useRef<HTMLElement>(null);

    const filtered = useMemo(() => {
        if (!query.trim()) return projects;
        const q = query.toLowerCase();
        return projects.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.platform?.toLowerCase().includes(q) ||
            p.tech_stacks?.some(t => t.name.toLowerCase().includes(q))
        );
    }, [projects, query]);

    const totalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * PROJECTS_PER_PAGE, page * PROJECTS_PER_PAGE);

    const goToPage = (p: number) => {
        setPage(p);
        setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };

    const handleSearch = (val: string) => {
        setQuery(val);
        setPage(1);
    };

    return (
        <div>
            {/* HERO */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 py-20 lg:py-28">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4 block">Work</span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">Projects</h1>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        A collection of things I've built — from side projects to production systems.
                    </p>
                </motion.div>
            </section>

            {/* SEARCH + LIST */}
            <section ref={sectionRef} className="max-w-6xl mx-auto px-8 sm:px-16 pb-24">
                {/* Search bar */}
                <FadeUp>
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Search projects, tech stack, platform..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                        />
                        {query && (
                            <button onClick={() => handleSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Clear
                            </button>
                        )}
                    </div>
                </FadeUp>

                {/* Result count */}
                {query && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""} for <span className="text-foreground font-medium">"{query}"</span>
                    </p>
                )}

                {/* List */}
                <div className="border-t border-border">
                    {paginated.length > 0 ? (
                        paginated.map((project, i) => (
                            <ProjectRow key={project.id} project={project} index={i} />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground py-16 text-center">
                            {query ? `No projects found for "${query}".` : "No projects yet."}
                        </p>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        <button
                            onClick={() => goToPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} onClick={() => goToPage(i + 1)}
                                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === i + 1 ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}>
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => goToPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}