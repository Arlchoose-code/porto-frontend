"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Floating particle type
type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
};

function GlitchText({ text }: { text: string }) {
    const [glitching, setGlitching] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlitching(true);
            setTimeout(() => setGlitching(false), 200);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative select-none">
            <span
                className={`text-[clamp(6rem,20vw,14rem)] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground transition-all duration-75 ${
                    glitching ? "opacity-0" : "opacity-100"
                }`}
                style={{
                    WebkitTextStroke: "2px currentColor",
                    WebkitTextFillColor: "transparent",
                }}
            >
                {text}
            </span>
            {/* Glitch layers */}
            {glitching && (
                <>
                    <span
                        className="absolute inset-0 text-[clamp(6rem,20vw,14rem)] font-black leading-none tracking-tighter text-blue-500/80"
                        style={{
                            transform: "translate(-3px, 1px)",
                            clipPath: "inset(30% 0 40% 0)",
                            WebkitTextStroke: "2px",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {text}
                    </span>
                    <span
                        className="absolute inset-0 text-[clamp(6rem,20vw,14rem)] font-black leading-none tracking-tighter text-red-500/80"
                        style={{
                            transform: "translate(3px, -1px)",
                            clipPath: "inset(60% 0 10% 0)",
                            WebkitTextStroke: "2px",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {text}
                    </span>
                </>
            )}
        </div>
    );
}

function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -999, y: -999 });
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Init particles
        particlesRef.current = Array.from({ length: 60 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
        }));

        const isDark = () => document.documentElement.classList.contains("dark");

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const dark = isDark();
            const baseColor = dark ? "255,255,255" : "0,0,0";

            particlesRef.current.forEach((p, i) => {
                // Mouse repulsion
                const dx = p.x - mouseRef.current.x;
                const dy = p.y - mouseRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    p.vx += (dx / dist) * 0.3;
                    p.vy += (dy / dist) * 0.3;
                }

                // Speed limit
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 2) {
                    p.vx = (p.vx / speed) * 2;
                    p.vy = (p.vy / speed) * 2;
                }
                // Friction
                p.vx *= 0.99;
                p.vy *= 0.99;

                p.x += p.vx;
                p.y += p.vy;

                // Wrap
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${baseColor},${p.opacity})`;
                ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p2 = particlesRef.current[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if (d2 < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${baseColor},${0.08 * (1 - d2 / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animRef.current = requestAnimationFrame(draw);
        };

        draw();

        const onMouse = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", onMouse);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouse);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
        />
    );
}

const MESSAGES = [
    "Halaman yang lo cari kayaknya kabur duluan...",
    "Sepertinya halaman ini lagi libur panjang.",
    "404: Halaman ini lebih hilang dari kunci gua.",
    "Lo nyasar bro. Ini bukan Jalan Tol.",
    "Halaman ini exist di alam parallel, bukan di sini.",
];

export default function NotFound() {
    const router = useRouter();
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        setMsgIndex(Math.floor(Math.random() * MESSAGES.length));
    }, []);
    const [countdown, setCountdown] = useState(10);
    const [hovered, setHovered] = useState(false);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    // Countdown auto redirect
    useEffect(() => {
        if (hovered) return;
        if (countdown <= 0) {
            router.push("/");
            return;
        }
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown, hovered, router]);

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const id = Date.now();
        setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 600);
    };

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center overflow-hidden px-4">
            <ParticleCanvas />

            {/* Decorative blobs */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full gap-6">
                {/* Glitch 404 */}
                <div className="relative">
                    <GlitchText text="404" />
                    {/* Reflection */}
                    <div
                        className="absolute top-full left-0 right-0 overflow-hidden h-16 pointer-events-none"
                        style={{
                            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)",
                            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)",
                            transform: "scaleY(-1)",
                        }}
                    >
                        <span
                            className="text-[clamp(6rem,20vw,14rem)] font-black leading-none tracking-tighter"
                            style={{
                                WebkitTextStroke: "2px currentColor",
                                WebkitTextFillColor: "transparent",
                                color: "var(--foreground)",
                            }}
                        >
                            404
                        </span>
                    </div>
                </div>

                {/* Message */}
                <div className="mt-8 space-y-2">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        Halaman Tidak Ditemukan
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {MESSAGES[msgIndex]}
                    </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-mono">✦</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                    {/* Primary button */}
                    <button
                        onClick={(e) => {
                            handleRipple(e);
                            router.push("/");
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        className="relative overflow-hidden group flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md w-full sm:w-auto justify-center cursor-pointer"
                    >
                        {ripples.map((r) => (
                            <span
                                key={r.id}
                                className="absolute rounded-full bg-white/20 animate-ping pointer-events-none"
                                style={{
                                    left: r.x - 20,
                                    top: r.y - 20,
                                    width: 40,
                                    height: 40,
                                    animationDuration: "0.6s",
                                }}
                            />
                        ))}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Kembali ke Home
                    </button>

                    {/* Back button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-muted w-full sm:w-auto justify-center cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Halaman Sebelumnya
                    </button>
                </div>

                {/* Auto redirect countdown */}
                <div
                    className={`text-xs text-muted-foreground font-mono flex items-center gap-2 transition-opacity duration-300 ${
                        hovered ? "opacity-0" : "opacity-100"
                    }`}
                >
                    <span>Redirect otomatis dalam</span>
                    {/* Circular timer */}
                    <span className="relative inline-flex items-center justify-center w-8 h-8">
                        <svg className="absolute inset-0 -rotate-90" width="32" height="32">
                            <circle
                                cx="16"
                                cy="16"
                                r="12"
                                fill="none"
                                stroke="currentColor"
                                strokeOpacity="0.15"
                                strokeWidth="2"
                            />
                            <circle
                                cx="16"
                                cy="16"
                                r="12"
                                fill="none"
                                stroke="currentColor"
                                strokeOpacity="0.6"
                                strokeWidth="2"
                                strokeDasharray={`${2 * Math.PI * 12}`}
                                strokeDashoffset={`${2 * Math.PI * 12 * (1 - countdown / 10)}`}
                                className="transition-all duration-1000"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="text-[10px] font-bold">{countdown}</span>
                    </span>
                    <span>detik</span>
                </div>
            </div>

            {/* Bottom label */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10">
                <span className="text-xs text-muted-foreground/50 font-mono tracking-widest uppercase">
                    Error 404 · Page Not Found
                </span>
            </div>
        </div>
    );
}