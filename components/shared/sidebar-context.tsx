"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    setCollapsed: () => {},
    toggle: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const toggle = () => setCollapsed((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}