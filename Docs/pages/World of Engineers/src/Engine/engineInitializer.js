import { Player } from "./player.js";
import { createShadowGenerator } from "./shadow.js";
import { loadTree, spawnTrees } from "./Scene/worldObjects.js";

export const groundWidth = 100;
export const groundHeight = 100;
export const groundSubdivisions = 256;
export let shadowGen;
export async function initEngine(canvas) {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;



const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    1.2,
    10,
    new BABYLON.Vector3(0, 1, 0),
    scene
);

camera.attachControl(canvas, true);

// Camera collision
camera.checkCollisions = true;
camera.collisionRadius = new BABYLON.Vector3(0.5, 0.75, 0.5);

// Don't let the camera go underground
camera.lowerBetaLimit = 0.4;
camera.upperBetaLimit = Math.PI / 2.1;

// Don't allow it to get too far away
camera.lowerRadiusLimit = 2;
camera.upperRadiusLimit = 15;

// Gravity isn't really needed for the camera itself
camera.applyGravity = false;


    const hemiLight = new BABYLON.HemisphericLight(
        "hemiLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );

    const sun = new BABYLON.DirectionalLight(
        "sun",
        new BABYLON.Vector3(-1, -2, -1), // direction the light shines
        scene
    );

    ({ shadowGen } = createShadowGenerator(scene, sun))
    shadowGen.getShadowMap().renderList = [];
    
    shadowGen.usePercentageCloserFiltering = true;

    const shadowMap = shadowGen.getShadowMap();
    shadowMap.size = 4096;

    sun.intensity = 0.9;

    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 3000;
    sun.position = new BABYLON.Vector3(200, 500, 200);
    shadowGen.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME;


    /*
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: groundWidth, height: groundHeight, subdivisions: groundSubdivisions },
        scene
    );

    ground.receiveShadows = true;
    ground.checkCollisions = true;

    const material = new BABYLON.StandardMaterial("mat", scene);

    material.wireframe = true;

    ground.material = material; */

    const player = new Player("hero", scene, shadowGen);
    await player.load("./assets/models/", "UAL1_Standard.glb");
/*
    const baseTree = await loadTree(scene);
    //baseTree.addLODLevel(20, null);
    spawnTrees(baseTree, scene, 100);
*/
    player.playState("idle");

    scene.activeCamera = camera;
    scene.camera = camera;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    scene.onBeforeRenderObservable.add(() => {
        if (!player.mesh) return;
        
        const p = player.mesh.position;

        sun.position.x = p.x + 200;
        sun.position.z = p.z + 200;
        sun.position.y = p.y + 3000;

        shadowGen.getShadowMap().renderListDirty = true;
    });

    return { engine, scene, player, camera };
}