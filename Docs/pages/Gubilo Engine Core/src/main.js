//min.js

const canvas2d = document.getElementById("twod");
const canvas3d = document.getElementById("threed");
const hud = document.getElementById("fps");

// ============================================================
// CANVAS RESOLUTION
// ============================================================

function fixCanvasResolution(scene = null) {
    const dpr = window.devicePixelRatio || 1;

    const width = Math.floor(canvas3d.clientWidth * dpr);
    const height = Math.floor(canvas3d.clientHeight * dpr);

    if (width <= 0 || height <= 0)
        return;

    if (
        canvas3d.width !== width ||
        canvas3d.height !== height
    ) {
        canvas3d.width = width;
        canvas3d.height = height;

        if (scene) {
            scene.resize();
        }
    }
}


function fixCanvas2DResolution() {
    const dpr = window.devicePixelRatio || 1;

    const width = Math.floor(canvas2d.clientWidth * dpr);
    const height = Math.floor(canvas2d.clientHeight * dpr);

    if (width <= 0 || height <= 0)
        return;

    if (
        canvas2d.width !== width ||
        canvas2d.height !== height
    ) {
        canvas2d.width = width;
        canvas2d.height = height;
    }
}


// Initial resolution
fixCanvas2DResolution();
fixCanvasResolution();


// ============================================================
// FPS
// ============================================================

function updateFPS(fps) {
    if (!hud)
        return;

    hud.textContent = `FPS: ${Math.round(fps || 0)}`;
}


// ============================================================
// INPUT
// ============================================================

// ============================================================
// INPUT
// ============================================================

const keys = Object.create(null);


// ============================================================
// KEYBOARD INPUT
// ============================================================

function initKeys() {

    document.addEventListener("keydown", (e) => {

        // Don't let the engine consume keyboard input
        // while typing inside the code editor.
        const target = e.target;

        if (
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLInputElement
        ) {
            return;
        }

        keys[e.code] = true;

        if (
            e.code === "ArrowUp" ||
            e.code === "ArrowDown" ||
            e.code === "ArrowLeft" ||
            e.code === "ArrowRight" ||
            e.code === "Space"
        ) {
            e.preventDefault();
        }
    });


    document.addEventListener("keyup", (e) => {

        keys[e.code] = false;

    });


    // Prevent stuck keys if the browser loses focus.
    window.addEventListener("blur", () => {

        for (const key in keys) {
            keys[key] = false;
        }

    });
}



// ============================================================
// TOUCH INPUT
// ============================================================
//
// The mobile buttons temporarily act like keyboard keys.
//
// This means your existing camera code:
//
//     keys["ArrowLeft"]
//     keys["ArrowRight"]
//     keys["ArrowUp"]
//     keys["ArrowDown"]
//     keys["KeyW"]
//     keys["KeyS"]
//
// continues to work without changing the camera system.
// ============================================================

function bindTouchButton(id, key) {

    const button = document.getElementById(id);

    if (!button) return;


    button.addEventListener("pointerdown", (event) => {

        event.preventDefault();

        keys[key] = true;

        button.setPointerCapture(event.pointerId);

    });


    button.addEventListener("pointerup", (event) => {

        event.preventDefault();

        keys[key] = false;

        if (button.hasPointerCapture(event.pointerId)) {
            button.releasePointerCapture(event.pointerId);
        }

    });


    button.addEventListener("pointercancel", (event) => {

        keys[key] = false;

    });


    button.addEventListener("lostpointercapture", () => {

        keys[key] = false;

    });


    button.addEventListener("contextmenu", (event) => {

        event.preventDefault();

    });

}


// ============================================================
// MOBILE CAMERA BUTTONS
// ============================================================

bindTouchButton(
    "touchUp",
    "ArrowUp"
);

bindTouchButton(
    "touchDown",
    "ArrowDown"
);

bindTouchButton(
    "touchLeft",
    "ArrowLeft"
);

