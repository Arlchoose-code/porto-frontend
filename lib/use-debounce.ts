import { useState, useEffect } from "react";

/**
 * Debounce a value — menunda update sampai user berhenti mengetik
 * @param value nilai yang ingin di-debounce
 * @param delay delay dalam ms (default 400ms)
 */
export function useDebounce<T>(value: T, delay = 400): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}