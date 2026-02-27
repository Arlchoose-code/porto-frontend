"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { BlurImage } from "@/components/shared/blur-image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Linkedin, MapPin, Calendar, Briefcase, GraduationCap, BookOpen, ExternalLink, ChevronLeft, ChevronRight, X, FileDown } from "lucide-react";
import { Settings, Profile, Skill, Education, Experience, Course } from "@/lib/types";
import { useSettings } from "@/components/shared/settings-provider";

interface AboutClientProps {
    settings: Settings;
    profile: Profile | null;
    skills: Skill[];
    educations: Education[];
    experiences: Experience[];
    courses: Course[];
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

function SectionTitle({ label, title }: { label: string; title: string }) {
    return (
        <div className="mb-10">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2 block">{label}</span>
            <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        </div>
    );
}

const LEVEL_MAP: Record<string, { label: string; pct: number }> = {
    beginner:     { label: "Beginner",     pct: 25 },
    intermediate: { label: "Intermediate", pct: 55 },
    advanced:     { label: "Advanced",     pct: 80 },
    expert:       { label: "Expert",       pct: 100 },
};

const CATEGORY_LABEL: Record<string, string> = {
    language:  "Language",
    framework: "Framework",
    database:  "Database",
    tool:      "Tool",
    other:     "Other",
};

function formatMonthYear(dateStr: string | null | undefined) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatIssuedAt(dateStr: string | null | undefined) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Lightbox
function Lightbox({ images, startIdx, onClose }: { images: { image_url: string }[]; startIdx: number; onClose: () => void }) {
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
            <motion.img key={idx} src={images[idx].image_url} alt=""
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
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

// Experience image carousel with lightbox
function ImageCarousel({ images }: { images: { id: number; image_url: string; order: number }[] }) {
    const [idx, setIdx] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    if (!images || images.length === 0) return null;
    const sorted = [...images].sort((a, b) => a.order - b.order);

    return (
        <>
            <div className="relative rounded-lg overflow-hidden bg-muted mt-4" style={{ aspectRatio: "16/9" }}>
                {/* Image layer - z-index 0 */}
                <BlurImage src={sorted[idx].image_url} alt="" fill
                    className="object-fill cursor-zoom-in"
                    style={{ zIndex: 0 }}
                    onClick={() => setLightbox(true)} />
                {sorted.length > 1 && (
                    <>
                        {/* Nav buttons - z-index lebih tinggi dari image */}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + sorted.length) % sorted.length); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                            style={{ zIndex: 10 }}>
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % sorted.length); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                            style={{ zIndex: 10 }}>
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                        {/* Dot indicators */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" style={{ zIndex: 10 }}>
                            {sorted.map((_, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                                    className={`h-1.5 rounded-full transition-all duration-200 ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
                            ))}
                        </div>
                    </>
                )}
            </div>
            {lightbox && <Lightbox images={sorted} startIdx={idx} onClose={() => setLightbox(false)} />}
        </>
    );
}

// Course card like featured project
function CourseCard({ course, index }: { course: Course; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    const [touched, setTouched] = useState(false);
    const [lightbox, setLightbox] = useState(false);

    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
            <div
                className="group relative overflow-hidden rounded-md cursor-pointer"
                style={{ aspectRatio: "3/2.8" }}
                onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 1024 && !touched) {
                        setTouched(true); return;
                    }
                    setTouched(false);
                }}
            >
                {course.certificate_image ? (
                    <BlurImage src={course.certificate_image} alt={course.title} fill className="object-fill" />
                ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Light effect on hover */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${touched ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 50%, transparent 100%)" }} />

                {/* Default: title + issuer */}
                <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 transition-transform duration-300 z-10 ${touched ? "-translate-y-14" : "translate-y-0 group-hover:-translate-y-14"}`}>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-md">{course.title}</h3>
                    {course.issuer && <p className="text-xs text-white/80 mt-0.5 drop-shadow-md">{course.issuer}</p>}
                </div>

                {/* Hover: issued + credential + view cert */}
                <div className={`absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center gap-2 flex-wrap transition-transform duration-300 z-10 ${touched ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`}>
                    {course.issued_at && (
                        <div className="flex flex-col px-2.5 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10">
                            <span className="text-[11px] font-semibold text-foreground leading-none">{formatIssuedAt(course.issued_at)}</span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">Issued</span>
                        </div>
                    )}
                    {course.credential_url && (
                        <a href={course.credential_url} target="_blank" rel="noopener noreferrer"
                            className="relative z-20 flex flex-col items-center px-2.5 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10 hover:bg-white transition-colors"
                            onClick={e => e.stopPropagation()}>
                            <ExternalLink className="w-3.5 h-3.5 text-foreground" />
                            <span className="text-[9px] text-muted-foreground mt-0.5">Credential</span>
                        </a>
                    )}
                    {course.certificate_image && (
                        <button
                            className="relative z-20 flex flex-col items-center px-2.5 py-1.5 rounded-md bg-white/80 dark:bg-background/80 border border-black/10 hover:bg-white transition-colors"
                            onClick={e => { e.stopPropagation(); setLightbox(true); }}>
                            <BookOpen className="w-3.5 h-3.5 text-foreground" />
                            <span className="text-[9px] text-muted-foreground mt-0.5">View</span>
                        </button>
                    )}
                </div>
            </div>
            {lightbox && course.certificate_image && (
                <Lightbox images={[{ image_url: course.certificate_image }]} startIdx={0} onClose={() => setLightbox(false)} />
            )}
        </motion.div>
    );
}

const COURSES_PER_PAGE_DESKTOP = 6;
const COURSES_PER_PAGE_MOBILE = 2;

export default function AboutClient({ settings: settingsProp, profile, skills, educations, experiences, courses }: AboutClientProps) {
    const { settings: settingsCtx } = useSettings();
    const settings = Object.keys(settingsCtx).length > 0 ? settingsCtx : settingsProp;
    const [coursePage, setCoursePage] = useState(1);
    const [expPage, setExpPage] = useState(1);
    const EXP_PER_PAGE = 5;
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    const coursesPerPage = isMobile ? COURSES_PER_PAGE_MOBILE : COURSES_PER_PAGE_DESKTOP;
    const totalCoursePages = Math.ceil(courses.length / coursesPerPage);
    const paginatedCourses = courses.slice((coursePage - 1) * coursesPerPage, coursePage * coursesPerPage);
    const coursesSectionRef = useRef<HTMLElement>(null);

    const goToCoursePage = (page: number) => {
        setCoursePage(page);
        setTimeout(() => {
            coursesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };

    const sortedExperiences = [...experiences].sort((a, b) => {
        if (a.is_current && !b.is_current) return -1;
        if (!a.is_current && b.is_current) return 1;
        const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
        const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
        return bDate - aDate;
    });

    const expSectionRef = useRef<HTMLElement>(null);
    const totalExpPages = Math.ceil(sortedExperiences.length / EXP_PER_PAGE);
    const paginatedExperiences = sortedExperiences.slice((expPage - 1) * EXP_PER_PAGE, expPage * EXP_PER_PAGE);

    const goToExpPage = (page: number) => {
        setExpPage(page);
        setTimeout(() => {
            expSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };

    // Smart pagination: 1 2 ... 5 6 7 ... 10
    const getSmartPages = (current: number, total: number): (number | string)[] => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages: (number | string)[] = [];
        const showAround = 1;
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - showAround && i <= current + showAround)) {
                pages.push(i);
            } else if (i === current - showAround - 1 || i === current + showAround + 1) {
                pages.push("...");
            }
        }
        return pages;
    };

    const skillsByCategory = skills.reduce((acc, skill) => {
        const cat = skill.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);

    return (
        <div>
            {/* HERO BIO */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 py-20 lg:py-28">
                <div className="max-w-3xl">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4 block">About</span>
                        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
                            Call me <span className="italic">{profile?.name?.split(" ")[0] || "Arl"}</span>
                        </h1>
                        {profile?.location && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                                <MapPin className="w-3.5 h-3.5" /> {profile.location}
                            </div>
                        )}
                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">{profile?.bio || "No bio available."}</p>
                        <div className="flex flex-wrap gap-3">
                            {profile?.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity">
                                    <Linkedin className="w-4 h-4" /> Connect on LinkedIn
                                </a>
                            )}
                            {profile?.resume_url && (
                                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" download
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                                    <FileDown className="w-4 h-4" /> Download CV
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* EDUCATION */}
            {(settings.show_educations === undefined || settings.show_educations === null || settings.show_educations === "" || settings.show_educations === "true") && (
            <section className="bg-muted/40 dark:bg-muted/20">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <FadeUp><SectionTitle label="Background" title="Education" /></FadeUp>
                    <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />
                        <div className="flex flex-col gap-10">
                            {educations.map((edu, i) => (
                                <FadeUp key={edu.id} delay={i * 0.08}>
                                    <div className="sm:pl-16 relative">
                                        <div className="absolute left-0 top-1 w-10 h-10 rounded-full border-2 border-border bg-muted/40 hidden sm:flex items-center justify-center overflow-hidden">
                                            {edu.logo_url ? <Image src={edu.logo_url} alt={edu.school} width={32} height={32} className="object-contain" /> : <GraduationCap className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                        <div className="flex items-center gap-3 sm:hidden mb-3">
                                            <div className="w-10 h-10 rounded-full border-2 border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                                                {edu.logo_url ? <Image src={edu.logo_url} alt={edu.school} width={32} height={32} className="object-contain" /> : <GraduationCap className="w-4 h-4 text-muted-foreground" />}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">{edu.school}</h3>
                                                {(edu.degree || edu.field) && <p className="text-sm text-muted-foreground">{[edu.degree, edu.field].filter(Boolean).join(" · ")}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                                <Calendar className="w-3 h-3" />
                                                {edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : " – Present"}
                                            </div>
                                        </div>
                                        {edu.description && <p className="text-sm text-muted-foreground leading-relaxed">{edu.description}</p>}
                                    </div>
                                </FadeUp>
                            ))}
                            {educations.length === 0 && <p className="text-sm text-muted-foreground">No education listed yet.</p>}
                        </div>
                    </div>
                </div>
            </section>
            )}

            {(settings.show_experiences === undefined || settings.show_experiences === null || settings.show_experiences === "" || settings.show_experiences === "true") && (
            <section ref={expSectionRef} className="bg-background">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <FadeUp><SectionTitle label="Career" title="Work Experience" /></FadeUp>
                    <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />
                        <div className="flex flex-col gap-12">
                            {paginatedExperiences.map((exp, i) => (
                                <FadeUp key={exp.id} delay={i * 0.08}>
                                    <div className="sm:pl-16 relative">
                                        <div className="absolute left-0 top-1 w-10 h-10 rounded-full border-2 border-border bg-background hidden sm:flex items-center justify-center">
                                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-border bg-background sm:hidden flex items-center justify-center mb-3">
                                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">{exp.role}</h3>
                                                <p className="text-sm font-medium text-foreground/70">{exp.company}</p>
                                                {exp.location && <p className="text-xs text-muted-foreground mt-0.5">{exp.location}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                                <Calendar className="w-3 h-3" />
                                                {formatMonthYear(exp.start_date)} – {exp.is_current ? "Present" : formatMonthYear(exp.end_date)}
                                                {exp.is_current && (
                                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-medium">Current</span>
                                                )}
                                            </div>
                                        </div>
                                        {exp.description && <p className="text-sm text-muted-foreground leading-relaxed mt-2">{exp.description}</p>}
                                        {exp.images?.length > 0 && <ImageCarousel images={exp.images} />}
                                    </div>
                                </FadeUp>
                            ))}
                            {experiences.length === 0 && <p className="text-sm text-muted-foreground">No experience listed yet.</p>}
                        </div>
                    </div>
                    {totalExpPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                            <button
                                onClick={() => goToExpPage(Math.max(1, expPage - 1))}
                                disabled={expPage === 1}
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {getSmartPages(expPage, totalExpPages).map((p, i) => (
                                typeof p === "string"
                                    ? <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground">...</span>
                                    : <button key={p} onClick={() => goToExpPage(p)}
                                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${expPage === p ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}>
                                        {p}
                                    </button>
                            ))}
                            <button
                                onClick={() => goToExpPage(Math.min(totalExpPages, expPage + 1))}
                                disabled={expPage === totalExpPages}
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </section>
            )}

            {(settings.show_courses === undefined || settings.show_courses === null || settings.show_courses === "" || settings.show_courses === "true") && (
            <section ref={coursesSectionRef} className="bg-muted/40 dark:bg-muted/20">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <FadeUp>
                        <div className="flex items-end justify-between mb-10">
                            <SectionTitle label="Learning" title="Courses & Training" />
                            {totalCoursePages > 1 && (
                                <span className="text-xs text-muted-foreground mb-10">{coursePage} / {totalCoursePages}</span>
                            )}
                        </div>
                    </FadeUp>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedCourses.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)}
                        {courses.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No courses listed yet.</p>}
                    </div>
                    {totalCoursePages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                            <button
                                onClick={() => goToCoursePage(Math.max(1, coursePage - 1))}
                                disabled={coursePage === 1}
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalCoursePages }, (_, i) => i + 1).length > 0 && getSmartPages(coursePage, totalCoursePages).map((p, i) => (
                                typeof p === "string"
                                    ? <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground">...</span>
                                    : <button key={p} onClick={() => goToCoursePage(p)}
                                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${coursePage === p ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}>
                                        {p}
                                    </button>
                            ))}
                            <button
                                onClick={() => goToCoursePage(Math.min(totalCoursePages, coursePage + 1))}
                                disabled={coursePage === totalCoursePages}
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </section>
            )}

            {(settings.show_skills === undefined || settings.show_skills === null || settings.show_skills === "" || settings.show_skills === "true") && (
            <section className="bg-background">
                <div className="max-w-6xl mx-auto px-8 sm:px-16 py-20">
                    <FadeUp><SectionTitle label="Expertise" title="Skills & Tools" /></FadeUp>
                    <div className="flex flex-col gap-12">
                        {Object.entries(skillsByCategory).map(([cat, catSkills], catIdx) => (
                            <FadeUp key={cat} delay={catIdx * 0.05}>
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{CATEGORY_LABEL[cat] || cat}</span>
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground tabular-nums">{catSkills.length}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {catSkills.map((skill, i) => {
                                        const lvl = LEVEL_MAP[skill.level] || { label: skill.level, pct: 50 };
                                        const lvlStyle: Record<string, { badge: string; ring: string }> = {
                                            beginner:     { badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",       ring: "ring-sky-200 dark:ring-sky-800" },
                                            intermediate: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
                                            advanced:     { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
                                            expert:       { badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", ring: "ring-violet-200 dark:ring-violet-800" },
                                        };
                                        const style = lvlStyle[skill.level] || { badge: "bg-muted text-muted-foreground", ring: "ring-border" };
                                        return (
                                            <motion.div key={skill.id}
                                                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                                className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border bg-background hover:border-foreground/20 hover:shadow-md transition-all duration-200 cursor-default text-center">
                                                {/* Icon */}
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ring-2 ${style.ring} bg-muted/50`}>
                                                    {skill.icon_url
                                                        ? <Image src={skill.icon_url} alt={skill.name} width={36} height={36} className="object-contain" />
                                                        : <span className="text-xl font-bold text-muted-foreground">{skill.name[0]}</span>}
                                                </div>
                                                {/* Name */}
                                                <span className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{skill.name}</span>
                                                {/* Level badge */}
                                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>{lvl.label}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </FadeUp>
                        ))}
                        {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills listed yet.</p>}
                    </div>
                </div>
            </section>
            )}

            <div className="bg-background py-8" />
        </div>
    );
}