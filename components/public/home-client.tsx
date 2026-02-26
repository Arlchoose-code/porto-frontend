"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink, Mail, MapPin, BookOpen, Bookmark as BookmarkIcon } from "lucide-react";
import { Settings, Profile, Project, Skill, Experience, Blog, Bookmark } from "@/lib/types";
import { useSettings } from "@/components/shared/settings-provider";

interface HomeClientProps {
    settings: Settings;
    profile: Profile | null;
    featuredProjects: Project[];
    skills: Skill[];
    experiences: Experience[];
    blogs: Blog[];
    bookmarks: Bookmark[];
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

function ProjectCard({ project, index }: { project: Project; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    const [touched, setTouched] = useState(false);
    const firstImage = project.images?.[0]?.image_url;

    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="px-2"
        >
            <div
                className="group relative overflow-hidden rounded-md cursor-pointer"
                style={{ aspectRatio: "3/2.8" }}
                onClick={() => {
                    if (window.innerWidth < 1024 && !touched) { setTouched(true); return; }
                    setTouched(false);
                }}
            >
                {/* Link ke slug */}
                <Link
                    href={`/projects/${project.slug}`}
                    className="absolute inset-0 z-10"
                    aria-label={project.title}
                    onClick={(e) => { if (window.innerWidth < 1024 && !touched) e.preventDefault(); }}
                />

                {/* Gambar full cover */}
                {firstImage ? (
                    <Image src={firstImage} alt={project.title} fill loading="lazy" className="object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <span className="text-6xl font-bold text-muted-foreground/20">{project.title.charAt(0)}</span>
                    </div>
                )}

                {/* Gradient bawah subtle */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Light effect — full card, lebih terang */}
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ease-out ${touched ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                    }}
                />

                {/* Blur layer — static, selalu di bottom, ga bergerak */}
                <div className="absolute bottom-0 left-0 right-0 h-56 z-10 pointer-events-none"
                    style={{
                        background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.45) 100%)",
                    }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-56 z-10 pointer-events-none backdrop-blur-sm group-hover:backdrop-blur-xl transition-all duration-300"
                    style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 50%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 50%)" }} />

                {/* Title + desc — naik saat hover */}
                <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 z-10 transition-transform duration-300 ease-out ${touched ? "-translate-y-14" : "translate-y-0 group-hover:-translate-y-14"}`}>
                    <h3 className="text-xl font-extrabold leading-snug line-clamp-1 text-foreground">{project.title}</h3>
                    {project.description && (
                        <p className="text-sm font-semibold mt-1 line-clamp-2 leading-relaxed text-foreground/50">{project.description}</p>
                    )}
                </div>

                {/* Platform + tech + visit — slide up dari bawah */}
                <div className={`absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center gap-1.5 z-10 transition-transform duration-300 ease-out ${touched ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`}>
                    {project.platform && (
                        <div className="flex flex-col px-2 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10 min-w-0 max-w-[28%]">
                            <span className="text-xs font-bold text-foreground leading-none truncate">{project.platform}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 whitespace-nowrap">Platform</span>
                        </div>
                    )}
                    {project.tech_stacks?.slice(0, 2).map((t) => (
                        <div key={t.id} className="flex flex-col px-2 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10 min-w-0 max-w-[26%]">
                            <span className="text-xs font-bold text-foreground leading-none truncate">{t.name}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 whitespace-nowrap">Tech stack</span>
                        </div>
                    ))}
                    {(project.tech_stacks?.length ?? 0) > 2 && (
                        <div className="flex flex-col items-center px-2 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10 shrink-0">
                            <span className="text-xs font-bold text-foreground leading-none">+{project.tech_stacks.length - 2}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 whitespace-nowrap">more</span>
                        </div>
                    )}
                    {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer"
                            className="flex flex-col items-center px-2 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10 hover:bg-white transition-colors shrink-0"
                            onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="w-3 h-3 text-foreground" />
                            <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 whitespace-nowrap">Visit</span>
                        </a>
                    )}
                </div>

            </div>
        </motion.div>
    );
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function AutoSlider({ items, renderItem, direction = "right" }: {
    items: any[];
    renderItem: (item: any) => React.ReactNode;
    direction?: "left" | "right";
}) {
    const [paused, setPaused] = useState(false);
    const CARD_W = 240;
    const GAP = 16;
    const STEP = CARD_W + GAP;

    if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;

    const doubled = [...items, ...items];
    const oneSetW = items.length * STEP;
    const duration = items.length * 3;

    const keyframes = direction === "right"
        ? `@keyframes marquee-right { from { transform: translateX(0); } to { transform: translateX(-${oneSetW}px); } }`
        : `@keyframes marquee-left { from { transform: translateX(-${oneSetW}px); } to { transform: translateX(0); } }`;

    const animName = direction === "right" ? "marquee-right" : "marquee-left";

    return (
        <div
            className="overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <style>{keyframes}</style>
            <div
                className="flex will-change-transform"
                style={{
                    gap: GAP,
                    animation: `${animName} ${duration}s linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                }}
            >
                {doubled.map((item, i) => (
                    <div key={i} className="shrink-0" style={{ width: CARD_W }}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function HomeClient({ settings: settingsProp, profile, featuredProjects, skills, experiences, blogs, bookmarks }: HomeClientProps) {
    const { settings: settingsCtx } = useSettings();
    const settings = Object.keys(settingsCtx).length > 0 ? settingsCtx : settingsProp;

    return (
        <div>
            {/* ── HERO ── */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 min-h-[82vh] flex items-center py-16">
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div className="flex flex-col gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                            {profile?.location && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                                    <MapPin className="w-3.5 h-3.5" /><span>{profile.location}</span>
                                </div>
                            )}
                            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
                                {profile?.name || settings.site_title || "Portfolio"}
                            </h1>
                            {profile?.tagline && <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{profile.tagline}</p>}
                            {settings.site_description && <p className="mt-2 text-base text-muted-foreground/70 leading-relaxed">{settings.site_description}</p>}
                        </motion.div>
                        <motion.div className="flex items-center gap-3 flex-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity">
                                <Mail className="w-4 h-4" /> Get in touch
                            </Link>
                            <Link href="/projects" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                                View projects <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                    <motion.div className="flex justify-center lg:justify-end" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
                        <div className="relative">
                            <motion.div className="absolute rounded-full border-2 border-dashed border-border" style={{ inset: "-16px" }} animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
                            <motion.div className="absolute rounded-full border border-border/40" style={{ inset: "-36px" }} animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} />
                            {profile?.avatar ? (
                                <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden ring-4 ring-border">
                                    <Image src={profile.avatar} alt={profile.name || "Avatar"} fill className="object-cover" priority />
                                </div>
                            ) : (
                                <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-muted ring-4 ring-border flex items-center justify-center">
                                    <span className="text-6xl font-bold text-muted-foreground/30">{(profile?.name || "P").charAt(0)}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── BIO ── abu */}
            <section className="bg-muted/40 dark:bg-muted/20">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <FadeUp>
                        <div className="max-w-2xl">
                            <p className="text-xl sm:text-2xl text-foreground leading-relaxed font-light">{profile?.bio || "No bio yet."}</p>
                            <Link href="/about" className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full border border-foreground text-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-all duration-200">
                                About me <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </FadeUp>
                </div>
            </section>

            {/* ── FEATURED PROJECTS ── putih, center title */}
            {(settings.show_projects === undefined || settings.show_projects === null || settings.show_projects === "" || settings.show_projects === "true") && (
            <section className="bg-background py-24">
                <div className="max-w-6xl mx-auto px-8 sm:px-16">
                    <FadeUp className="text-center mb-12">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2 block">Work</span>
                        <h2 className="text-3xl font-bold text-foreground">Featured projects</h2>
                    </FadeUp>
                    {featuredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {featuredProjects.map((project, i) => (
                                <ProjectCard key={project.id} project={project} index={i} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground text-sm">No projects yet.</p>
                    )}
                    <FadeUp className="text-center mt-10">
                        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                            More projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </FadeUp>
                </div>
            </section>
            )}

            {/* ── BLOG: slider kiri (geser kanan→kiri), judul kanan ── */}
            {(settings.show_blog === undefined || settings.show_blog === null || settings.show_blog === "" || settings.show_blog === "true") && (
            <section className="bg-muted/40 dark:bg-muted/20 overflow-hidden">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Kiri: conveyor belt blog */}
                        <FadeUp className="overflow-hidden">
                            <AutoSlider
                                items={blogs}
                                direction="right"
                                renderItem={(blog: Blog) => (
                                    <Link href={`/blog/${blog.slug}`} className="group block">
                                        <div className="relative aspect-video rounded-md overflow-hidden bg-muted mb-3">
                                            {blog.cover_image ? (
                                                <Image src={blog.cover_image} alt={blog.title} fill loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <BookOpen className="w-8 h-8 text-muted-foreground/20" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground group-hover:opacity-70 transition-opacity line-clamp-2 leading-snug mb-1">{blog.title}</h3>
                                        {blog.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{blog.description}</p>}
                                    </Link>
                                )}
                            />
                        </FadeUp>

                        {/* Kanan: judul */}
                        <FadeUp delay={0.1}>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3 block">Writing</span>
                            <h2 className="text-3xl font-bold text-foreground mb-4">Blog & thoughts</h2>
                            <p className="text-muted-foreground leading-relaxed mb-8">
                                Articles about web development, engineering, and things I find interesting along the way.
                            </p>
                            <Link href="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity">
                                Read the blog <ArrowRight className="w-4 h-4" />
                            </Link>
                        </FadeUp>
                    </div>
                </div>
            </section>
            )}

            {/* ── BOOKMARK: judul kiri, slider kanan (geser kiri→kanan) ── */}
            {(settings.show_bookmarks === undefined || settings.show_bookmarks === null || settings.show_bookmarks === "" || settings.show_bookmarks === "true") && (
            <section className="bg-background overflow-hidden">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Kiri: judul */}
                        <FadeUp>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3 block">Collection</span>
                            <h2 className="text-3xl font-bold text-foreground mb-4">Curated bookmarks</h2>
                            <p className="text-muted-foreground leading-relaxed mb-8">
                                Resources, articles, and tools I've saved — things worth revisiting and sharing with others.
                            </p>
                            <Link href="/bookmarks" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground text-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-all duration-200">
                                Browse bookmarks <ArrowRight className="w-4 h-4" />
                            </Link>
                        </FadeUp>

                        {/* Kanan: conveyor belt bookmark */}
                        <FadeUp delay={0.1} className="overflow-hidden">
                            <AutoSlider
                                items={bookmarks}
                                direction="left"
                                renderItem={(bookmark: Bookmark) => (
                                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="group block">
                                        <div className="rounded-md border border-border bg-background p-4 hover:border-foreground/30 transition-colors flex flex-col gap-2" style={{ width: 240, height: 200 }}>
                                            {/* Header: GitHub icon + title */}
                                            <div className="flex items-start gap-2">
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 mt-0.5 text-foreground fill-current">
                                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                                                </svg>
                                                <h3 className="text-sm font-bold text-foreground group-hover:opacity-70 transition-opacity line-clamp-2 leading-snug flex-1">{bookmark.title || bookmark.url}</h3>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs leading-relaxed line-clamp-2 flex-1 text-muted-foreground">
                                                {bookmark.description || <span className="italic opacity-40">No description</span>}
                                            </p>

                                            {/* Topics mini marquee — arah berlawanan dari slider utama */}
                                            {bookmark.topics?.length > 0 ? (
                                                <div className="overflow-hidden -mx-4 px-4">
                                                    {(() => {
                                                        const topicItems = [...bookmark.topics, ...bookmark.topics];
                                                        const oneW = bookmark.topics.reduce((acc, t) => acc + t.name.length * 7 + 20, 0);
                                                        const dur = Math.max(6, bookmark.topics.length * 1.2);
                                                        const kf = `@keyframes t-left-${bookmark.id} { from { transform: translateX(0); } to { transform: translateX(-${oneW}px); } }`;
                                                        return (
                                                            <>
                                                                <style>{kf}</style>
                                                                <div
                                                                    className="flex gap-1.5 will-change-transform"
                                                                    style={{ animation: `t-left-${bookmark.id} ${dur}s linear infinite` }}
                                                                >
                                                                    {topicItems.map((t, i) => (
                                                                        <span key={i} className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{t.name}</span>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] italic text-muted-foreground/40">No topics</p>
                                            )}
                                        </div>
                                    </a>
                                )}
                            />
                        </FadeUp>
                    </div>
                </div>
            </section>
            )}

            {/* Spacer putih sebelum footer */}
            <div className="bg-background py-8" />
        </div>
    );
}