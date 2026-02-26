import { Settings, Profile } from "@/lib/types";

interface PublicFooterProps {
    settings: Settings;
    profile: Profile | null;
}

const socialConfig: { key: keyof Profile; label: string }[] = [
    { key: "linkedin", label: "Linkedin" },
    { key: "github", label: "Github" },
    { key: "instagram", label: "Instagram" },
    { key: "twitter", label: "Twitter" },
];

export default function PublicFooter({ settings, profile }: PublicFooterProps) {
    const footerText = settings.footer_text || `© ${new Date().getFullYear()} Portfolio. All rights reserved.`;

    const socialLinks = socialConfig.map((s) => ({
        ...s,
        href: profile ? (profile[s.key] as string) || undefined : undefined,
    }));

    return (
        <footer className="transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-8 sm:px-16 py-12">
                {/* Satu baris, semua item gap sama rata */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">

                    {/* Kiri: dot + Keep in touch + Follow on + sosmed — semua gap-4 */}
                    <div className="flex items-center flex-wrap gap-4 justify-center sm:justify-start">
                        {/* Keep in touch */}
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                            <span className="text-base font-semibold text-foreground">Keep in touch</span>
                        </div>

                        {/* Follow on */}
                        <span className="text-base text-muted-foreground">Follow on</span>

                        {/* Sosmed — gap sama dengan item sebelumnya */}
                        {socialLinks.map((social) =>
                            social.href ? (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base text-foreground hover:text-muted-foreground transition-colors"
                                >
                                    {social.label}
                                </a>
                            ) : (
                                <span
                                    key={social.label}
                                    className="text-base text-muted-foreground/40 cursor-default"
                                >
                                    {social.label}
                                </span>
                            )
                        )}
                    </div>

                    {/* Kanan: Copyright */}
                    <p className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
                        {footerText}
                    </p>

                </div>
            </div>
        </footer>
    );
}