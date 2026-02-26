import axios from "axios";

const api = axios.create({
    baseURL: typeof window !== 'undefined' ? '/api' : process.env.API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = typeof window !== "undefined"
                ? localStorage.getItem("refresh_token")
                : null;

            if (!refreshToken) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(
                    `${typeof window !== "undefined" ? "/api" : process.env.API_URL}/refresh`,
                    { refresh_token: refreshToken }
                );

                const { token: newToken, refresh_token: newRefreshToken } = res.data.data;

                localStorage.setItem("token", newToken);
                localStorage.setItem("refresh_token", newRefreshToken);

                api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;