bindTouchButton(
    "touchRight",
    "ArrowRight"
);


// ============================================================
// MOBILE ZOOM BUTTONS
// ============================================================
//
// These use W/S because your 3D camera already uses:
//
// W = zoom in
// S = zoom out
//
// They also work with the existing 3D camera code.
// ============================================================

bindTouchButton(
    "touchZoomIn",
    "KeyW"
);

bindTouchButton(
    "touchZoomOut",
    "KeyS"
);

initKeys();


// ============================================================
// 2D ENGINE
// ============================================================

const engine2d = new GUBILO.Engine(
    canvas2d,
    "Auto",
    "2D"
);


engine2d.ready.then(async () => {
    console.log("2D Engine is ready.");

    await ready2D();
});


async function ready2D() {

    const scene = new GUBILO.Scene(engine2d);

    await scene.ready;

    Scene.current = scene;

    console.log("2D Scene is ready.");
    // --------------------------------------------------------
    // Objects
    // --------------------------------------------------------

    const circle = new GUBILO.ShapeCreator.Circle(
        "ball",
        0,
        0,
        0.4,
        new GUBILO.Color4(
            0.2,
            0.8,
            0.3,
            1
        )
    );


    const tri = new GUBILO.ShapeCreator.Triangle(
        "triangle"
    );


    const square = new GUBILO.ShapeCreator.Square(
        "Square"
    );


    // --------------------------------------------------------
    // Camera
    // --------------------------------------------------------

    const cam = new GUBILO.Camera2D(
        "cam",
        0,
        0,
        1
    );

    cam.speed = 1;

    // --------------------------------------------------------
    // Animation
    // --------------------------------------------------------

    let angle = 0;


    engine2d.runRenderLoop(() => {

        const dt = engine2d._deltaTime;

        angle += 1 * dt;


        // ----------------------------------------------------
        // Square
        // ----------------------------------------------------

        square.setIdentity();

        square.translate(
            0.0,
            0.0
        );

        square.rotate(angle);

        square.scale(
            0.5,
            0.5
        );


        // ----------------------------------------------------
        // Triangle
        // ----------------------------------------------------

        tri.setIdentity();

        tri.translate(
            0.0,
            0.0
        );

        tri.rotate(-angle);

        tri.scale(
            -1.5,
            0.5
        );


        // ----------------------------------------------------
        // Circle
        // ----------------------------------------------------

        circle.setIdentity();

        circle.rotate(angle);

        circle.scale(
            1.2,
            1.2
        );


        // ----------------------------------------------------
        // Camera input
        // ----------------------------------------------------

        handleKeys2D(cam, dt);
    });
}


// ============================================================
// 2D CAMERA INPUT
// ============================================================

function handleKeys2D(cam, dt) {
    const speed = 1 * dt;

    if (keys["KeyW"]) {
        cam.move(0, speed);
    }

    if (keys["KeyS"]) {
        cam.move(0, -speed);
    }

    if (keys["KeyA"]) {
        cam.move(-speed, 0);
    }

    if (keys["KeyD"]) {
        cam.move(speed, 0);
    }

    if (keys["KeyQ"]) {
        cam.zoomBy(-cam.speed * dt);
    }

    if (keys["KeyE"]) {
        cam.zoomBy(cam.speed * dt);
    }
}


// ============================================================
// 3D ENGINE
// ============================================================

const engine3d = new GUBILO.Engine(
    canvas3d,
    "Auto",
    "3D"
);


engine3d.ready.then(async () => {

    console.log("3D Engine is ready.");

    await ready3D();
});


