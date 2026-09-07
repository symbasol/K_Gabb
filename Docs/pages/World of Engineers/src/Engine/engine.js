import { setupKeys, keys } from "./PlayerControllers/keyHandlers.js";
import { movePlayer } from "./PlayerControllers/playerMovement.js";
import { updateCamera } from "./camera.js";
import { updateInfiniteTerrain } from "./Scene/Ground/terrain.js";
import { updatePlayerPhysics } from "./PlayerControllers/playerPhysics.js"
import { shadowGen } from "./engineInitializer.js"

let resizeAttached = false;
let fpsTimer = 0;

export function startEngine({ engine, scene, player, camera }) {
    if (!resizeAttached) {
        window.addEventListener("resize", () => engine.resize());
        resizeAttached = true;
    }

    setupKeys();

    engine.runRenderLoop(() => {
        update(engine, scene, player, camera);
        scene.render();
    });
}

function update(engine, scene, player, camera) {
    if (!player) return;

    const dt = engine.getDeltaTime() / 1000;
    const fps = engine.getFps().toFixed();

    // Player root fallback
    const root = player.root ?? player;

    updateCamera(scene, player, camera, dt);
    movePlayer(player, keys, dt);
    updatePlayerPhysics(player, keys);
    updateInfiniteTerrain(scene, root, shadowGen);

    fpsTimer += dt;
    if (fpsTimer >= 5) {
        updateFPS(fps);
        fpsTimer = 0;
    }
}


function updateFPS(fps) {
    const hud = document.getElementById("FPS");
    hud.textContent = `FPS: ${fps}`;
    console.log(`fps: ${fps}`);
}
