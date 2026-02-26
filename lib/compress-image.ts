/**
 * Compress image sebelum upload
 * - Max 1MB output
 * - Max 1920px width/height
 * - Pakai canvas untuk compress
 */
export async function compressImage(file: File, maxSizeMB = 1, maxDimension = 1920): Promise<File> {
    // Kalau bukan image atau sudah kecil, langsung return
    if (!file.type.startsWith("image/") || file.size <= maxSizeMB * 1024 * 1024) {
        return file;
    }

    return new Promise((resolve, reject) => {
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

            ctx.drawImage(img, 0, 0, width, height);

            // Compress dengan quality 0.85 untuk JPEG/WebP
            const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
            const quality = outputType === "image/png" ? 1 : 0.85;

            canvas.toBlob((blob) => {
                if (!blob) { resolve(file); return; }
                const compressed = new File([blob], file.name, { type: outputType, lastModified: Date.now() });
                // Kalau hasil compress malah lebih besar, return original
                resolve(compressed.size < file.size ? compressed : file);
            }, outputType, quality);
        };

        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}