// ============================================================
// 3D SCENE
// ============================================================
async function ready3D() {

    const scene = new GUBILO.Scene(engine3d);

    await scene.ready;

    Scene.current = scene;
    GUBILO.Noise.init();

    console.log("3D Scene is ready.");

    // --------------------------------------------------------
    // Resize
    // --------------------------------------------------------

    window.addEventListener("resize", () => {
        fixCanvasResolution(scene);
    });

    // Make sure resolution is correct now.
    fixCanvasResolution(scene);


    // --------------------------------------------------------
    // Camera
    // --------------------------------------------------------

    const cam = new GUBILO.ArcRotateCamera(
        "Camera",
        Math.PI / 2,
        0.03,
        4,
        new GUBILO.Vector3(0, -0.2, 0)
    );


    // Scene.setActiveCamera() is already called
    // by the Camera constructor, but this is harmless
    // and explicit.
    scene.setActiveCamera(cam);


    // Make camera available in console.
    window.cam = cam;


    // --------------------------------------------------------
    // Cubes
    // --------------------------------------------------------

    const cube = new GUBILO.MeshCreator.Cube(
        "cube",
        -2,
        0,
        0,
        1,
        {
            red: 0.2,
            green: 0.3,
            blue: 0.8,
            alpha: 1
        }
    );


    const cube2 = new GUBILO.MeshCreator.Cube(
        "cube2",
        0,
        0,
        0,
        1,
        {
            red: 0.2,
            green: 0.8,
            blue: 0.3,
            alpha: 1
        }
    );


    const cube3 = new GUBILO.MeshCreator.Cube(
        "cube3",
        2,
        0,
        0,
        1,
        {
            red: 0.8,
            green: 0.3,
            blue: 0.2,
            alpha: 1
        }
    );


    // --------------------------------------------------------
    // Ground
    // --------------------------------------------------------
    const subdivisions =
        window.innerWidth <= 700
            ? 80
            : 200;


    const ground = new GUBILO.MeshCreator.Plane(
        "ground",

        0,
        -0.2,
        0,

        8,

        subdivisions,

        {
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }
    );

    window.scene3D = scene;
    window.cube = cube;
    window.cube2 = cube2;
    window.cube3 = cube3;
    window.ground = ground;
    window.cam = cam;

    console.log(
        "Meshes:",
        scene.meshes.length
    );


    console.log(
        "Ground vertices:",
        ground.vertexCount
    );


    // --------------------------------------------------------
    // Animation
    // --------------------------------------------------------

    let i = 0;


    engine3d.runRenderLoop(() => {
        //if (!engine3d._deltaTime) return;
        const dt = engine3d._deltaTime;

        const rotationSpeed = 0.6; // radians per second

        cube.rotation.x += rotationSpeed * dt;
        cube2.rotation.y += rotationSpeed * dt;
        cube3.rotation.z += rotationSpeed * dt;

        updatePlane(ground, dt);

        handleKeys3D(cam, 1, dt);

        updateFPS(engine3d._fps);
    });
}


// ============================================================
// 3D CAMERA INPUT
// ============================================================

function handleKeys3D(cam, speed, dt) {

    if (keys["ArrowRight"]) {
        cam.alpha -= speed * dt;
    }

    if (keys["ArrowLeft"]) {
        cam.alpha += speed * dt;
    }

    if (keys["ArrowUp"]) {
        cam.beta += speed * dt;
    }

    if (keys["ArrowDown"]) {
        cam.beta -= speed * dt;
    }

    if (keys["KeyW"]) {
        cam.radius -= speed * dt;
    }

    if (keys["KeyS"]) {
        cam.radius += speed * dt;
    }
}

    // --------------------------------------------------------
    // Height function
    // --------------------------------------------------------

function getHeight(x, z, t) {

    const waveLarge =
        GUBILO.Noise.simplex2D(
            x * 1.2 + t * 0.45,
            z * 1.2 + t * 0.27
        );

    const waveMedium =
        GUBILO.Noise.simplex2D(
            x * 2.8 - t * 0.65,
            z * 2.8 + t * 0.45
        );

    const waveSmall =
        GUBILO.Noise.simplex2D(
            x * 7.0 + t * 1.0,
            z * 7.0 - t * 0.75
        );

    return (
        waveLarge * 0.16 +
        waveMedium * 0.055 +
        waveSmall * 0.046
    ) * 0.25;
}

