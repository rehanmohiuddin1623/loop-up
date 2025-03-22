export const generateRoomId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";

    function randomSegment(length: number) {
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }

    const part1 = randomSegment(3);
    const part2 = randomSegment(4);
    const part3 = randomSegment(3);

    return `${part1}-${part2}-${part3}`;
}

export const copyText = (textToCopy: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            resolve(true);
        } catch (err) {
            console.error("Failed to copy!", err);
            reject(err)
        }
    })
};

export function shareContent({ title, text, url }: { title: string; text: string; url: string }) {
    return new Promise(async (resolve, reject) => {
        if (navigator.share) {
            await navigator.share({
                title,
                text,
                url
            })
            resolve(true)
        } else {
            reject("Web Share API not supported on this browser.");
        }
    })
}

export function getAvatarInitial(name: string | null) {
    if (!name) return "-";
    return name.trim().charAt(0).toUpperCase();
}

export const getOrCreatePeerId = () => {
    return crypto.randomUUID();
}

export const getAPIURL = (path: string, queryParams?: Record<string, string>) => {
    const API_URL = new URL(`/loopup${path}`, `${import.meta.env.VITE_BACKEND_URL}`);
    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            API_URL.searchParams.append(key, String(value));
        });
    }
    return API_URL
};