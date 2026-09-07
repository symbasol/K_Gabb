// terrain.js

import { Simplex2d } from "./procedural/simplex.js";
import {
    updateTreesForChunk,
    unloadTreesForChunk
} from "./treeSystem.js";
import { WORLD } from "../../worldConfig.js";

// ======================================================
// INFINITE PROCEDURAL TERRAIN
// ======================================================

const loadedChunks = new Map();
let sharedMaterial = null;

// ======================================================
// GLOBAL HEIGHT SAMPLING
// ======================================================

export function getHeightAtWorld(wx, wz) {
    return (
        Simplex2d(
            wx * WORLD.NOISE_SCALE,
            wz * WORLD.NOISE_SCALE
        ) * WORLD.HEIGHT_SCALE
    );
}

// ======================================================
// TERRAIN COLOR MATERIAL
// ======================================================

function getTerrainMaterial(scene) {

    if (sharedMaterial) {
        return sharedMaterial;
    }

    sharedMaterial =
        new BABYLON.StandardMaterial(
            "terrainMaterial",
            scene
        );

    // Use vertex colors.
    sharedMaterial.useVertexColors = true;

    // Don't tint the vertex colors.
    sharedMaterial.diffuseColor =
        new BABYLON.Color3(1, 1, 1);

    // No shiny/plastic appearance.
    sharedMaterial.specularColor =
        new BABYLON.Color3(0, 0, 0);

    sharedMaterial.backFaceCulling = false;

    sharedMaterial.wireframe = false;

    return sharedMaterial;
}

// ======================================================
// COLOR UTILITIES
// ======================================================

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {

    let t =
        (value - edge0) /
        (edge1 - edge0);

    t = Math.max(0, Math.min(1, t));

    return t * t * (3 - 2 * t);
}

function lerpColor(a, b, t) {

    return new BABYLON.Color3(
        lerp(a.r, b.r, t),
        lerp(a.g, b.g, t),
        lerp(a.b, b.b, t)
    );
}

// ======================================================
// PROCEDURAL GROUND COLOR
// ======================================================

