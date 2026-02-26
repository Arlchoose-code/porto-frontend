"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote, Code, Code2, Minus,
    Heading1, Heading2, Heading3,
    Highlighter, Link as LinkIcon, Undo, Redo,
    WrapText, ImagePlus, Loader2
} from "lucide-react";
import api from "@/lib/api";

const lowlight = createLowlight(common);

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const ToolbarButton = ({
    onClick, active, title, children, disabled
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
}) => (
    <motion.button
        type="button"
        onClick={onClick}
        title={title}
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.85 }}
        className={`p-1.5 rounded-md transition-all duration-150 ${
            disabled
                ? "opacity-30 cursor-not-allowed"
                : active
                    ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        }`}
    >
        {children}
    </motion.button>
);

const Divider = () => (
    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0" />
);

const SIZE_PRESETS = [
    { label: "Kecil (300px)", width: "300px" },
    { label: "Sedang (500px)", width: "500px" },
    { label: "Besar (700px)", width: "700px" },
    { label: "Penuh (100%)", width: "100%" },
];

export default function RichEditor({ value, onChange, placeholder }: Props) {
    const editorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [sizeDialog, setSizeDialog] = useState<{ src: string; alt: string } | null>(null);
    const [customWidth, setCustomWidth] = useState("");

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            Underline,
            Highlight.configure({ multicolor: false }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({ placeholder: placeholder || "Tulis konten di sini..." }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: "text-blue-500 underline cursor-pointer" }
            }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: { class: "not-prose" },
            }),
            Image.configure({
                HTMLAttributes: { class: "rounded-lg h-auto my-2" },
                inline: false,
            }),
            CharacterCount,
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[320px] px-4 py-3 text-gray-900 dark:text-gray-100",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value]);

    if (!editor) return null;

    const setLink = () => {
        const prev = editor.getAttributes("link").href;
        const url = window.prompt("Masukkan URL:", prev || "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        e.target.value = "";

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/upload?folder=blogs", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const imageUrl = res.data.data?.url;
            if (imageUrl) {
                const base = process.env.NEXT_PUBLIC_APP_URL || "";
                const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${base}${imageUrl}`;
                // Tampilkan dialog pilih ukuran
                setSizeDialog({ src: fullUrl, alt: file.name.replace(/\.[^/.]+$/, "") });
            }
        } catch {
            alert("Gagal upload gambar");
        } finally {
            setUploading(false);
        }
    };

    const insertImageWithSize = (width: string) => {
        if (!sizeDialog || !editor) return;
        editor.chain().focus().setImage({
            src: sizeDialog.src,
            alt: sizeDialog.alt,
            // @ts-ignore — passing style via title workaround; actual width via HTML attr
            width: width,
        }).run();

        // Set width langsung pada node yang baru diinsert via updateAttributes
        editor.chain().focus().updateAttributes("image", { width }).run();

        setSizeDialog(null);
        setCustomWidth("");
    };

    const toolbarGroups = [
        [
            <ToolbarButton key="undo" onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
                <Undo className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="redo" onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
                <Redo className="w-3.5 h-3.5" />
            </ToolbarButton>,
        ],
        [
            <ToolbarButton key="h1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
                <Heading1 className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="h2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
                <Heading2 className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="h3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
                <Heading3 className="w-3.5 h-3.5" />
            </ToolbarButton>,
        ],
        [
            <ToolbarButton key="bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
                <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="strike" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
                <Strikethrough className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
                <Highlighter className="w-3.5 h-3.5" />
            </ToolbarButton>,
        ],
        [
            <ToolbarButton key="left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
                <AlignLeft className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
                <AlignCenter className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
                <AlignRight className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
                <AlignJustify className="w-3.5 h-3.5" />
            </ToolbarButton>,
        ],
        [
            <ToolbarButton key="ul" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
                <List className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="ol" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
                <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
                <Quote className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
                <Code className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="codeblock" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
                <Code2 className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="hr" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                <Minus className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="br" onClick={() => editor.chain().focus().setHardBreak().run()} title="Line Break">
                <WrapText className="w-3.5 h-3.5" />
            </ToolbarButton>,
        ],
        [
            <ToolbarButton key="link" onClick={setLink} active={editor.isActive("link")} title="Insert Link">
                <LinkIcon className="w-3.5 h-3.5" />
            </ToolbarButton>,
            <ToolbarButton key="image" onClick={() => !uploading && imageInputRef.current?.click()} title="Insert Image" disabled={uploading}>
                {uploading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ImagePlus className="w-3.5 h-3.5" />
                }
            </ToolbarButton>,
        ],
    ];

    return (
        <div ref={editorRef} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {/* Toolbar */}
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm">
                {toolbarGroups.map((group, gi) => (
                    <div key={gi} className="flex items-center gap-0.5">
                        {gi > 0 && <Divider />}
                        {group.map((btn) => btn)}
                    </div>
                ))}
            </div>

            {/* Editor */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <EditorContent editor={editor} />
            </motion.div>

            {/* Word count */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                    {editor.storage.characterCount.words()} kata · {editor.storage.characterCount.characters()} karakter
                </span>
                <span className="text-xs text-gray-400">
                    {editor.isActive("codeBlock") ? "Code Block" :
                     editor.isActive("heading", { level: 1 }) ? "Heading 1" :
                     editor.isActive("heading", { level: 2 }) ? "Heading 2" :
                     editor.isActive("heading", { level: 3 }) ? "Heading 3" :
                     editor.isActive("blockquote") ? "Blockquote" :
                     "Paragraph"}
                </span>
            </div>

            {/* Image size dialog */}
            <AnimatePresence>
                {sizeDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSizeDialog(null)}
                        />
                        <motion.div
                            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-5 space-y-4"
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        >
                            <div className="flex items-center gap-2">
                                <ImagePlus className="w-4 h-4 text-blue-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pilih Ukuran Gambar</h3>
                            </div>

                            {/* Preview */}
                            <img src={sizeDialog.src} alt="preview" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />

                            {/* Preset sizes */}
                            <div className="grid grid-cols-2 gap-2">
                                {SIZE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.width}
                                        type="button"
                                        onClick={() => insertImageWithSize(preset.width)}
                                        className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom width */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customWidth}
                                    onChange={(e) => setCustomWidth(e.target.value)}
                                    placeholder="Custom: 400px / 60%"
                                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => customWidth.trim() && insertImageWithSize(customWidth.trim())}
                                    disabled={!customWidth.trim()}
                                    className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
                                >
                                    Insert
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSizeDialog(null)}
                                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}