// ground.js
import { Simplex2d } from "./procedural/simplex.js";

export function createGround(scene, subdivisions = 4) {

    function createGroundMesh({
        name,
        width,
        height,
        subdivisions,
        updatable
    }) {

        return BABYLON.MeshBuilder.CreateGround(
            name,
            {
                width,
                height,
                subdivisions,
                updatable
            },
            scene
        );
    }

    const ground = createGroundMesh({
        name: "ground",
        width: 10,
        height: 10,
        subdivisions: subdivisions,
        updatable: true
    });

    // Material
    const material = new BABYLON.StandardMaterial(
        "groundMaterial",
        scene
    );

    ground.material = material;

    // Apply terrain deformation
    editGround(ground);

    return ground;
}

function editGround(ground) {

    // Vertex positions
    const positions = ground.getVerticesData(
        BABYLON.VertexBuffer.PositionKind
    );

    for (let i = 0; i < positions.length; i += 3) {

        const x = positions[i];
        const z = positions[i + 2];

        // Modify Y height
        positions[i + 1] = Simplex2d(x, z);
    }

    // Update geometry
    ground.updateVerticesData(
        BABYLON.VertexBuffer.PositionKind,
        positions
    );

    // Recompute normals
    const indices = ground.getIndices();
    const normals = [];

    BABYLON.VertexData.ComputeNormals(
        positions,
        indices,
        normals
    );

    ground.updateVerticesData(
        BABYLON.VertexBuffer.NormalKind,
        normals
    );
}