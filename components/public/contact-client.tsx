"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Phone, Github, Linkedin, Twitter, Instagram, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Profile } from "@/lib/types";

interface ContactClientProps {
    profile: Profile | null;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div ref={ref} className={className}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
}

export default function ContactClient({ profile }: ContactClientProps) {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error" | "ratelimit">("idle");
    const [cooldown, setCooldown] = useState(0);

    // Init cooldown dari localStorage saat mount
    useEffect(() => {
        const lastSent = localStorage.getItem("contact_last_sent");
        if (lastSent) {
            const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
            const remaining = 60 - elapsed;
            if (remaining > 0) {
                setCooldown(remaining);
                startCountdown(remaining);
            }
        }
    }, []);

    const startCountdown = (seconds: number) => {
        setCooldown(seconds);
        const interval = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const startCooldown = () => {
        localStorage.setItem("contact_last_sent", String(Date.now()));
        startCountdown(60);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();

        // Basic validation
        const newErrors: Record<string, string> = {};
        if (!form.name) newErrors.name = "Name is required";
        else if (form.name.length < 2) newErrors.name = "Name too short (min 2 chars)";
        else if (form.name.length > 100) newErrors.name = "Name too long (max 100 chars)";
        if (!form.email) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email address";
        else if (form.email.length > 100) newErrors.email = "Email too long (max 100 chars)";
        if (!form.subject) newErrors.subject = "Subject is required";
        else if (form.subject.length < 3) newErrors.subject = "Subject too short (min 3 chars)";
        else if (form.subject.length > 150) newErrors.subject = "Subject too long (max 150 chars)";
        if (!form.message) newErrors.message = "Message is required";
        else if (form.message.length < 10) newErrors.message = "Message too short (min 10 chars)";
        else if (form.message.length > 5000) newErrors.message = "Message too long (max 5000 chars)";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setStatus("idle");

        try {
            const res = await fetch(`${"/api"}/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const json = await res.json();

            if (res.ok) {
                setStatus("success");
                setForm({ name: "", email: "", subject: "", message: "" });
                startCooldown();
            } else if (res.status === 429) {
                setStatus("ratelimit");
            } else {
                if (json.errors) {
                    setErrors(json.errors);
                } else {
                    setStatus("error");
                }
            }
        } catch {
            setStatus("error");
        }

        setLoading(false);
    };

    const socials = [
        { icon: Github, label: "GitHub", value: profile?.github, href: profile?.github },
        { icon: Linkedin, label: "LinkedIn", value: profile?.linkedin, href: profile?.linkedin },
        { icon: Twitter, label: "Twitter", value: profile?.twitter, href: profile?.twitter },
        { icon: Instagram, label: "Instagram", value: profile?.instagram, href: profile?.instagram },
    ].filter(s => s.value);

    return (
        <div className="overflow-x-hidden w-full">
            {/* HERO */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 py-20 lg:py-28">
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4 block">Get in touch</span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">Contact</h1>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        Have something to say? I&apos;d love to hear from you.
                    </p>
                </motion.div>
            </section>

            {/* CONTENT */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">

                    {/* LEFT — info */}
                    <FadeUp className="lg:col-span-2 flex flex-col gap-8">
                        {/* Contact info */}
                        <div className="flex flex-col gap-4">
                            {profile?.email && (
                                <a href={`mailto:${profile.email}`}
                                    className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/30 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="truncate">{profile.email}</span>
                                </a>
                            )}
                            {profile?.phone && (
                                <a href={`tel:${profile.phone}`}
                                    className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/30 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span>{profile.phone}</span>
                                </a>
                            )}
                            {profile?.location && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span>{profile.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Socials */}
                        {socials.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Elsewhere</span>
                                <div className="flex flex-col gap-2">
                                    {socials.map(({ icon: Icon, label, href }) => (
                                        <a key={label} href={href!} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/30 transition-colors">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span>{label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </FadeUp>

                    {/* RIGHT — form */}
                    <FadeUp delay={0.1} className="lg:col-span-3">
                        <div className="flex flex-col gap-5">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Name <span className="text-foreground">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                        errors.name ? "border-red-400 focus:ring-red-400/20" : "border-border focus:ring-foreground/20"
                                    }`}
                                />
                                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Email <span className="text-foreground">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                        errors.email ? "border-red-400 focus:ring-red-400/20" : "border-border focus:ring-foreground/20"
                                    }`}
                                />
                                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                            </div>

                            {/* Subject */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Subject <span className="text-foreground">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="What's this about?"
                                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                        errors.subject ? "border-red-400 focus:ring-red-400/20" : "border-border focus:ring-foreground/20"
                                    }`}
                                />
                                {errors.subject && <p className="text-xs text-red-400">{errors.subject}</p>}
                            </div>

                            {/* Message */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Message <span className="text-foreground">*</span>
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Tell me what's on your mind..."
                                    rows={6}
                                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all resize-none ${
                                        errors.message ? "border-red-400 focus:ring-red-400/20" : "border-border focus:ring-foreground/20"
                                    }`}
                                />
                                {errors.message && <p className="text-xs text-red-400">{errors.message}</p>}
                            </div>

                            {/* Submit */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || cooldown > 0}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                        : cooldown > 0
                                        ? <><CheckCircle className="w-4 h-4" /> Wait {cooldown}s</>
                                        : <><Send className="w-4 h-4" /> Send message</>
                                    }
                                </button>

                                {status === "success" && (
                                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1.5 text-sm text-green-500">
                                        <CheckCircle className="w-4 h-4" /> Message sent!
                                    </motion.div>
                                )}
                                {status === "error" && (
                                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1.5 text-sm text-red-400">
                                        <AlertCircle className="w-4 h-4" /> Something went wrong.
                                    </motion.div>
                                )}
                                {status === "ratelimit" && (
                                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1.5 text-sm text-yellow-500">
                                        <AlertCircle className="w-4 h-4" /> Too many messages, please wait.
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </FadeUp>
                </div>
            </section>
        </div>
    );
}