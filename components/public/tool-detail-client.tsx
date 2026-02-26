"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Wrench, Copy, Check, Loader2, RefreshCw, Eye, EyeOff, BookOpen, Info } from "lucide-react";
import { Tool } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FieldSchema {
    key: string;
    label: string;
    type: "text" | "textarea" | "url" | "number" | "range" | "checkbox" | "select";
    placeholder?: string;
    default?: any;
    min?: number;
    max?: number;
    options?: string[];
    required?: boolean;
}

interface DocStep {
    title: string;
    desc: string;
}

interface ToolDocs {
    description?: string;
    steps?: DocStep[];
    notes?: string[];
    examples?: string[];
}

interface ToolDetailClientProps {
    tool: Tool;
    inputSchema: FieldSchema[];
    docs?: ToolDocs | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
            {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
    );
}

function ResultBox({ label, value }: { label?: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
            {label && <p className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground mb-2">{label}</p>}
            <div className="flex items-start justify-between gap-3">
                <pre className="text-sm font-mono text-foreground break-all whitespace-pre-wrap flex-1">{value}</pre>
                <CopyButton text={value} />
            </div>
        </div>
    );
}

const base = "/api";

async function runTool(slug: string, input: Record<string, any>) {
    const res = await fetch(`${base}/tools/${slug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Tool failed");
    return json.data;
}

// ─── Build initial values dari schema ──────────────────────────────────────

function buildInitialValues(schema: FieldSchema[]): Record<string, any> {
    const values: Record<string, any> = {};
    for (const field of schema) {
        if (field.default !== undefined) {
            values[field.key] = field.default;
        } else if (field.type === "checkbox") {
            values[field.key] = false;
        } else if (field.type === "number" || field.type === "range") {
            values[field.key] = field.min ?? 0;
        } else {
            values[field.key] = "";
        }
    }
    return values;
}

// ─── Render hasil output secara dinamis ────────────────────────────────────
// Menampilkan semua key dari result secara otomatis

function DynamicResult({ result }: { result: Record<string, any> }) {
    // Key khusus yang tampil sebagai stat box (angka)
    const statKeys = ["words", "characters", "characters_no_space", "lines"];
    const statFields = Object.entries(result).filter(([k]) => statKeys.includes(k));
    const otherFields = Object.entries(result).filter(([k]) => !statKeys.includes(k) && k !== "input");

    return (
        <div className="flex flex-col gap-3">
            {/* Stat boxes untuk word counter dll */}
            {statFields.length > 0 && (
                <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${Math.min(statFields.length, 4)}`}>
                    {statFields.map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-border bg-muted/40 p-4 text-center">
                            <div className="text-2xl font-bold text-foreground">{String(value)}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status HTTP */}
            {result.status !== undefined && (
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        result.status >= 200 && result.status < 300
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-500"
                    }`}>
                        {result.status}
                    </span>
                </div>
            )}

            {/* Other fields */}
            {otherFields.map(([key, value]) => {
                const display = typeof value === "string" ? value : JSON.stringify(value, null, 2);
                const label = key === "result" ? "Result" : key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                return <ResultBox key={key} label={label} value={display} />;
            })}
        </div>
    );
}

// ─── Render satu field input secara dinamis ────────────────────────────────

function DynamicField({
    field,
    value,
    onChange,
}: {
    field: FieldSchema;
    value: any;
    onChange: (key: string, val: any) => void;
}) {
    const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all";

    if (field.type === "textarea") {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
                <textarea
                    value={value ?? ""}
                    onChange={e => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={5}
                    className={`${inputClass} resize-none font-mono`}
                />
            </div>
        );
    }

    if (field.type === "url" || field.type === "text" || field.type === "number") {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
                <input
                    type={field.type}
                    value={value ?? ""}
                    onChange={e => onChange(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                />
            </div>
        );
    }

    if (field.type === "range") {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
                    <span className="text-sm font-bold text-foreground">{value ?? field.default}</span>
                </div>
                <input
                    type="range"
                    min={field.min ?? 0}
                    max={field.max ?? 100}
                    value={value ?? field.default ?? 50}
                    onChange={e => onChange(field.key, Number(e.target.value))}
                    className="w-full accent-foreground"
                />
            </div>
        );
    }

    if (field.type === "checkbox") {
        return (
            <button
                type="button"
                onClick={() => onChange(field.key, !value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    value
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
            >
                {field.label}
            </button>
        );
    }

    if (field.type === "select") {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
                <select
                    value={value ?? field.default ?? ""}
                    onChange={e => onChange(field.key, e.target.value)}
                    className={inputClass}
                >
                    {field.options?.map(opt => (
                        <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                    ))}
                </select>
            </div>
        );
    }

    return null;
}

// ─── Dynamic Tool UI ────────────────────────────────────────────────────────
// Satu komponen yang bisa handle SEMUA tool tanpa switch-case.
// Mau nambah tool baru? Cukup definisikan input_schema di backend.

function DynamicToolUI({ tool, schema }: { tool: Tool; schema: FieldSchema[] }) {
    const [values, setValues] = useState<Record<string, any>>(buildInitialValues(schema));
    const [result, setResult] = useState<any>(null);
    const [history, setHistory] = useState<string[]>([]); // untuk UUID/password generator
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showValues, setShowValues] = useState(true); // untuk toggle show/hide password

    // Cek apakah tool ini "generator" (tidak butuh input wajib)
    const isGenerator = schema.length === 0 || !schema.some(f => f.required);
    // Cek apakah result berupa single repeatable value (UUID, password generator)
    const isRepeatable = isGenerator || tool.slug === "password-generator" || tool.slug === "uuid-generator";
    // Cek apakah ada password-like field
    const hasHideable = tool.slug === "password-generator";

    const handleChange = (key: string, val: any) => {
        setValues(prev => ({ ...prev, [key]: val }));
    };

    const run = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await runTool(tool.slug, values);
            if (isRepeatable && data.result !== undefined) {
                setHistory(prev => [data.result, ...prev].slice(0, 10));
            } else {
                setResult(data);
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    // Pisahkan checkbox fields ke group sendiri agar layout lebih rapi
    const checkboxFields = schema.filter(f => f.type === "checkbox");
    const otherFields = schema.filter(f => f.type !== "checkbox");
    const hasRequiredInput = schema.some(f => f.required);
    const isDisabled = loading || (hasRequiredInput && otherFields.some(f => f.required && !values[f.key]));

    const runLabel = isGenerator
        ? (tool.slug === "uuid-generator" ? "Generate UUID" : "Generate")
        : "Run";

    return (
        <div className="flex flex-col gap-4">
            {/* Non-checkbox fields */}
            {otherFields.map(field => (
                <DynamicField key={field.key} field={field} value={values[field.key]} onChange={handleChange} />
            ))}

            {/* Checkbox group (pills) */}
            {checkboxFields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {checkboxFields.map(field => (
                        <DynamicField key={field.key} field={field} value={values[field.key]} onChange={handleChange} />
                    ))}
                </div>
            )}

            {/* Run button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={run}
                    disabled={isDisabled}
                    className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {runLabel}
                </button>

                {/* Show/hide toggle untuk password */}
                {hasHideable && history.length > 0 && (
                    <button
                        onClick={() => setShowValues(v => !v)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showValues ? "Hide" : "Show"}
                    </button>
                )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* History list (UUID / password generator) */}
            {isRepeatable && history.length > 0 && (
                <div className="flex flex-col gap-2">
                    {history.map((val, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40">
                            <code className="text-sm font-mono text-foreground flex-1 truncate">
                                {hasHideable && !showValues ? "•".repeat(val.length) : val}
                            </code>
                            <CopyButton text={val} />
                        </div>
                    ))}
                </div>
            )}

            {/* Dynamic result untuk tool biasa */}
            {!isRepeatable && result && <DynamicResult result={result} />}
        </div>
    );
}


// ─── Docs Section ──────────────────────────────────────────────────────────

function DocsSection({ docs }: { docs: ToolDocs }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 space-y-6"
        >
            <div className="border-t border-border pt-8">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Cara Penggunaan
                </h2>

                {/* Description */}
                {docs.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        {docs.description}
                    </p>
                )}

                {/* Steps */}
                {docs.steps && docs.steps.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {docs.steps.map((step, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Notes */}
                {docs.notes && docs.notes.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/40 p-4 mb-4">
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" /> Catatan
                        </p>
                        <ul className="space-y-1">
                            {docs.notes.map((note, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                    <span className="text-foreground mt-0.5">·</span> {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Examples */}
                {docs.examples && docs.examples.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Contoh</p>
                        <div className="space-y-1.5">
                            {docs.examples.map((ex, i) => (
                                <div key={i} className="rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                                    {ex}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ToolDetailClient({ tool, inputSchema, docs }: ToolDetailClientProps) {
    return (
        <div className="overflow-x-hidden w-full">
            <section className="max-w-3xl mx-auto px-8 sm:px-16 py-16 lg:py-24">
                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }} className="mb-10">
                    <Link href="/tools"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> All tools
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                        {tool.icon ? (
                            <Image src={tool.icon} alt={tool.name} width={28} height={28} className="rounded-sm object-contain" />
                        ) : (
                            <Wrench className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        {tool.category && (
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 block">{tool.category}</span>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{tool.name}</h1>
                        {tool.description && (
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{tool.description}</p>
                        )}
                    </div>
                </motion.div>

                {/* Dynamic Tool UI — tidak perlu switch-case lagi! */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
                    <DynamicToolUI tool={tool} schema={inputSchema} />
                </motion.div>

                {/* Documentation */}
                {docs && <DocsSection docs={docs} />}
            </section>
        </div>
    );
}