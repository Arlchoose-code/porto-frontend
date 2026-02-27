"use client";

/**
 * BlurImage - Lazy load image dengan blur placeholder
 * 
 * Cara kerja:
 * 1. Generate tiny thumbnail (20x20px) dari URL asli via canvas (client side) — TIDAK hit server!
 * 2. Tampilkan blur placeholder dulu (CSS blur dari tiny image)
 * 3. Saat image asli loaded, fade in dengan smooth transition
 * 
 * Untuk gambar eksternal / URL tidak bisa di-canvas → pakai CSS blur sederhana saja.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Image, { ImageProps } from "next/image";

interface BlurImageProps extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
    /** Ratio aspek container, e.g. "16/9", "1/1", "3/2" */
    aspectRatio?: string;
    containerClassName?: string;
    /** Override blur data URL (optional, auto-generate kalau tidak diisi) */
    blurDataURL?: string;
}

// Cache blur URLs agar tidak re-generate
const blurCache = new Map<string, string>();

// Generate tiny blur placeholder dari URL (10x10 canvas)
function generateBlurPlaceholder(src: string): Promise<string> {
    if (blurCache.has(src)) {
        return Promise.resolve(blurCache.get(src)!);
    }

    return new Promise((resolve) => {
        // Fallback blur (solid semi-transparent)
        const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23e2e8f0'/%3E%3C/svg%3E";

        // Hanya bisa generate untuk URL yang sama-origin atau CORS
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";

        const timeout = setTimeout(() => {
            resolve(fallback);
        }, 3000);

        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement("canvas");
                canvas.width = 20;
                canvas.height = 20;
                const ctx = canvas.getContext("2d");
                if (!ctx) { resolve(fallback); return; }
                ctx.drawImage(img, 0, 0, 20, 20);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
                blurCache.set(src, dataUrl);
                resolve(dataUrl);
            } catch {
                resolve(fallback);
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            resolve(fallback);
        };

        img.src = src;
    });
}

export function BlurImage({
    src,
    alt,
    fill,
    width,
    height,
    aspectRatio,
    containerClassName = "",
    className = "",
    blurDataURL: blurDataURLProp,
    priority,
    ...props
}: BlurImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [blurUrl, setBlurUrl] = useState<string>(
        blurDataURLProp || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23e2e8f0'/%3E%3C/svg%3E"
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const [inViewport, setInViewport] = useState(priority ?? false);

    // Intersection Observer untuk lazy loading
    useEffect(() => {
        if (priority) {
            setInViewport(true);
            return;
        }

        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setInViewport(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" } // Pre-load 200px sebelum masuk viewport
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [priority]);

    // Generate blur placeholder saat masuk viewport
    const generateBlur = useCallback(async () => {
        if (blurDataURLProp || !src || typeof src !== "string") return;
        const blur = await generateBlurPlaceholder(src as string);
        setBlurUrl(blur);
    }, [src, blurDataURLProp]);

    useEffect(() => {
        if (inViewport) {
            generateBlur();
        }
    }, [inViewport, generateBlur]);

    const containerStyle = aspectRatio
        ? { position: "relative" as const, aspectRatio }
        : fill
        ? { position: "relative" as const, width: "100%", height: "100%" }
        : {};

    const imageContent = inViewport ? (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            priority={priority}
            className={`transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"} ${className}`}
            onLoad={() => setIsLoaded(true)}
            {...props}
        />
    ) : null;

    // Blur placeholder selalu tampil sampai image loaded
    const placeholder = !isLoaded ? (
        <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
                backgroundImage: `url(${blurUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(8px)",
                transform: "scale(1.05)", // Avoid blur edge artifacts
            }}
        />
    ) : null;

    if (fill || aspectRatio) {
        return (
            <div
                ref={containerRef}
                className={`overflow-hidden ${containerClassName}`}
                style={containerStyle}
            >
                {placeholder}
                {imageContent}
            </div>
        );
    }

    // Width/height mode
    return (
        <div
            ref={containerRef}
            className={`relative inline-block overflow-hidden ${containerClassName}`}
            style={{ width, height }}
        >
            {placeholder}
            {imageContent}
        </div>
    );
}

export default BlurImage;