import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "Portfolio";
    const description = searchParams.get("description") || "";
    const type = searchParams.get("type") || "page"; // blog | project | tool | page
    const siteName = searchParams.get("site") || "Portfolio";

    const typeLabel: Record<string, string> = {
        blog: "Blog Post",
        project: "Project",
        tool: "Tool",
        page: "",
    };

    const typeColor: Record<string, string> = {
        blog: "#3b82f6",
        project: "#8b5cf6",
        tool: "#10b981",
        page: "#6b7280",
    };

    const color = typeColor[type] || "#6b7280";
    const label = typeLabel[type] || "";

    return new ImageResponse(
        (
            <div
                style={{
                    width: "1200px",
                    height: "630px",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#09090b",
                    padding: "80px",
                    position: "relative",
                    fontFamily: "sans-serif",
                }}
            >
                {/* Grid background */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />

                {/* Gradient glow */}
                <div
                    style={{
                        position: "absolute",
                        top: "-100px",
                        left: "-100px",
                        width: "500px",
                        height: "500px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                    }}
                />

                {/* Content */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 1 }}>

                    {/* Top: site name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "auto" }}>
                        <div style={{
                            width: "10px", height: "10px", borderRadius: "50%",
                            backgroundColor: color,
                            boxShadow: `0 0 12px ${color}`,
                        }} />
                        <span style={{ color: "#71717a", fontSize: "18px", fontWeight: 500 }}>{siteName}</span>
                    </div>

                    {/* Badge */}
                    {label && (
                        <div style={{
                            display: "flex",
                            alignSelf: "flex-start",
                            backgroundColor: `${color}22`,
                            border: `1px solid ${color}44`,
                            borderRadius: "6px",
                            padding: "6px 14px",
                            marginBottom: "24px",
                        }}>
                            <span style={{ color: color, fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                {label}
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <div style={{
                        fontSize: title.length > 50 ? "42px" : "56px",
                        fontWeight: 800,
                        color: "#fafafa",
                        lineHeight: 1.15,
                        marginBottom: "20px",
                        maxWidth: "900px",
                        letterSpacing: "-0.02em",
                    }}>
                        {title}
                    </div>

                    {/* Description */}
                    {description && (
                        <div style={{
                            fontSize: "22px",
                            color: "#71717a",
                            lineHeight: 1.5,
                            maxWidth: "800px",
                            overflow: "hidden",
                            display: "-webkit-box",
                        }}>
                            {description.length > 120 ? description.slice(0, 120) + "..." : description}
                        </div>
                    )}

                    {/* Bottom border line */}
                    <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: `linear-gradient(90deg, ${color}, transparent)`,
                        borderRadius: "2px",
                    }} />
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}