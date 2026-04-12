const BASE_URL = 'http://192.168.0.58:8000';

export async function apiFetch(
    endpoint: string,
    token: string | null,
    options: RequestInit = {}
) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}