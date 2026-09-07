// worldObjects.js

import { groundHeight, groundWidth } from "../engineInitializer.js";

export async function loadTree(scene) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "assets/models/Nature/glTF/",
        "CommonTree_1.gltf",
        scene
    );

    // STEP 1 — Find REAL geometry meshes
    const realMeshes = [];

    for (const m of result.meshes) {
        if (m.getTotalVertices() > 0) {
            realMeshes.push(m);
        }
    }

    // If still empty, try transformNodes (GLB primitives)
    if (realMeshes.length === 0) {
        for (const tn of result.transformNodes) {
            if (tn._geometry) {
                realMeshes.push(tn);
            }
        }
    }

    console.log("REAL GEOMETRY MESHES:", realMeshes);

    if (realMeshes.length === 0) {
        throw new Error("Your GLB contains no geometry. It is a transform-only model.");
    }

    // STEP 2 — Merge into one mesh
    const merged = BABYLON.Mesh.MergeMeshes(
        realMeshes,
        true,
        true,
        undefined,
        false,
        true
    );

    if (!merged) {
        throw new Error("Merge failed — GLB structure is unusual.");
    }

    merged.isVisible = true;
    merged.receiveShadows = true;

    // STEP 3 — Cleanup original nodes
    result.meshes.forEach(m => m.dispose());
    result.transformNodes.forEach(t => t.dispose());

    return merged;
}


// THIN INSTANCE FOREST
export function spawnTrees(baseTree, scene, count = 1000) {
    const matrixData = new Float32Array(count * 16);

    for (let i = 0; i < count; i++) {
        const x = Math.random() * groundWidth - groundWidth / 2;
        const z = Math.random() * groundHeight - groundHeight / 2;

        const s = 1;
        const r = Math.random() * Math.PI * 2;

        // 🌲 Visual (thin instance)
        const matrix = BABYLON.Matrix.Compose(
            new BABYLON.Vector3(s, s, s),
            BABYLON.Quaternion.FromEulerAngles(0, r, 0),
            new BABYLON.Vector3(x, 0, z)
        );

        matrix.copyToArray(matrixData, i * 16);

        // 🧱 Collider (ONE per tree)
        const collider = BABYLON.MeshBuilder.CreateCylinder("treeCollider", {
            height: 5,
            diameter: 2
        }, scene);

        collider.position = new BABYLON.Vector3(x, 2.5, z);
        collider.isVisible = false;
        collider.checkCollisions = true;
    }

    baseTree.thinInstanceSetBuffer("matrix", matrixData, 16);
}
