"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";
import { Settings } from "@/lib/types";

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
    refresh: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: {},
    loading: true,
    refresh: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({});
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/settings");
            const data = res.data.data || {};
            setSettings(data);

            // Terapkan theme-color ke meta tag
            if (data.theme_color) {
                let meta = document.querySelector('meta[name="theme-color"]');
                if (!meta) {
                    meta = document.createElement("meta");
                    meta.setAttribute("name", "theme-color");
                    document.head.appendChild(meta);
                }
                meta.setAttribute("content", data.theme_color);
            }

            // Inject Google Analytics
            if (data.google_analytics && !document.getElementById("ga-script")) {
                const script1 = document.createElement("script");
                script1.id = "ga-script";
                script1.src = `https://www.googletagmanager.com/gtag/js?id=${data.google_analytics}`;
                script1.async = true;
                document.head.appendChild(script1);

                const script2 = document.createElement("script");
                script2.id = "ga-init";
                script2.innerHTML = `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${data.google_analytics}');
                `;
                document.head.appendChild(script2);
            }

            // Inject Facebook Pixel
            if (data.facebook_pixel && !document.getElementById("fb-pixel")) {
                const script = document.createElement("script");
                script.id = "fb-pixel";
                script.innerHTML = `
                    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${data.facebook_pixel}');
                    fbq('track', 'PageView');
                `;
                document.head.appendChild(script);
            }

            // Inject Hotjar
            if (data.hotjar_id && !document.getElementById("hotjar-script")) {
                const script = document.createElement("script");
                script.id = "hotjar-script";
                script.innerHTML = `
                    (function(h,o,t,j,a,r){
                        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                        h._hjSettings={hjid:${data.hotjar_id},hjsv:6};
                        a=o.getElementsByTagName('head')[0];
                        r=o.createElement('script');r.async=1;
                        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                        a.appendChild(r);
                    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                `;
                document.head.appendChild(script);
            }

        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);