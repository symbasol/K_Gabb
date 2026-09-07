export function createAnimator(animGroups = []) {
    let currentAnim = null;
    let rafId = null;

    const animMap = new Map();

    function normalize(str) {
        return (str || "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/\|/g, "");
    }

    for (const anim of animGroups) {
        animMap.set(normalize(anim.name), anim);
    }

    function findAnimation(name) {
        const key = normalize(name);

        return (
            animMap.get(key) ||
            [...animMap.entries()]
                .sort((a, b) => a[0].length - b[0].length)
                .find(([k]) => k.includes(key))?.[1]
        );
    }

    function stopFade() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function play(name, loop = true) {
        if (!animGroups.length) return;

        const next = findAnimation(name);

        if (!next) {
            console.warn(`[Animator] Animation not found: ${name}`);
            console.log("Available:", animGroups.map(a => a.name));
            return;
        }

        if (currentAnim && normalize(currentAnim.name) === normalize(next.name)) {
            return;
        }

        stopFade();

        // First animation (no blend needed)
        if (!currentAnim) {
            next.play(loop);
            next.setWeightForAllAnimatables(1);
            currentAnim = next;
            return;
        }

        const prev = currentAnim;

        next.play(loop);
        next.setWeightForAllAnimatables(0);

        let weight = 0;
        const fadeDuration = 0.05;

        let lastTime = performance.now();

        function fade() {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            weight += dt / fadeDuration;
            if (weight > 1) weight = 1;

            next.setWeightForAllAnimatables(weight);

            if (prev) {
                prev.setWeightForAllAnimatables(1 - weight);
            }

            if (weight < 1) {
                rafId = requestAnimationFrame(fade);
            } else {
                if (prev) {
                    prev.setWeightForAllAnimatables(0);
                    prev.stop();
                }

                currentAnim = next;
                rafId = null;
            }
        }

        rafId = requestAnimationFrame(fade);
    }

    function getCurrentName() {
        return currentAnim?.name || "";
    }

    function list() {
        return animGroups.map(a => a.name);
    }

    function dispose() {
        stopFade();
        currentAnim = null;
        animMap.clear();
    }

    return {
        play,
        getCurrentName,
        list,
        dispose
    };
}