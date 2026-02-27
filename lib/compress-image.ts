/**
 * Compress image sebelum upload
 * - Target max 700KB output
 * - Max 1920px width/height
 * - Support: jpg, jpeg, png, webp, gif, bmp, tiff, ico
 * - SVG & ICO: langsung return tanpa kompresi (vektor/icon)
 * - PNG transparan: tetap PNG
 * - Semua lainnya: compress ke JPEG
 */
export async function compressImage(file: File, maxSizeKB = 700, maxDimension = 1920): Promise<File> {
    const maxBytes = maxSizeKB * 1024;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    // SVG dan ICO: tidak perlu compress
    if (ext === "svg" || ext === "ico" || file.type === "image/svg+xml") {
        return file;
    }

    // Bukan image: return langsung
    if (!file.type.startsWith("image/") && !["jpg","jpeg","png","webp","gif","bmp","tiff","tif","ico"].includes(ext)) {
        return file;
    }

    // Sudah kecil, skip
    if (file.size <= maxBytes) {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Resize kalau terlalu besar
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }

            // Background putih untuk gambar dengan alpha (biar JPEG bagus)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Cek apakah PNG dengan transparansi
            const isPngWithAlpha = (file.type === "image/png" || ext === "png") && hasTransparency(ctx, width, height);

            if (isPngWithAlpha) {
                // Gambar transparan: tetap PNG
                const canvas2 = document.createElement("canvas");
                canvas2.width = width;
                canvas2.height = height;
                const ctx2 = canvas2.getContext("2d");
                if (!ctx2) { resolve(file); return; }
                ctx2.drawImage(img, 0, 0, width, height);
                canvas2.toBlob((blob) => {
                    if (!blob) { resolve(file); return; }
                    const compressed = new File([blob], file.name, { type: "image/png", lastModified: Date.now() });
                    resolve(compressed.size < file.size ? compressed : file);
                }, "image/png");
                return;
            }

            // JPEG dengan kualitas adaptif sampai target ukuran
            const outputType = "image/jpeg";
            const outputExt = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            let quality = 0.85;

            const tryCompress = () => {
                canvas.toBlob((blob) => {
                    if (!blob) { resolve(file); return; }

                    if (blob.size <= maxBytes || quality <= 0.4) {
                        const compressed = new File([blob], outputExt, { type: outputType, lastModified: Date.now() });
                        resolve(compressed.size < file.size ? compressed : file);
                    } else {
                        quality -= 0.1;
                        tryCompress();
                    }
                }, outputType, quality);
            };

            tryCompress();
        };

        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

// Cek apakah canvas punya pixel transparan (sample sebagian saja agar cepat)
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
    try {
        // Sample 100 pixel saja untuk performa
        const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 100)));
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                if (pixel[3] < 255) return true;
            }
        }
    } catch {
        return false;
    }
    return false;
}