function getTerrainColor(wx, wz, height) {

    // ==================================================
    // BASE COLORS
    // ==================================================

    const grass = new BABYLON.Color3(
        0.25,
        0.48,
        0.12
    );

    const grassLight = new BABYLON.Color3(
        0.34,
        0.58,
        0.16
    );

    const grassDark = new BABYLON.Color3(
        0.16,
        0.34,
        0.07
    );

    const soil = new BABYLON.Color3(
        0.30,
        0.20,
        0.11
    );

    const soilLight = new BABYLON.Color3(
        0.40,
        0.28,
        0.15
    );

    const sand = new BABYLON.Color3(
        0.76,
        0.67,
        0.43
    );

    const sandLight = new BABYLON.Color3(
        0.86,
        0.77,
        0.54
    );

    const rock = new BABYLON.Color3(
        0.38,
        0.36,
        0.31
    );

    // ==================================================
    // LARGE-SCALE PATCH NOISE
    //
    // Controls where different ground types appear.
    // ==================================================

    const patchNoise =
        Simplex2d(
            wx * 0.008,
            wz * 0.008
        );

    // ==================================================
    // MEDIUM-SCALE VARIATION
    //
    // Breaks up large patches.
    // ==================================================

    const detailNoise =
        Simplex2d(
            wx * 0.035,
            wz * 0.035
        );

    // ==================================================
    // SMALL-SCALE VARIATION
    //
    // Adds subtle color variation.
    // ==================================================

    const microNoise =
        Simplex2d(
            wx * 0.12,
            wz * 0.12
        );

    // ==================================================
    // NORMALIZE NOISE
    //
    // Assumes Simplex2d returns approximately -1..1.
    // ==================================================

    const patch =
        patchNoise * 0.5 + 0.5;

    const detail =
        detailNoise * 0.5 + 0.5;

    const micro =
        microNoise * 0.5 + 0.5;

    // ==================================================
    // START WITH GRASS
    // ==================================================

    let color;

    // Slight natural grass variation.
    const grassVariation =
        smoothstep(
            0.25,
            0.75,
            detail
        );

    color =
        lerpColor(
            grassDark,
            grassLight,
            grassVariation
        );

    // ==================================================
    // SAND PATCHES
    // ==================================================
    //
    // Large irregular sandy areas.
    //

    let sandAmount =
        smoothstep(
            0.70,
            0.86,
            patch
        );

    // Break sand patches apart slightly.
    sandAmount *=
        lerp(
            0.65,
            1.0,
            detail
        );

    // Sand is more common on flatter terrain.
    //
    // Estimate this from terrain height variation
    // using nearby height samples.
    //

    const d = 0.35;

    const hL =
        getHeightAtWorld(
            wx - d,
            wz
        );

    const hR =
        getHeightAtWorld(
            wx + d,
            wz
        );

    const hB =
        getHeightAtWorld(
            wx,
            wz - d
        );

    const hF =
        getHeightAtWorld(
            wx,
            wz + d
        );

    const slopeX =
        (hR - hL) / (2 * d);

    const slopeZ =
        (hF - hB) / (2 * d);

    const slope =
        Math.sqrt(
            slopeX * slopeX +
            slopeZ * slopeZ
        );

    // Sand prefers flatter areas.
    const flatness =
        1 -
        Math.min(
            slope * 2,
            1
        );

    sandAmount *=
        flatness;

    // Keep some sand in low areas.
    const lowlandSand =
        smoothstep(
            4,
            -3,
            height
        );

    sandAmount *=
        lerp(
            0.45,
            1.0,
            lowlandSand
        );

    // Add sand.
    color =
        lerpColor(
            color,
            sandLight,
            sandAmount * 0.75
        );

    // Slight sand variation.
    if (sandAmount > 0.05) {

        color =
            lerpColor(
                color,
                sand,
                micro * 0.25 * sandAmount
            );
    }

    // ==================================================
    // SOIL PATCHES
    // ==================================================

    // Offset noise so soil doesn't follow exactly
    // the same pattern as sand.
    const soilNoise =
        Simplex2d(
            wx * 0.014 + 100,
            wz * 0.014 + 100
        );

    const soilValue =
        soilNoise * 0.5 + 0.5;

    let soilAmount =
        smoothstep(
            0.67,
            0.82,
            soilValue
        );

    // More soil where there is already some variation.
    soilAmount *=
        lerp(
            0.55,
            1.0,
            detail
        );

    // Reduce soil on very steep terrain.
    soilAmount *=
        flatness;

    color =
        lerpColor(
            color,
            soil,
            soilAmount * 0.60
        );

    // Lighter exposed soil.
    if (soilAmount > 0.15) {

        color =
            lerpColor(
                color,
                soilLight,
                detail * soilAmount * 0.30
            );
    }

    // ==================================================
    // ROCK
    // ==================================================

    // Rock becomes more common at higher elevation.
    const highGround =
        smoothstep(
            7,
            12,
            height
        );

    // Also use noise so not every high area is rock.
    const rockNoise =
        Simplex2d(
            wx * 0.018 + 500,
            wz * 0.018 + 500
        );

    const rockValue =
        rockNoise * 0.5 + 0.5;

    let rockAmount =
        highGround *
        smoothstep(
            0.48,
            0.72,
            rockValue
        );

    color =
        lerpColor(
            color,
            rock,
            rockAmount
        );

    // ==================================================
    // MICRO COLOR VARIATION
    // ==================================================

    const variation =
        lerp(
            0.92,
            1.08,
            micro
        );

    color.r =
        Math.min(
            color.r * variation,
            1
        );

    color.g =
        Math.min(
            color.g * variation,
            1
        );

    color.b =
        Math.min(
            color.b * variation,
            1
        );

    return color;
}

// ======================================================
// CHUNK KEY
// ======================================================

function chunkKey(cx, cz) {
    return `${cx}_${cz}`;
}

// ======================================================
// CREATE TERRAIN CHUNK
// ======================================================