// ============================================================
// PLANE ANIMATION
// ============================================================

let waveTime = 0;

function updatePlane(ground, dt) {
    const stride = 10;

    const speed = 0.6;
    const amplitude = 0.25;

    waveTime += speed * dt;

    const t = waveTime;

    // --------------------------------------------------------
    // Grid
    // --------------------------------------------------------
    const vertexCount = ground.vertexCount;

    const subdivisions =
        window.innerWidth <= 700
            ? 80
            : 200;

    const gridSize = subdivisions + 1;

    const spacing = 8 / subdivisions;


    // ========================================================
    // PASS 1
    // Heights + colors
    // ========================================================

    for (let i = 0; i < vertexCount; i++) {

        const offset = i * stride;

        const x = ground.vertices[offset];
        const z = ground.vertices[offset + 2];

        const h = getHeight(x, z, t);

        ground.vertices[offset + 1] = h;

        const col = gradientColor(h * 7);

        ground.vertices[offset + 6] = col.r;
        ground.vertices[offset + 7] = col.g;
        ground.vertices[offset + 8] = col.b;
        ground.vertices[offset + 9] = col.a;
    }


    // ========================================================
    // PASS 2
    //
    // Fast smooth normals using neighboring heights.
    //
    // No index traversal.
    // No face normal calculations.
    // No accumulation.
    // ========================================================

    for (let row = 0; row < gridSize; row++) {

        const rowStart = row * gridSize;

        const prevRow =
            row > 0
                ? row - 1
                : row;

        const nextRow =
            row < gridSize - 1
                ? row + 1
                : row;

        for (let col = 0; col < gridSize; col++) {

            const index =
                rowStart + col;

            const offset =
                index * stride;


            // --------------------------------------------
            // Neighbor columns
            // --------------------------------------------

            const leftCol =
                col > 0
                    ? col - 1
                    : col;

            const rightCol =
                col < gridSize - 1
                    ? col + 1
                    : col;


            const leftOffset =
                (rowStart + leftCol) * stride;

            const rightOffset =
                (rowStart + rightCol) * stride;


            // --------------------------------------------
            // Neighbor rows
            // --------------------------------------------

            const downOffset =
                (prevRow * gridSize + col) * stride;

            const upOffset =
                (nextRow * gridSize + col) * stride;


            const hLeft =
                ground.vertices[leftOffset + 1];

            const hRight =
                ground.vertices[rightOffset + 1];

            const hDown =
                ground.vertices[downOffset + 1];

            const hUp =
                ground.vertices[upOffset + 1];


            // --------------------------------------------
            // Height gradients
            // --------------------------------------------

            const dx =
                (hRight - hLeft) /
                (2 * spacing);

            const dz =
                (hUp - hDown) /
                (2 * spacing);


            // --------------------------------------------
            // Surface normal
            // --------------------------------------------

            let nx = -dx;
            let ny = 1;
            let nz = -dz;


            const len =
                Math.sqrt(
                    nx * nx +
                    ny * ny +
                    nz * nz
                );


            if (len > 0.000001) {

                const invLen = 1 / len;

                nx *= invLen;
                ny *= invLen;
                nz *= invLen;
            }


            ground.vertices[offset + 3] = nx;
            ground.vertices[offset + 4] = ny;
            ground.vertices[offset + 5] = nz;
        }
    }


    // ========================================================
    // Tell GUBILO the CPU data changed
    // ========================================================

    ground.verticesDirty = true;
}
// ============================================================
// TEXT EDITOR
// ============================================================

const editor = document.getElementById("editor");
const editorButton = document.getElementById("btn");
const closeEditor = document.getElementById("closeEditor");

console.log("Editor:", editor);
console.log("Editor button:", editorButton);
console.log("Close button:", closeEditor);


// ============================================================
// OPEN EDITOR
// ============================================================

