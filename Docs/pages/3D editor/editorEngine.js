// editorEngine.js

export let quadNo = 0;

export function startEditor({ engine, scene }) {
    if (!engine || !scene) {
        throw new Error("startEditor({ engine, scene }) requires both engine and scene.");
    }

    const state = {
        selected: null,
        mode: "select",

        isDragging: false,

        snap: {
            position: 0.5,
            rotation: Math.PI / 12,
            scale: 0.1
        },

        vertexHandle: null,
        vertexIndex: null,

        edgeHandle: null,
        edgeIndices: null,

        faceHandle: null,
        faceIndices: null,

        subdivLevel: 0,
        baseMeshClone: null,

        _clipboard: null
    };

    // ============================================================
    // HELPERS
    // ============================================================

    function isHandleName(name) {
        return (
            name === "vertexHandle" ||
            name === "edgeHandle" ||
            name === "faceHandle"
        );
    }

    function isGrid(mesh) {
        return mesh?.metadata?.isEditorGrid === true;
    }

    function isEditableMesh(mesh) {
        return !!mesh &&
            !isGrid(mesh) &&
            !isHandleName(mesh.name) &&
            mesh instanceof BABYLON.Mesh;
    }

    function isValidPick(pick) {
        return !!(
            pick &&
            pick.hit &&
            pick.pickedMesh &&
            isEditableMesh(pick.pickedMesh)
        );
    }

    function setGizmoMode({
        move = false,
        rotate = false,
        scale = false
    } = {}) {
        gizmoManager.positionGizmoEnabled = move;
        gizmoManager.rotationGizmoEnabled = rotate;
        gizmoManager.scaleGizmoEnabled = scale;
    }

    function disposeMesh(mesh) {
        if (!mesh) return;

        if (state.selected === mesh) {
            state.selected = null;
        }

        if (state.vertexHandle === mesh) {
            state.vertexHandle = null;
            state.vertexIndex = null;
        }

        if (state.edgeHandle === mesh) {
            state.edgeHandle = null;
            state.edgeIndices = null;
        }

        if (state.faceHandle === mesh) {
            state.faceHandle = null;
            state.faceIndices = null;
        }

        mesh.dispose();
    }

    function getPositionData(mesh) {
        return mesh?.getVerticesData(
            BABYLON.VertexBuffer.PositionKind
        );
    }

    function getIndexData(mesh) {
        return mesh?.getIndices();
    }

    function recomputeNormals(mesh) {
        const positions = getPositionData(mesh);
        const indices = getIndexData(mesh);

        if (!positions || !indices) return;

        const normals = [];

        BABYLON.VertexData.ComputeNormals(
            positions,
            indices,
            normals
        );

        mesh.setVerticesData(
            BABYLON.VertexBuffer.NormalKind,
            normals,
            true
        );

        mesh.refreshBoundingInfo();
    }

    function ensureMetadata(mesh) {
        if (!mesh.metadata) {
            mesh.metadata = {};
        }

        return mesh.metadata;
    }

    // ============================================================
    // GRID
    // ============================================================

    function createGrid() {
        const oldGrid = scene.meshes.find(isGrid);

        if (oldGrid) {
            oldGrid.dispose();
        }

        const grid = BABYLON.MeshBuilder.CreateGround(
            "editorGrid",
            {
                width: 100,
                height: 100,
                subdivisions: 100
            },
            scene
        );

        const mat = new BABYLON.GridMaterial(
            "editorGridMaterial",
            scene
        );

        mat.majorUnitFrequency = 1;
        mat.minorUnitVisibility = 0.4;
        mat.gridRatio = 1;
        mat.backFaceCulling = false;

        grid.material = mat;
        grid.isPickable = false;

        grid.metadata = {
            isEditorGrid: true
        };

        return grid;
    }

    createGrid();

    // ============================================================
    // SHAPES
    // ============================================================

    function createTriangle(name) {
        const h = Math.sqrt(3) / 2;

        const positions = [
            -0.5, 0, 0,
             0.5, 0, 0,
             0,   0, h
        ];

        const indices = [
            0, 1, 2
        ];

        const normals = [];

        BABYLON.VertexData.ComputeNormals(
            positions,
            indices,
            normals
        );

        const uvs = [
            0, 0,
            1, 0,
            0.5, 1
        ];

        const mesh = new BABYLON.Mesh(
            name,
            scene
        );

        const data = new BABYLON.VertexData();

        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        data.uvs = uvs;

        data.applyToMesh(mesh);

        mesh.isPickable = true;

        const material = new BABYLON.StandardMaterial(
            `${name}_mat_${BABYLON.Tools.RandomId()}`,
            scene
        );

        material.diffuseColor = BABYLON.Color3.Red();

        mesh.material = material;

        ensureMetadata(mesh)._isBaked = true;

        return mesh;
    }

    function createQuad(name) {
        const mesh = BABYLON.MeshBuilder.CreatePlane(
            name,
            {
                width: 1,
                height: 1,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            },
            scene
        );

        mesh.rotation.x = Math.PI / 2;
        mesh.isPickable = true;

        const material = new BABYLON.StandardMaterial(
            `${name}_mat_${BABYLON.Tools.RandomId()}`,
            scene
        );

        material.diffuseColor = BABYLON.Color3.Green();

        mesh.material = material;

        ensureMetadata(mesh)._isBaked = false;

        return mesh;
    }

    // ============================================================
    // GIZMO
    // ============================================================

    const gizmoManager = new BABYLON.GizmoManager(scene);

    gizmoManager.positionGizmoEnabled = false;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;

    // ============================================================
    // UI
    // ============================================================

    const selectedNameUI =
        document.getElementById("selectedName");

    const modeTextUI =
        document.getElementById("modeText");

    const textureInput =
        document.getElementById("textureInput");

    const subdivSlider =
        document.getElementById("subdivSlider");

    const importFile =
        document.getElementById("importFile");

    const colorPicker =
        document.getElementById("colorPicker");

    const loadFileInput =
        document.getElementById("loadFile");

    function updateUI() {
        if (selectedNameUI) {
            selectedNameUI.textContent =
                state.selected
                    ? state.selected.name
                    : "None";
        }

        if (modeTextUI) {
            modeTextUI.textContent = state.mode;
        }
    }

    // ============================================================
    // HANDLE CLEANUP
    // ============================================================

    function clearVertexHandle() {
        if (state.vertexHandle) {
            state.vertexHandle.dispose();
        }

        state.vertexHandle = null;
        state.vertexIndex = null;
    }

    function clearEdgeHandle() {
        if (state.edgeHandle) {
            state.edgeHandle.dispose();
        }

        state.edgeHandle = null;
        state.edgeIndices = null;
    }

    function clearFaceHandle() {
        if (state.faceHandle) {
            state.faceHandle.dispose();
        }

        state.faceHandle = null;
        state.faceIndices = null;
    }

    function clearAllHandles() {
        clearVertexHandle();
        clearEdgeHandle();
        clearFaceHandle();

        gizmoManager.attachToMesh(null);
    }

    // ============================================================
    // SELECTION
    // ============================================================

    function selectMesh(mesh) {
        if (!isEditableMesh(mesh)) {
            state.selected = null;
            clearAllHandles();
            return;
        }

        state.selected = mesh;

        if (
            state.mode === "move" ||
            state.mode === "rotate" ||
            state.mode === "scale"
        ) {
            gizmoManager.attachToMesh(mesh);
        }

        updateUI();
    }

    function deselect() {
        state.selected = null;

        clearAllHandles();

        gizmoManager.attachToMesh(null);

        updateUI();
    }

    // ============================================================
    // BAKE TRANSFORM
    // ============================================================

    function bakeMeshTransform(mesh) {
        if (!mesh) return;

        const metadata = ensureMetadata(mesh);

        if (metadata._isBaked) {
            return;
        }

        const positions = getPositionData(mesh);

        if (!positions) {
            return;
        }

        mesh.computeWorldMatrix(true);

        const world = mesh.getWorldMatrix();

        for (let i = 0; i < positions.length; i += 3) {
            const vertex =
                new BABYLON.Vector3(
                    positions[i],
                    positions[i + 1],
                    positions[i + 2]
                );

            const worldVertex =
                BABYLON.Vector3.TransformCoordinates(
                    vertex,
                    world
                );

            positions[i] = worldVertex.x;
            positions[i + 1] = worldVertex.y;
            positions[i + 2] = worldVertex.z;
        }

        mesh.setVerticesData(
            BABYLON.VertexBuffer.PositionKind,
            positions,
            true
        );

        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scaling.set(1, 1, 1);

        mesh.computeWorldMatrix(true);

        metadata._isBaked = true;

        recomputeNormals(mesh);
    }

    async function convertToEditable(mesh) {
        if (!mesh) {
            return null;
        }

        if (!mesh.isVerticesDataPresent(
            BABYLON.VertexBuffer.PositionKind
        )) {
            return mesh;
        }

        bakeMeshTransform(mesh);

        mesh.isPickable = true;

        ensureMetadata(mesh)._isBaked = true;

        return mesh;
    }

    // ============================================================
    // SERIALIZATION
    // ============================================================

    function serializeSceneForSave() {
        const data = [];

        for (const mesh of scene.meshes) {
            if (!isEditableMesh(mesh)) {
                continue;
            }

            const positions = getPositionData(mesh);
            const indices = getIndexData(mesh);

            if (!positions || !indices) {
                continue;
            }

            const normals =
                mesh.getVerticesData(
                    BABYLON.VertexBuffer.NormalKind
                );

            const uvs =
                mesh.getVerticesData(
                    BABYLON.VertexBuffer.UVKind
                );

            const material = mesh.material;

            data.push({
                name: mesh.name,

                position: mesh.position.asArray(),
                rotation: mesh.rotation.asArray(),
                scaling: mesh.scaling.asArray(),

                positions: Array.from(positions),
                indices: Array.from(indices),

                normals: normals
                    ? Array.from(normals)
                    : null,

                uvs: uvs
                    ? Array.from(uvs)
                    : null,

                material: material
                    ? {
                        diffuseColor:
                            material.diffuseColor
                                ? material.diffuseColor.asArray()
                                : [1, 1, 1],

                        texture:
                            material.diffuseTexture?.name || null
                    }
                    : null
            });
        }

        return JSON.stringify(data, null, 2);
    }

    async function loadSavedScene(json) {
        let data;

        try {
            data = JSON.parse(json);
        } catch (error) {
            console.error("Invalid scene JSON:", error);
            return;
        }

        if (!Array.isArray(data)) {
            console.error("Scene file must contain an array.");
            return;
        }

        for (const mesh of [...scene.meshes]) {
            if (isEditableMesh(mesh)) {
                mesh.dispose();
            }
        }

        state.selected = null;
        state.baseMeshClone = null;
        clearAllHandles();

        for (const item of data) {
            if (!item.positions || !item.indices) {
                continue;
            }

            const mesh =
                new BABYLON.Mesh(
                    item.name || "Mesh",
                    scene
                );

            mesh.setVerticesData(
                BABYLON.VertexBuffer.PositionKind,
                item.positions,
                true
            );

            mesh.setIndices(item.indices);

            if (item.normals) {
                mesh.setVerticesData(
                    BABYLON.VertexBuffer.NormalKind,
                    item.normals,
                    true
                );
            } else {
                recomputeNormals(mesh);
            }

            if (item.uvs) {
                mesh.setVerticesData(
                    BABYLON.VertexBuffer.UVKind,
                    item.uvs,
                    true
                );
            }

            if (item.position) {
                mesh.position =
                    BABYLON.Vector3.FromArray(
                        item.position
                    );
            }

            if (item.rotation) {
                mesh.rotation =
                    BABYLON.Vector3.FromArray(
                        item.rotation
                    );
            }

            if (item.scaling) {
                mesh.scaling =
                    BABYLON.Vector3.FromArray(
                        item.scaling
                    );
            }

            if (item.material) {
                const material =
                    new BABYLON.StandardMaterial(
                        `${mesh.name}_mat_${BABYLON.Tools.RandomId()}`,
                        scene
                    );

                if (item.material.diffuseColor) {
                    material.diffuseColor =
                        BABYLON.Color3.FromArray(
                            item.material.diffuseColor
                        );
                }

                if (item.material.texture) {
                    try {
                        const texture =
                            new BABYLON.Texture(
                                item.material.texture,
                                scene
                            );

                        texture.name =
                            item.material.texture;

                        material.diffuseTexture =
                            texture;
                    } catch (error) {
                        console.warn(
                            "Could not load texture:",
                            item.material.texture,
                            error
                        );
                    }
                }

                mesh.material = material;
            }

            mesh.isPickable = true;

            ensureMetadata(mesh)._isBaked = true;
        }

        updateUI();
    }

    // ============================================================
    // MODES
    // ============================================================

    function setMode(mode) {
        state.mode = mode;
        state.isDragging = false;

        clearAllHandles();

        setGizmoMode({
            move: mode === "move" ||
                mode === "vertex" ||
                mode === "edge" ||
                mode === "face" ||
                mode === "extrude",

            rotate: mode === "rotate",

            scale: mode === "scale"
        });

        if (
            state.selected &&
            isEditableMesh(state.selected) &&
            (
                mode === "move" ||
                mode === "rotate" ||
                mode === "scale"
            )
        ) {
            gizmoManager.attachToMesh(
                state.selected
            );
        }

        updateUI();
    }

    const selectBtn =
        document.getElementById("selectBtn");

    if (selectBtn) {
        selectBtn.onclick = () => {
            setMode("select");
        };
    }

    const moveBtn =
        document.getElementById("moveBtn");

    if (moveBtn) {
        moveBtn.onclick = () => {
            setMode("move");
        };
    }

    const rotateBtn =
        document.getElementById("rotateBtn");

    if (rotateBtn) {
        rotateBtn.onclick = () => {
            setMode("rotate");
        };
    }

    const scaleBtn =
        document.getElementById("scaleBtn");

    if (scaleBtn) {
        scaleBtn.onclick = () => {
            setMode("scale");
        };
    }

    const vertexModeBtn =
        document.getElementById("vertexModeBtn");

    if (vertexModeBtn) {
        vertexModeBtn.onclick = () => {
            setMode("vertex");
        };
    }

    const edgeModeBtn =
        document.getElementById("edgeModeBtn");

    if (edgeModeBtn) {
        edgeModeBtn.onclick = () => {
            setMode("edge");
        };
    }

    const faceModeBtn =
        document.getElementById("faceModeBtn");

    if (faceModeBtn) {
        faceModeBtn.onclick = () => {
            setMode("face");
        };
    }

    const extrudeFaceBtn =
        document.getElementById("extrudeFaceBtn");

    if (extrudeFaceBtn) {
        extrudeFaceBtn.onclick = () => {
            setMode("extrude");
        };
    }

    // ============================================================
    // CREATE
    // ============================================================

    const addTriangleBtn =
        document.getElementById("addTriangleBtn");

    if (addTriangleBtn) {
        addTriangleBtn.onclick = () => {
            const triangle =
                createTriangle("Triangle");

            triangle.position.y = 0.01;

            selectMesh(triangle);
        };
    }

    const addQuadBtn =
        document.getElementById("addQuadBtn");

    if (addQuadBtn) {
        addQuadBtn.onclick = () => {
            const quad =
                createQuad(`quad_${quadNo++}`);

            quad.position.y = 0.01;

            selectMesh(quad);
        };
    }

    // ============================================================
    // TEXTURE
    // ============================================================

    const applyTextureBtn =
        document.getElementById("applyTextureBtn");

    if (applyTextureBtn) {
        applyTextureBtn.onclick = () => {
            if (
                !state.selected ||
                !isEditableMesh(state.selected) ||
                !textureInput ||
                !textureInput.files ||
                !textureInput.files[0]
            ) {
                return;
            }

            const file =
                textureInput.files[0];

            const reader =
                new FileReader();

            reader.onload = () => {
                const dataUrl =
                    reader.result;

                const texture =
                    new BABYLON.Texture(
                        dataUrl,
                        scene,
                        true,
                        false
                    );

                texture.name = dataUrl;

                let material =
                    state.selected.material;

                if (!material) {
                    material =
                        new BABYLON.StandardMaterial(
                            `mat_${state.selected.name}_${BABYLON.Tools.RandomId()}`,
                            scene
                        );

                    state.selected.material =
                        material;
                }

                material.diffuseTexture =
                    texture;
            };

            reader.readAsDataURL(file);
        };
    }

    // ============================================================
    // COLOR
    // ============================================================

    const applyColorBtn =
        document.getElementById("applyColorBtn");

    if (applyColorBtn) {
        applyColorBtn.onclick = () => {
            if (
                !state.selected ||
                !isEditableMesh(state.selected) ||
                !colorPicker
            ) {
                return;
            }

            const color =
                BABYLON.Color3.FromHexString(
                    colorPicker.value
                );

            if (!state.selected.material) {
                state.selected.material =
                    new BABYLON.StandardMaterial(
                        `mat_${state.selected.name}_${BABYLON.Tools.RandomId()}`,
                        scene
                    );
            }

            state.selected.material.diffuseColor =
                color;
        };
    }

    // ============================================================
    // SUBDIVISION
    // ============================================================

    function subdivideMesh(mesh, level = 1) {
        let positions =
            getPositionData(mesh);

        let indices =
            getIndexData(mesh);

        if (!positions || !indices) {
            return;
        }

        for (let levelIndex = 0; levelIndex < level; levelIndex++) {
            const newPositions = [];
            const newIndices = [];

            for (let i = 0; i < indices.length; i += 3) {
                const ia = indices[i];
                const ib = indices[i + 1];
                const ic = indices[i + 2];

                const a =
                    BABYLON.Vector3.FromArray(
                        positions,
                        ia * 3
                    );

                const b =
                    BABYLON.Vector3.FromArray(
                        positions,
                        ib * 3
                    );

                const c =
                    BABYLON.Vector3.FromArray(
                        positions,
                        ic * 3
                    );

                const ab =
                    a.add(b).scale(0.5);

                const bc =
                    b.add(c).scale(0.5);

                const ca =
                    c.add(a).scale(0.5);

                const base =
                    newPositions.length / 3;

                newPositions.push(
                    a.x, a.y, a.z,
                    b.x, b.y, b.z,
                    c.x, c.y, c.z,
                    ab.x, ab.y, ab.z,
                    bc.x, bc.y, bc.z,
                    ca.x, ca.y, ca.z
                );

                const A = base;
                const B = base + 1;
                const C = base + 2;
                const AB = base + 3;
                const BC = base + 4;
                const CA = base + 5;

                newIndices.push(
                    A, AB, CA,
                    AB, B, BC,
                    CA, BC, C,
                    AB, BC, CA
                );
            }

            positions = newPositions;
            indices = newIndices;
        }

        mesh.setVerticesData(
            BABYLON.VertexBuffer.PositionKind,
            positions,
            true
        );

        mesh.setIndices(
            indices,
            null,
            true
        );

        recomputeNormals(mesh);
    }

    if (subdivSlider) {
        subdivSlider.oninput = async () => {
            if (
                !state.selected ||
                !isEditableMesh(state.selected)
            ) {
                return;
            }

            const level =
                parseInt(
                    subdivSlider.value,
                    10
                ) || 0;

            state.subdivLevel = level;

            if (state.baseMeshClone) {
                state.baseMeshClone.dispose();
                state.baseMeshClone = null;
            }

            const source =
                state.selected;

            state.baseMeshClone =
                source.clone(
                    `${source.name}_base`,
                    null
                );

            if (!state.baseMeshClone) {
                return;
            }

            state.baseMeshClone.setEnabled(false);
            state.baseMeshClone.isPickable = false;

            source.dispose();

            let clone =
                state.baseMeshClone.clone(
                    state.baseMeshClone.name
                        .replace("_base", ""),
                    null
                );

            clone.setEnabled(true);
            clone.isPickable = true;

            await convertToEditable(clone);

            if (level > 0) {
                subdivideMesh(
                    clone,
                    level
                );
            }

            state.selected = clone;

            if (
                state.mode === "move" ||
                state.mode === "rotate" ||
                state.mode === "scale"
            ) {
                gizmoManager.attachToMesh(
                    clone
                );
            }

            updateUI();
        };
    }

    // ============================================================
    // IMPORT
    // ============================================================

    const importBtn =
        document.getElementById("importBtn");

    if (importBtn && importFile) {
        importBtn.onclick = () => {
            if (
                !importFile.files ||
                !importFile.files[0]
            ) {
                return;
            }

            const file =
                importFile.files[0];

            const url =
                URL.createObjectURL(file);

            const extension =
                "." +
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();

            BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "",
                url,
                scene,
                undefined,
                extension
            )
                .then(async result => {
                    URL.revokeObjectURL(url);

                    let editable =
                        result.meshes.find(
                            mesh =>
                                mesh instanceof BABYLON.Mesh &&
                                !isGrid(mesh)
                        );

                    if (!editable) {
                        return;
                    }

                    for (const mesh of result.meshes) {
                        if (
                            mesh !== editable &&
                            mesh instanceof BABYLON.Mesh &&
                            !isGrid(mesh)
                        ) {
                            mesh.isPickable = false;
                        }
                    }

                    editable =
                        await convertToEditable(
                            editable
                        );

                    selectMesh(editable);
                })
                .catch(error => {
                    URL.revokeObjectURL(url);

                    console.error(
                        "Import failed:",
                        error
                    );
                });
        };
    }

    // ============================================================
    // EXPORT GLB
    // ============================================================

    const exportGLBBtn =
        document.getElementById("exportGLBBtn");

    if (exportGLBBtn) {
        exportGLBBtn.onclick = async () => {
            try {
                const glb =
                    await BABYLON.GLTF2Export.GLBAsync(
                        scene,
                        "scene",
                        {
                            shouldExportNode: node =>
                                !isGrid(node) &&
                                !isHandleName(node.name)
                        }
                    );

                glb.downloadFiles();
            } catch (error) {
                console.error(
                    "GLB export failed:",
                    error
                );
            }
        };
    }

    // ============================================================
    // EXPORT GLTF
    // ============================================================

    const exportGLTFBtn =
        document.getElementById("exportGLTFBtn");

    if (exportGLTFBtn) {
        exportGLTFBtn.onclick = async () => {
            try {
                const gltf =
                    await BABYLON.GLTF2Export.GLTFAsync(
                        scene,
                        "scene",
                        {
                            shouldExportNode: node =>
                                !isGrid(node) &&
                                !isHandleName(node.name)
                        }
                    );

                gltf.downloadFiles();
            } catch (error) {
                console.error(
                    "GLTF export failed:",
                    error
                );
            }
        };
    }

    // ============================================================
    // EXPORT OBJ
    // ============================================================

    const exportOBJBtn =
        document.getElementById("exportOBJBtn");

    if (exportOBJBtn) {
        exportOBJBtn.onclick = () => {
            try {
                const meshes =
                    scene.meshes.filter(
                        mesh =>
                            isEditableMesh(mesh)
                    );

                if (
                    !BABYLON.OBJExport ||
                    !BABYLON.OBJExport.OBJ
                ) {
                    console.error(
                        "Babylon OBJ exporter is not loaded."
                    );
                    return;
                }

                const obj =
                    BABYLON.OBJExport.OBJ(
                        meshes,
                        true,
                        true
                    );

                const blob =
                    new Blob(
                        [obj],
                        {
                            type: "text/plain"
                        }
                    );

                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;
                link.download = "scene.obj";

                document.body.appendChild(link);
                link.click();
                link.remove();

                URL.revokeObjectURL(url);
            } catch (error) {
                console.error(
                    "OBJ export failed:",
                    error
                );
            }
        };
    }

    // ============================================================
    // SAVE
    // ============================================================

    const saveBtn =
        document.getElementById("saveBtn");

    if (saveBtn) {
        saveBtn.onclick = () => {
            const json =
                serializeSceneForSave();

            const blob =
                new Blob(
                    [json],
                    {
                        type: "application/json"
                    }
                );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "scene.json";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        };
    }

    // ============================================================
    // LOAD
    // ============================================================

    const loadBtn =
        document.getElementById("loadBtn");

    if (loadBtn && loadFileInput) {
        loadBtn.onclick = () => {
            loadFileInput.click();
        };

        loadFileInput.onchange = async event => {
            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            try {
                const text =
                    await file.text();

                await loadSavedScene(text);

                deselect();
            } catch (error) {
                console.error(
                    "Load failed:",
                    error
                );
            }

            loadFileInput.value = "";
        };
    }

    // ============================================================
    // SNAPPING
    // ============================================================

    function snapPosition(mesh) {
        if (!mesh) return;

        const amount =
            state.snap.position;

        if (amount <= 0) return;

        mesh.position.x =
            Math.round(
                mesh.position.x / amount
            ) * amount;

        mesh.position.y =
            Math.round(
                mesh.position.y / amount
            ) * amount;

        mesh.position.z =
            Math.round(
                mesh.position.z / amount
            ) * amount;
    }

    function snapRotation(mesh) {
        if (!mesh) return;

        const amount =
            state.snap.rotation;

        if (amount <= 0) return;

        mesh.rotation.x =
            Math.round(
                mesh.rotation.x / amount
            ) * amount;

        mesh.rotation.y =
            Math.round(
                mesh.rotation.y / amount
            ) * amount;

        mesh.rotation.z =
            Math.round(
                mesh.rotation.z / amount
            ) * amount;
    }

    function snapScale(mesh) {
        if (!mesh) return;

        const amount =
            state.snap.scale;

        if (amount <= 0) return;

        mesh.scaling.x =
            Math.max(
                amount,
                Math.round(
                    mesh.scaling.x / amount
                ) * amount
            );

        mesh.scaling.y =
            Math.max(
                amount,
                Math.round(
                    mesh.scaling.y / amount
                ) * amount
            );

        mesh.scaling.z =
            Math.max(
                amount,
                Math.round(
                    mesh.scaling.z / amount
                ) * amount
            );
    }

    // ============================================================
    // GIZMO DRAG EVENTS
    // ============================================================

    if (gizmoManager.gizmos.positionGizmo) {
        gizmoManager.gizmos.positionGizmo
            .onDragEndObservable
            .add(() => {
                if (
                    state.selected &&
                    state.mode === "move"
                ) {
                    snapPosition(
                        state.selected
                    );
                }
            });
    }

    if (gizmoManager.gizmos.rotationGizmo) {
        gizmoManager.gizmos.rotationGizmo
            .onDragEndObservable
            .add(() => {
                if (
                    state.selected &&
                    state.mode === "rotate"
                ) {
                    snapRotation(
                        state.selected
                    );
                }
            });
    }

    if (gizmoManager.gizmos.scaleGizmo) {
        gizmoManager.gizmos.scaleGizmo
            .onDragEndObservable
            .add(() => {
                if (
                    state.selected &&
                    state.mode === "scale"
                ) {
                    snapScale(
                        state.selected
                    );
                }
            });
    }

    // ============================================================
    // VERTEX EDITING
    // ============================================================

    function enterVertexMode(mesh, pickInfo) {
        clearAllHandles();

        if (
            !mesh ||
            !pickInfo?.pickedPoint
        ) {
            return;
        }

        convertToEditable(mesh);

        const positions =
            getPositionData(mesh);

        if (!positions) {
            return;
        }

        mesh.computeWorldMatrix(true);

        const pickedPoint =
            pickInfo.pickedPoint;

        let closestIndex = null;
        let closestDistance = Infinity;

        for (
            let i = 0;
            i < positions.length;
            i += 3
        ) {
            const local =
                new BABYLON.Vector3(
                    positions[i],
                    positions[i + 1],
                    positions[i + 2]
                );

            const world =
                BABYLON.Vector3.TransformCoordinates(
                    local,
                    mesh.getWorldMatrix()
                );

            const distance =
                BABYLON.Vector3.DistanceSquared(
                    world,
                    pickedPoint
                );

            if (
                distance <
                closestDistance
            ) {
                closestDistance =
                    distance;

                closestIndex = i;
            }
        }

        if (closestIndex === null) {
            return;
        }

        state.vertexIndex =
            closestIndex;

        const localVertex =
            new BABYLON.Vector3(
                positions[closestIndex],
                positions[closestIndex + 1],
                positions[closestIndex + 2]
            );

        const worldVertex =
            BABYLON.Vector3.TransformCoordinates(
                localVertex,
                mesh.getWorldMatrix()
            );

        const handle =
            BABYLON.MeshBuilder.CreateSphere(
                "vertexHandle",
                {
                    diameter: 0.12
                },
                scene
            );

        handle.position.copyFrom(
            worldVertex
        );

        handle.isPickable = false;

        ensureMetadata(handle).isEditorHandle =
            true;

        state.vertexHandle = handle;

        gizmoManager.attachToMesh(handle);
        setGizmoMode({ move: true });

        let dragStartLocal = null;

        const gizmo =
            gizmoManager.gizmos.positionGizmo;

        if (!gizmo) {
            return;
        }

        gizmo.onDragStartObservable.clear();

        gizmo.onDragEndObservable.clear();

        gizmo.onDragStartObservable.add(() => {
            mesh.computeWorldMatrix(true);

            const inverse =
                mesh
                    .getWorldMatrix()
                    .clone()
                    .invert();

            dragStartLocal =
                BABYLON.Vector3.TransformCoordinates(
                    handle.position,
                    inverse
                );
        });

        gizmo.onDragEndObservable.add(() => {
            if (
                !state.vertexHandle ||
                state.vertexIndex === null ||
                !dragStartLocal
            ) {
                return;
            }

            mesh.computeWorldMatrix(true);

            const inverse =
                mesh
                    .getWorldMatrix()
                    .clone()
                    .invert();

            const dragEndLocal =
                BABYLON.Vector3.TransformCoordinates(
                    handle.position,
                    inverse
                );

            const delta =
                dragEndLocal.subtract(
                    dragStartLocal
                );

            const pos =
                getPositionData(mesh);

            if (!pos) return;

            pos[state.vertexIndex] +=
                delta.x;

            pos[state.vertexIndex + 1] +=
                delta.y;

            pos[state.vertexIndex + 2] +=
                delta.z;

            mesh.setVerticesData(
                BABYLON.VertexBuffer.PositionKind,
                pos,
                true
            );

            recomputeNormals(mesh);

            handle.position.copyFrom(
                BABYLON.Vector3.TransformCoordinates(
                    new BABYLON.Vector3(
                        pos[state.vertexIndex],
                        pos[state.vertexIndex + 1],
                        pos[state.vertexIndex + 2]
                    ),
                    mesh.getWorldMatrix()
                )
            );

            dragStartLocal =
                dragEndLocal;
        });
    }

    // ============================================================
    // EDGE EDITING
    // ============================================================

    function enterEdgeMode(mesh, pickInfo) {
        clearAllHandles();

        if (
            !mesh ||
            !pickInfo?.pickedPoint
        ) {
            return;
        }

        convertToEditable(mesh);

        const positions =
            getPositionData(mesh);

        const indices =
            getIndexData(mesh);

        if (!positions || !indices) {
            return;
        }

        mesh.computeWorldMatrix(true);

        const pickedPoint =
            pickInfo.pickedPoint;

        let bestEdge = null;
        let bestDistance = Infinity;

        const seenEdges = new Set();

        for (
            let i = 0;
            i < indices.length;
            i += 3
        ) {
            const a = indices[i];
            const b = indices[i + 1];
            const c = indices[i + 2];

            const edges = [
                [a, b],
                [b, c],
                [c, a]
            ];

            for (const edge of edges) {
                const v1 =
                    Math.min(
                        edge[0],
                        edge[1]
                    );

                const v2 =
                    Math.max(
                        edge[0],
                        edge[1]
                    );

                const key =
                    `${v1}_${v2}`;

                if (seenEdges.has(key)) {
                    continue;
                }

                seenEdges.add(key);

                const p1 =
                    new BABYLON.Vector3(
                        positions[v1 * 3],
                        positions[v1 * 3 + 1],
                        positions[v1 * 3 + 2]
                    );

                const p2 =
                    new BABYLON.Vector3(
                        positions[v2 * 3],
                        positions[v2 * 3 + 1],
                        positions[v2 * 3 + 2]
                    );

                const w1 =
                    BABYLON.Vector3.TransformCoordinates(
                        p1,
                        mesh.getWorldMatrix()
                    );

                const w2 =
                    BABYLON.Vector3.TransformCoordinates(
                        p2,
                        mesh.getWorldMatrix()
                    );

                const midpoint =
                    w1.add(w2).scale(0.5);

                const distance =
                    BABYLON.Vector3.DistanceSquared(
                        midpoint,
                        pickedPoint
                    );

                if (
                    distance <
                    bestDistance
                ) {
                    bestDistance =
                        distance;

                    bestEdge = {
                        v1,
                        v2,
                        midpoint
                    };
                }
            }
        }

        if (!bestEdge) {
            return;
        }

        state.edgeIndices = [
            bestEdge.v1,
            bestEdge.v2
        ];

        const handle =
            BABYLON.MeshBuilder.CreateSphere(
                "edgeHandle",
                {
                    diameter: 0.14
                },
                scene
            );

        handle.position.copyFrom(
            bestEdge.midpoint
        );

        handle.isPickable = false;

        state.edgeHandle = handle;

        gizmoManager.attachToMesh(handle);
        setGizmoMode({ move: true });

        const gizmo =
            gizmoManager.gizmos.positionGizmo;

        if (!gizmo) {
            return;
        }

        let previousLocalMid = null;

        gizmo.onDragStartObservable.clear();
        gizmo.onDragObservable.clear();
        gizmo.onDragEndObservable.clear();

        gizmo.onDragStartObservable.add(() => {
            mesh.computeWorldMatrix(true);

            const inverse =
                mesh
                    .getWorldMatrix()
                    .clone()
                    .invert();

            previousLocalMid =
                BABYLON.Vector3.TransformCoordinates(
                    handle.position,
                    inverse
                );
        });

        gizmo.onDragObservable.add(() => {
            if (
                !state.edgeHandle ||
                !state.edgeIndices
            ) {
                return;
            }

            mesh.computeWorldMatrix(true);

            const inverse =
                mesh
                    .getWorldMatrix()
                    .clone()
                    .invert();

            const currentLocalMid =
                BABYLON.Vector3.TransformCoordinates(
                    handle.position,
                    inverse
                );

            if (!previousLocalMid) {
                previousLocalMid =
                    currentLocalMid.clone();

                return;
            }

            const delta =
                currentLocalMid.subtract(
                    previousLocalMid
                );

            const positions =
                getPositionData(mesh);

            if (!positions) {
                return;
            }

            const v1 =
                state.edgeIndices[0];

            const v2 =
                state.edgeIndices[1];

            positions[v1 * 3] += delta.x;
            positions[v1 * 3 + 1] += delta.y;
            positions[v1 * 3 + 2] += delta.z;

            positions[v2 * 3] += delta.x;
            positions[v2 * 3 + 1] += delta.y;
            positions[v2 * 3 + 2] += delta.z;

            mesh.setVerticesData(
                BABYLON.VertexBuffer.PositionKind,
                positions,
                true
            );

            recomputeNormals(mesh);

            previousLocalMid =
                currentLocalMid.clone();
        });
    }

    // ============================================================
    // FACE FINDING
    // ============================================================

    function findClosestFace(mesh, pickInfo) {
        const positions =
            getPositionData(mesh);

        const indices =
            getIndexData(mesh);

        if (
            !positions ||
            !indices ||
            !pickInfo?.pickedPoint
        ) {
            return null;
        }

        mesh.computeWorldMatrix(true);

        const pickedPoint =
            pickInfo.pickedPoint;

        let bestFace = null;
        let bestDistance = Infinity;

        for (
            let i = 0;
            i < indices.length;
            i += 3
        ) {
            const ia = indices[i];
            const ib = indices[i + 1];
            const ic = indices[i + 2];

            const a =
                new BABYLON.Vector3(
                    positions[ia * 3],
                    positions[ia * 3 + 1],
                    positions[ia * 3 + 2]
                );

            const b =
                new BABYLON.Vector3(
                    positions[ib * 3],
                    positions[ib * 3 + 1],
                    positions[ib * 3 + 2]
                );

            const c =
                new BABYLON.Vector3(
                    positions[ic * 3],
                    positions[ic * 3 + 1],
                    positions[ic * 3 + 2]
                );

            const aw =
                BABYLON.Vector3.TransformCoordinates(
                    a,
                    mesh.getWorldMatrix()
                );

            const bw =
                BABYLON.Vector3.TransformCoordinates(
                    b,
                    mesh.getWorldMatrix()
                );

            const cw =
                BABYLON.Vector3.TransformCoordinates(
                    c,
                    mesh.getWorldMatrix()
                );

            const center =
                aw.add(bw)
                    .add(cw)
                    .scale(1 / 3);

            const distance =
                BABYLON.Vector3.DistanceSquared(
                    center,
                    pickedPoint
                );

            if (
                distance <
                bestDistance
            ) {
                bestDistance =
                    distance;

                bestFace = {
                    ia,
                    ib,
                    ic,
                    center
                };
            }
        }

        return bestFace;
    }

    // ============================================================
    // FACE MOVE
    // ============================================================

    function enterFaceMove(mesh, pickInfo) {
        clearAllHandles();

        if (
            !mesh ||
            !pickInfo?.pickedPoint
        ) {
            return;
        }

        convertToEditable(mesh);

        const face =
            findClosestFace(
                mesh,
                pickInfo
            );

        if (!face) {
            return;
        }

        state.faceIndices = [
            face.ia,
            face.ib,
            face.ic
        ];

        const handle =
            BABYLON.MeshBuilder.CreateSphere(
                "faceHandle",
                {
                    diameter: 0.16
                },
                scene
            );

        handle.position.copyFrom(
            face.center
        );

        handle.isPickable = false;

        state.faceHandle = handle;

        gizmoManager.attachToMesh(handle);
        setGizmoMode({ move: true });

        const gizmo =
            gizmoManager.gizmos.positionGizmo;

        if (!gizmo) {
            return;
        }

        let previousLocalCenter = null;

        gizmo.onDragStartObservable.clear();
        gizmo.onDragObservable.clear();
        gizmo.onDragEndObservable.clear();

        gizmo.onDragStartObservable.add(() => {
            mesh.computeWorldMatrix(true);

            const inverse =
                mesh
                    .getWorldMatrix()
                    .clone()
                    .invert();

            previousLocalCenter =
                BABYLON.Vector3.TransformCoordinates(
                    handle.position,
                    inverse
                );
        });

        gizmo.onDragObservable.add(() => {
            if (
                !state.faceHandle ||
                !state.faceIndices
            ) {
                return;
            }

            mesh.computeWorldMatrix(true);

            const inverse =
                mesh
                    .getWorldMatrix()
                    .clone()
                    .invert();

            const currentLocalCenter =
                BABYLON.Vector3.TransformCoordinates(
                    handle.position,
                    inverse
                );

            if (!previousLocalCenter) {
                previousLocalCenter =
                    currentLocalCenter.clone();

                return;
            }

            const delta =
                currentLocalCenter.subtract(
                    previousLocalCenter
                );

            const positions =
                getPositionData(mesh);

            if (!positions) {
                return;
            }

            for (
                const index of state.faceIndices
            ) {
                positions[index * 3] +=
                    delta.x;

                positions[index * 3 + 1] +=
                    delta.y;

                positions[index * 3 + 2] +=
                    delta.z;
            }

            mesh.setVerticesData(
                BABYLON.VertexBuffer.PositionKind,
                positions,
                true
            );

            recomputeNormals(mesh);

            previousLocalCenter =
                currentLocalCenter.clone();
        });
    }

    // ============================================================
    // FACE EXTRUDE
    // ============================================================

    function enterFaceExtrude(mesh, pickInfo) {
        clearAllHandles();

        if (
            !mesh ||
            !pickInfo?.pickedPoint
        ) {
            return;
        }

        convertToEditable(mesh);

        const positions =
            getPositionData(mesh);

        const indices =
            getIndexData(mesh);

        if (!positions || !indices) {
            return;
        }

        const face =
            findClosestFace(
                mesh,
                pickInfo
            );

        if (!face) {
            return;
        }

        const ia = face.ia;
        const ib = face.ib;
        const ic = face.ic;

        const a =
            new BABYLON.Vector3(
                positions[ia * 3],
                positions[ia * 3 + 1],
                positions[ia * 3 + 2]
            );

        const b =
            new BABYLON.Vector3(
                positions[ib * 3],
                positions[ib * 3 + 1],
                positions[ib * 3 + 2]
            );

        const c =
            new BABYLON.Vector3(
                positions[ic * 3],
                positions[ic * 3 + 1],
                positions[ic * 3 + 2]
            );

        const ab =
            b.subtract(a);

        const ac =
            c.subtract(a);

        const normal =
            BABYLON.Vector3.Cross(
                ab,
                ac
            ).normalize();

        const offset =
            normal.scale(0.5);

        const newPositions =
            Array.from(positions);

        const newIndices =
            Array.from(indices);

        const baseIndex =
            newPositions.length / 3;

        const a2 =
            a.add(offset);

        const b2 =
            b.add(offset);

        const c2 =
            c.add(offset);

        newPositions.push(
            a2.x, a2.y, a2.z,
            b2.x, b2.y, b2.z,
            c2.x, c2.y, c2.z
        );

        // Replace the selected triangle with the
        // extruded top triangle.
        for (
            let i = 0;
            i < newIndices.length;
            i += 3
        ) {
            const sameFace =
                newIndices[i] === ia &&
                newIndices[i + 1] === ib &&
                newIndices[i + 2] === ic;

            const reversedFace =
                newIndices[i] === ic &&
                newIndices[i + 1] === ib &&
                newIndices[i + 2] === ia;

            if (sameFace) {
                newIndices[i] =
                    baseIndex;

                newIndices[i + 1] =
                    baseIndex + 1;

                newIndices[i + 2] =
                    baseIndex + 2;

                break;
            }

            if (reversedFace) {
                newIndices[i] =
                    baseIndex + 2;

                newIndices[i + 1] =
                    baseIndex + 1;

                newIndices[i + 2] =
                    baseIndex;

                break;
            }
        }

        // Side 1
        newIndices.push(
            ia,
            ib,
            baseIndex + 1
        );

        newIndices.push(
            ia,
            baseIndex + 1,
            baseIndex
        );

        // Side 2
        newIndices.push(
            ib,
            ic,
            baseIndex + 2
        );

        newIndices.push(
            ib,
            baseIndex + 2,
            baseIndex + 1
        );

        // Side 3
        newIndices.push(
            ic,
            ia,
            baseIndex
        );

        newIndices.push(
            ic,
            baseIndex,
            baseIndex + 2
        );

        mesh.setVerticesData(
            BABYLON.VertexBuffer.PositionKind,
            newPositions,
            true
        );

        mesh.setIndices(
            newIndices,
            null,
            true
        );

        recomputeNormals(mesh);

        mesh.refreshBoundingInfo();
    }

    // ============================================================
    // POINTER DOWN
    // ============================================================

    scene.onPointerDown = (_, pick) => {
        // Standard object selection/manipulation.
        if (
            state.mode === "select" ||
            state.mode === "move" ||
            state.mode === "rotate" ||
            state.mode === "scale"
        ) {
            if (isValidPick(pick)) {
                selectMesh(
                    pick.pickedMesh
                );

                clearVertexHandle();
                clearEdgeHandle();
                clearFaceHandle();

                if (state.mode === "move") {
                    setGizmoMode({
                        move: true
                    });

                    gizmoManager.attachToMesh(
                        state.selected
                    );
                }

                if (state.mode === "rotate") {
                    setGizmoMode({
                        rotate: true
                    });

                    gizmoManager.attachToMesh(
                        state.selected
                    );
                }

                if (state.mode === "scale") {
                    setGizmoMode({
                        scale: true
                    });

                    gizmoManager.attachToMesh(
                        state.selected
                    );
                }

                if (state.mode === "select") {
                    gizmoManager.attachToMesh(
                        null
                    );
                }
            } else {
                deselect();
            }

            updateUI();

            return;
        }

        // Vertex mode.
        if (state.mode === "vertex") {
            if (isValidPick(pick)) {
                state.selected =
                    pick.pickedMesh;

                enterVertexMode(
                    state.selected,
                    pick
                );

                updateUI();
            }

            return;
        }

        // Edge mode.
        if (state.mode === "edge") {
            if (isValidPick(pick)) {
                state.selected =
                    pick.pickedMesh;

                enterEdgeMode(
                    state.selected,
                    pick
                );

                updateUI();
            }

            return;
        }

        // Face mode.
        if (state.mode === "face") {
            if (isValidPick(pick)) {
                state.selected =
                    pick.pickedMesh;

                enterFaceMove(
                    state.selected,
                    pick
                );

                updateUI();
            }

            return;
        }

        // Extrude mode.
        if (state.mode === "extrude") {
            if (isValidPick(pick)) {
                state.selected =
                    pick.pickedMesh;

                enterFaceExtrude(
                    state.selected,
                    pick
                );

                updateUI();
            }
        }
    };

    // ============================================================
    // POINTER MOVE
    // ============================================================

    scene.onPointerMove = () => {
        // Do not manually move the mesh when using
        // the Babylon position gizmo.
        //
        // The old implementation did both, which caused
        // the object to jump/fight the gizmo.
        if (
            state.mode !== "move" ||
            !state.selected
        ) {
            return;
        }

        // Intentionally empty.
        // Babylon's position gizmo handles movement.
    };

    scene.onPointerUp = () => {
        state.isDragging = false;
    };

    // ============================================================
    // KEYBOARD
    // ============================================================

    window.addEventListener(
        "keydown",
        async event => {
            const target =
                event.target;

            // Don't intercept shortcuts while
            // typing into an input.
            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement
            ) {
                return;
            }

            // DELETE
            if (
                event.key === "Delete" &&
                state.selected &&
                isEditableMesh(
                    state.selected
                )
            ) {
                event.preventDefault();

                const mesh =
                    state.selected;

                clearAllHandles();

                gizmoManager.attachToMesh(
                    null
                );

                mesh.dispose();

                state.selected = null;
                state.baseMeshClone = null;

                updateUI();

                return;
            }

            if (
                !state.selected ||
                !isEditableMesh(
                    state.selected
                )
            ) {
                return;
            }

            // CTRL + D
            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "d"
            ) {
                event.preventDefault();

                const clone =
                    state.selected.clone(
                        `${state.selected.name}_copy`,
                        null
                    );

                if (!clone) {
                    return;
                }

                clone.position.x +=
                    state.snap.position;

                clone.isPickable = true;

                ensureMetadata(clone)._isBaked =
                    true;

                selectMesh(clone);

                return;
            }

            // CTRL + C
            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "c"
            ) {
                event.preventDefault();

                if (state._clipboard) {
                    state._clipboard.dispose();
                }

                state._clipboard =
                    state.selected.clone(
                        "clipboard",
                        null
                    );

                if (state._clipboard) {
                    state._clipboard.setEnabled(
                        false
                    );

                    state._clipboard.isPickable =
                        false;
                }

                return;
            }

            // CTRL + V
            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "v"
            ) {
                event.preventDefault();

                if (!state._clipboard) {
                    return;
                }

                const pasted =
                    state._clipboard.clone(
                        `${state.selected.name}_pasted`,
                        null
                    );

                if (!pasted) {
                    return;
                }

                pasted.setEnabled(true);
                pasted.isPickable = true;

                pasted.position.x +=
                    state.snap.position;

                ensureMetadata(pasted)._isBaked =
                    true;

                selectMesh(pasted);

                return;
            }

            // CTRL + G
            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "g"
            ) {
                event.preventDefault();

                const group =
                    new BABYLON.TransformNode(
                        `Group_${BABYLON.Tools.RandomId()}`,
                        scene
                    );

                group.position.copyFrom(
                    state.selected.position
                );

                state.selected.parent =
                    group;

                state.selected =
                    group;

                updateUI();
            }
        }
    );

    // ============================================================
    // INITIAL STATE
    // ============================================================

    setGizmoMode({
        move: false,
        rotate: false,
        scale: false
    });

    updateUI();

    // Explicitly return useful editor state/API.
    return {
        state,

        selectMesh,
        deselect,

        setMode,

        createTriangle,
        createQuad,

        serializeSceneForSave,
        loadSavedScene,

        subdivideMesh,

        convertToEditable,

        clearAllHandles
    };
}