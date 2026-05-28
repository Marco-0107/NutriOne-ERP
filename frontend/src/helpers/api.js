const rawApiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || '/api';

const normalizedApiBaseUrl = (() => {
    const trimmed = rawApiBaseUrl.replace(/\/$/, '');

    if (trimmed === '/api' || /\/api$/.test(trimmed)) {
        return trimmed;
    }

    return `${trimmed}/api`;
})();

export const apiBaseUrl = normalizedApiBaseUrl;

export const apiUrl = (path) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedApiBaseUrl}${normalizedPath}`;
};