if (editorButton && editor) {

    editorButton.addEventListener("click", () => {

        console.log("Opening editor");

        editor.classList.add("open");

    });

}


// ============================================================
// CLOSE EDITOR
// ============================================================

if (closeEditor && editor) {

    closeEditor.addEventListener("click", () => {

        console.log("Closing editor");

        editor.classList.remove("open");

    });

}


// ============================================================
// ESCAPE TO CLOSE
// ============================================================

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape" && editor) {

        editor.classList.remove("open");

    }

});

// ============================================================
// CODE EDITOR
// ============================================================

const codeEditor = document.getElementById("codeEditor");

const tab2d = document.getElementById("tab2d");
const tab3d = document.getElementById("tab3d");

const runCode = document.getElementById("runCode");
const resetCode = document.getElementById("resetCode");

const editorStatus = document.getElementById("editorStatus");


// ============================================================
// DEFAULT CODE
// ============================================================

const defaultCode2D = `// GUBILO 2D

console.log("2D code running");

`;

const defaultCode3D = `// GUBILO 3D

console.log("3D code running");

`;

let currentTab = "2d";

let code2D = defaultCode2D;
let code3D = defaultCode3D;


// ============================================================
// LOAD CODE
// ============================================================

function loadEditorCode() {

    if (!codeEditor)
        return;

    if (currentTab === "2d") {
        codeEditor.value = code2D;
    } else {
        codeEditor.value = code3D;
    }

}


// ============================================================
// SAVE CURRENT CODE
// ============================================================

function saveEditorCode() {

    if (!codeEditor)
        return;

    if (currentTab === "2d") {
        code2D = codeEditor.value;
    } else {
        code3D = codeEditor.value;
    }

}


// ============================================================
// EDITOR STATUS
// ============================================================

function setEditorStatus(message, type = "") {

    if (!editorStatus)
        return;

    editorStatus.textContent = message;

    editorStatus.classList.remove(
        "success",
        "error"
    );

    if (type) {
        editorStatus.classList.add(type);
    }

}


// ============================================================
// 2D TAB
// ============================================================

if (tab2d) {

    tab2d.addEventListener("click", () => {

        saveEditorCode();

        currentTab = "2d";

        tab2d.classList.add("active");

        if (tab3d) {
            tab3d.classList.remove("active");
        }

        loadEditorCode();

        setEditorStatus("2D");

    });

}


// ============================================================
// 3D TAB
// ============================================================

if (tab3d) {

    tab3d.addEventListener("click", () => {

        saveEditorCode();

        currentTab = "3d";

        tab3d.classList.add("active");

        if (tab2d) {
            tab2d.classList.remove("active");
        }

        loadEditorCode();

        setEditorStatus("3D");

    });

}


// ============================================================
// RUN
// ============================================================

if (runCode) {

    runCode.addEventListener("click", () => {

        saveEditorCode();

        try {

            setEditorStatus(
                "Running...",
                ""
            );


            const code =
                currentTab === "2d"
                    ? code2D
                    : code3D;


            // Run the code.
            //
            // This gives the editor access to
            // your existing global GUBILO objects.

            const result = Function(code)();


            console.log(
                `GUBILO ${currentTab.toUpperCase()} editor result:`,
                result
            );


            setEditorStatus(
                "Code ran successfully",
                "success"
            );

        } catch (error) {

            console.error(
                "Editor error:",
                error
            );


            setEditorStatus(
                "Error: " + error.message,
                "error"
            );

        }

    });

}


// ============================================================
// RESET
// ============================================================

if (resetCode) {

    resetCode.addEventListener("click", () => {

        if (currentTab === "2d") {

            code2D = defaultCode2D;

        } else {

            code3D = defaultCode3D;

        }

        loadEditorCode();

        setEditorStatus(
            "Reset",
            "success"
        );

    });

}


// ============================================================
// INITIAL CODE
// ============================================================

loadEditorCode();