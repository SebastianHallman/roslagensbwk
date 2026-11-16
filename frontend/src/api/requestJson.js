export async function requestJson(url, { data, validationCode, ...options } = {}) {
    const response = await fetch(url, {
        ...options,
        ...(data === undefined ? {} : {
            headers: { ...options.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    });
    if (!response.ok) {
        const details = await response.json().catch(() => null);
        const message = validationCode && details?.code === validationCode && typeof details.error === 'string'
            ? details.error
            : `HTTP error! status: ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.code = details?.code;
        throw error;
    }
    return response.json();
}
