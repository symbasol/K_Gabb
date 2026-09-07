import { perlin2D } from "./perlin.js";
import { WORLD } from "../../worldConfig.js";

let baseTreeMesh = null;
const treeInstances = new Map();

function hash(x, z){
    return Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
}

function biomeAt(x, z){
    const n = perlin2D(x * WORLD.TREE_NOISE_SCALE, z * WORLD.TREE_NOISE_SCALE);

    if(n < -0.2) return "plains";
    if(n < 0.4) return "forest";
    return "mountain";
}

export async function loadBaseTree(scene){
    if(baseTreeMesh) return baseTreeMesh;

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "assets/models/Nature/glTF/",
        "CommonTree_1.gltf",
        scene
    );

    const meshes = result.meshes.filter(m => m.getTotalVertices?.() > 0);

    baseTreeMesh = BABYLON.Mesh.MergeMeshes(meshes, true, true);
    baseTreeMesh.isVisible = true;

    return baseTreeMesh;
}

export function updateTreesForChunk(scene, cx, cz){
    const key = `${cx}_${cz}`;
    if(treeInstances.has(key)) return;

    const matrices = [];
    const colliders = [];

    const CHUNK_SIZE = WORLD.CHUNK_SIZE;

    for(let i = 0; i < WORLD.MAX_TREES_PER_CHUNK; i++){

        const lx = Math.random() * CHUNK_SIZE;
        const lz = Math.random() * CHUNK_SIZE;

        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;

        const biome = biomeAt(wx, wz);
        const chance = WORLD.TREE_DENSITY[biome];

        if(hash(wx, wz) > chance) continue;

        const h = perlin2D(wx * WORLD.NOISE_SCALE, wz * WORLD.NOISE_SCALE) * WORLD.HEIGHT_SCALE;

        const scale = 1 + Math.random() * 0.3;
        const rot = Math.random() * Math.PI * 2;

        const mat = BABYLON.Matrix.Compose(
            new BABYLON.Vector3(scale, scale, scale),
            BABYLON.Quaternion.FromEulerAngles(0, rot, 0),
            new BABYLON.Vector3(wx, h, wz)
        );

        matrices.push(mat);
    }

    if(baseTreeMesh && matrices.length){
        const buffer = new Float32Array(matrices.length * 16);
        matrices.forEach((m,i)=>m.copyToArray(buffer, i*16));
        baseTreeMesh.thinInstanceSetBuffer("matrix", buffer, 16);
    }

    treeInstances.set(key, { colliders });
}

export function unloadTreesForChunk(cx, cz){
    const key = `${cx}_${cz}`;
    treeInstances.delete(key);
}