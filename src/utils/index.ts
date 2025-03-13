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