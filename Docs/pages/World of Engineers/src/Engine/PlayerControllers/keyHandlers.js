export const keys = {};

export function setupKeys() {
    window.addEventListener("keydown", (e) => {
        keys[e.code] = true;
    })
    window.addEventListener("keyup", (e) => {
        keys[e.code] = false;
    })
};