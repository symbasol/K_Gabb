import { createGround } from "./ground/ground.js";
import { NoiseSettings } from "./ground/procedural/settings.js";

export function startEngine({ engine, scene, camera, light }) {

    // Initial terrain
    createGround(scene, 4);

    // Setup UI
    setupUIListeners(scene);

    // Resize handling
    window.addEventListener("resize", () => {
        engine.resize();
    });

    // Main loop
    engine.runRenderLoop(() => {
        const dt = engine.getDeltaTime() / 1000;

        update({ engine, scene, camera }, dt);

        scene.render();
    });
}

/* =========================================================
   UI
========================================================= */

function setupUIListeners(scene) {

    const wireframeCheckbox = document.getElementById("wireframe");

    const subSlider = document.getElementById("subdivisions");
    const subValueText = document.getElementById("subdivisionValue");

    /* -----------------------------
       TERRAIN REBUILD
    ----------------------------- */

    let rebuildTimeout;

    const rebuildGround = () => {

        clearTimeout(rebuildTimeout);

        // Debounce expensive rebuilds
        rebuildTimeout = setTimeout(() => {

            const oldGround = scene.getMeshByName("ground");

            // Preserve wireframe state
            let wasWireframe = false;

            if (oldGround) {
                wasWireframe =
                    oldGround.material?.wireframe ?? false;

                oldGround.dispose();
            }

            // Current subdivisions
            const subdivisions =
                Number(subSlider?.value ?? 4);

            // Recreate terrain
            const newGround =
                createGround(scene, subdivisions);

            // Restore wireframe
            if (newGround.material) {
                newGround.material.wireframe =
                    wasWireframe;
            }

        }, 75);
    };

    /* -----------------------------
       SUBDIVISIONS
    ----------------------------- */

    if (subSlider) {

        // Initialize label
        if (subValueText) {
            subValueText.textContent =
                subSlider.value;
        }

        subSlider.addEventListener("input", (event) => {

            const value = event.target.value;

            if (subValueText) {
                subValueText.textContent = value;
            }

            rebuildGround();
        });
    }

    /* -----------------------------
       WIREFRAME
    ----------------------------- */

    if (wireframeCheckbox) {

        wireframeCheckbox.addEventListener(
            "change",
            (event) => {

                const ground =
                    scene.getMeshByName("ground");

                if (ground?.material) {
                    ground.material.wireframe =
                        event.target.checked;
                }
            }
        );
    }

    /* -----------------------------
       NOISE SETTINGS
    ----------------------------- */

    bindSlider(scene, "octaves", "octaves", rebuildGround);
    bindSlider(scene, "persistence", "persistence", rebuildGround);
    bindSlider(scene, "lacunarity", "lacunarity", rebuildGround);
    bindSlider(scene, "scale", "scale", rebuildGround);
    bindSlider(scene, "height", "height", rebuildGround);
}

/* =========================================================
   FPS
========================================================= */

let fpsTimer = 0;

function update({ engine }, dt) {

    fpsTimer += dt;

    if (fpsTimer >= 0.5) {

        updateFPS(engine.getFps());

        fpsTimer = 0;
    }
}

function updateFPS(fps) {

    const fpsHud = document.getElementById("FPS");

    if (fpsHud) {
        fpsHud.textContent =
            `FPS: ${fps.toFixed(0)}`;
    }
}

/* =========================================================
   GENERIC SLIDER BINDING
========================================================= */

function bindSlider(
    scene,
    id,
    key,
    onChange
) {

    const slider =
        document.getElementById(id);

    const label =
        document.getElementById(id + "Value");

    if (!slider) return;

    // Initialize label
    if (label) {
        label.textContent = slider.value;
    }

    slider.addEventListener("input", () => {

        // Update procedural settings
        NoiseSettings[key] =
            Number(slider.value);

        // Update UI text
        if (label) {
            label.textContent =
                slider.value;
        }

        // Rebuild terrain
        if (onChange) {
            onChange();
        }
    });
}