function createChunk(scene, cx, cz) {

    const mesh =
        BABYLON.MeshBuilder.CreateGround(
            `chunk_${cx}_${cz}`,
            {
                width:
                    WORLD.CHUNK_SIZE,

                height:
                    WORLD.CHUNK_SIZE,

                subdivisions:
                    WORLD.CHUNK_SUBDIVISIONS,

                updatable: true
            },
            scene
        );

    // ==================================================
    // MATERIAL
    // ==================================================

    mesh.material =
        getTerrainMaterial(scene);

    mesh.material.wireframe = false;

    mesh.checkCollisions = true;

    mesh.receiveShadows = true;

    // ==================================================
    // VERTICES
    // ==================================================

    const positions =
        mesh.getVerticesData(
            BABYLON.VertexBuffer.PositionKind
        );

    const grid =
        WORLD.CHUNK_SUBDIVISIONS;

    // RGBA vertex colors.
    const colors = [];

    // ==================================================
    // WORLD-SPACE TERRAIN GENERATION
    // ==================================================

    for (
        let z = 0;
        z <= grid;
        z++
    ) {

        for (
            let x = 0;
            x <= grid;
            x++
        ) {

            const i =
                (z * (grid + 1) + x) * 3;

            // ------------------------------------------
            // LOCAL POSITION
            // ------------------------------------------

            const localX =
                positions[i];

            const localZ =
                positions[i + 2];

            // ------------------------------------------
            // WORLD POSITION
            // ------------------------------------------

            const wx =
                cx * WORLD.CHUNK_SIZE +
                localX;

            const wz =
                cz * WORLD.CHUNK_SIZE +
                localZ;

            // ------------------------------------------
            // HEIGHT
            // ------------------------------------------

            const height =
                getHeightAtWorld(
                    wx,
                    wz
                );

            positions[i + 1] =
                height;

            // ------------------------------------------
            // TERRAIN COLOR
            // ------------------------------------------

            const color =
                getTerrainColor(
                    wx,
                    wz,
                    height
                );

            colors.push(
                color.r,
                color.g,
                color.b,
                1
            );
        }
    }

    // ==================================================
    // UPDATE HEIGHTS
    // ==================================================

    mesh.updateVerticesData(
        BABYLON.VertexBuffer.PositionKind,
        positions
    );

    // ==================================================
    // UPDATE COLORS
    // ==================================================

    mesh.setVerticesData(
        BABYLON.VertexBuffer.ColorKind,
        colors,
        true,
        4
    );

    // ==================================================
    // NORMALS
    // ==================================================

    const indices =
        mesh.getIndices();

    const normals = [];

    BABYLON.VertexData.ComputeNormals(
        positions,
        indices,
        normals
    );

    mesh.updateVerticesData(
        BABYLON.VertexBuffer.NormalKind,
        normals
    );

    // ==================================================
    // POSITION CHUNK
    // ==================================================

    mesh.position.x =
        cx * WORLD.CHUNK_SIZE;

    mesh.position.z =
        cz * WORLD.CHUNK_SIZE;

    return mesh;
}

// ======================================================
// UPDATE INFINITE TERRAIN
// ======================================================

export function updateInfiniteTerrain(
    scene,
    playerRoot,
    shadowGen
) {

    if (!playerRoot) {
        return;
    }

    // ==================================================
    // PLAYER POSITION
    // ==================================================

    const px =
        playerRoot.position.x;

    const pz =
        playerRoot.position.z;

    // ==================================================
    // CURRENT CHUNK
    // ==================================================

    const cx =
        Math.floor(
            px / WORLD.CHUNK_SIZE
        );

    const cz =
        Math.floor(
            pz / WORLD.CHUNK_SIZE
        );

    // ==================================================
    // LOAD CHUNKS
    // ==================================================

    for (
        let dz = -WORLD.RENDER_DISTANCE;
        dz <= WORLD.RENDER_DISTANCE;
        dz++
    ) {

        for (
            let dx = -WORLD.RENDER_DISTANCE;
            dx <= WORLD.RENDER_DISTANCE;
            dx++
        ) {

            const ccx =
                cx + dx;

            const ccz =
                cz + dz;

            const key =
                chunkKey(
                    ccx,
                    ccz
                );

            if (
                loadedChunks.has(key)
            ) {
                continue;
            }

            // ------------------------------------------
            // CREATE CHUNK
            // ------------------------------------------

            const mesh =
                createChunk(
                    scene,
                    ccx,
                    ccz
                );

            // ------------------------------------------
            // SHADOWS
            // ------------------------------------------

            /*
            if (shadowGen) {
                shadowGen.addShadowCaster(mesh);
            }
            */

            mesh.receiveShadows = true;

            // ------------------------------------------
            // STORE
            // ------------------------------------------

            loadedChunks.set(
                key,
                {
                    mesh,
                    cx: ccx,
                    cz: ccz
                }
            );

            // ------------------------------------------
            // TREES
            // ------------------------------------------

            updateTreesForChunk(
                scene,
                ccx,
                ccz
            );
        }
    }

    // ==================================================
    // UNLOAD CHUNKS
    // ==================================================

    for (
        const [key, data]
        of loadedChunks
    ) {

        const dx =
            data.cx - cx;

        const dz =
            data.cz - cz;

        const dist =
            Math.max(
                Math.abs(dx),
                Math.abs(dz)
            );

        if (
            dist >
            WORLD.RENDER_DISTANCE
        ) {

            // Remove trees.
            unloadTreesForChunk(
                data.cx,
                data.cz
            );

            // Remove terrain.
            data.mesh.dispose();

            // Remove chunk.
            loadedChunks.delete(key);
        }
    }
}
