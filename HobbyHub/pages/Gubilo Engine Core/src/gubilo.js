console.log("GUBILO BUILD:", "2026-08-15-debug-1");

window.GUBILO = window.GUBILO || {};

// ============================================================
// 2D SIMPLEX NOISE
// ============================================================


function gradientColor(h) {

    // Keep h safely in [0, 1]
    h = Math.max(0, Math.min(1, h));
    const a = 0.7;

    if (h < 0.25) {

        return lerpColor(
            new Color4(0.02, 0.25, 0.55, a),   // blue
            new Color4(0.00, 0.55, 0.80, a),   // aqua
            h / 0.25
        );

    } else if (h < 0.5) {

        return lerpColor(
            new Color4(0.00, 0.55, 0.80, a),
            new Color4(0.00, 0.78, 0.88, a),   // bright cyan
            (h - 0.25) / 0.25
        );

    } else if (h < 0.75) {

        return lerpColor(
            new Color4(0.00, 0.78, 0.88, a),
            new Color4(0.15, 0.90, 0.92, a),   // turquoise
            (h - 0.5) / 0.25
        );

    } else {

        return lerpColor(
            new Color4(0.15, 0.90, 0.92, a),
            new Color4(0.65, 1.00, 1.00, a),   // pale aqua
            (h - 0.75) / 0.25
        );
    }
}

function lerpColor(a, b, t) {
    return new Color4(
        a.r + (b.r - a.r) * t,
        a.g + (b.g - a.g) * t,
        a.b + (b.b - a.b) * t,
        a.a + (b.a - a.a) * t
    );
}

function dot(a, b) {
        if (a.length !== b.length) {
            console.error("Vectors must be the same length");
            return;
        }

        let sum = 0;

        for(let i = 0; i < a.length; i++) {
            sum += a[i] * b[i]
        }

        return sum;
}

function computeNormal(a, b, c) {
    const U = new Vector3(
        b.x - a.x,
        b.y - a.y,
        b.z - a.z
    );

    const V = new Vector3(
        c.x - a.x,
        c.y - a.y,
        c.z - a.z
    );

    const N = new Vector3(
        U.y * V.z - U.z * V.y,
        U.z * V.x - U.x * V.z,
        U.x * V.y - U.y * V.x
    );

    // normalize
    const len = Math.sqrt(N.x*N.x + N.y*N.y + N.z*N.z);

    if(len===0)
        return new Vector3(0,0,1);

    N.x /= len;
    N.y /= len;
    N.z /= len;


    return N;
}

class Noise {

    static F2 = 0.3660254037844386;
    static G2 = 0.21132486540518713;

    // 256 precomputed gradient directions
    static gradients = new Float32Array(256 * 2);

    static initialized = false;

    static init() {
        if (Noise.initialized) return;

        for (let i = 0; i < 256; i++) {
            const angle =
                (i / 256) * Math.PI * 2.0;

            Noise.gradients[i * 2] =
                Math.cos(angle);

            Noise.gradients[i * 2 + 1] =
                Math.sin(angle);
        }

        Noise.initialized = true;
    }

    static simplexHash(x, y) {
        let h =
            Math.imul(x, 374761393) ^
            Math.imul(y, 668265263);

        h = Math.imul(
            h ^ (h >>> 13),
            1274126177
        );

        return h ^ (h >>> 16);
    }

    static simplex2D(x, y) {

        const F2 = Noise.F2;

        const G2 = Noise.G2;

        const s =
            (x + y) * F2;

        const i =
            Math.floor(x + s);

        const j =
            Math.floor(y + s);

        const t =
            (i + j) * G2;

        const X0 =
            i - t;

        const Y0 =
            j - t;

        const x0 =
            x - X0;

        const y0 =
            y - Y0;

        let i1;
        let j1;

        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }

        const x1 =
            x0 - i1 + G2;

        const y1 =
            y0 - j1 + G2;

        const x2 =
            x0 - 1.0 + 2.0 * G2;

        const y2 =
            y0 - 1.0 + 2.0 * G2;


        // -------------------------
        // Corner 0
        // -------------------------

        let attenuation =
            0.5 -
            x0 * x0 -
            y0 * y0;

        let n0 = 0;

        if (attenuation > 0) {

            const hash =
                Noise.simplexHash(i, j);

            const index =
                (hash & 255) << 1;

            const gx =
                Noise.gradients[index];

            const gy =
                Noise.gradients[index + 1];

            const dot =
                gx * x0 +
                gy * y0;

            attenuation *= attenuation;

            n0 =
                attenuation *
                attenuation *
                dot;
        }


        // -------------------------
        // Corner 1
        // -------------------------

        attenuation =
            0.5 -
            x1 * x1 -
            y1 * y1;

        let n1 = 0;

        if (attenuation > 0) {

            const hash =
                Noise.simplexHash(
                    i + i1,
                    j + j1
                );

            const index =
                (hash & 255) << 1;

            const gx =
                Noise.gradients[index];

            const gy =
                Noise.gradients[index + 1];

            const dot =
                gx * x1 +
                gy * y1;

            attenuation *= attenuation;

            n1 =
                attenuation *
                attenuation *
                dot;
        }


        // -------------------------
        // Corner 2
        // -------------------------

        attenuation =
            0.5 -
            x2 * x2 -
            y2 * y2;

        let n2 = 0;

        if (attenuation > 0) {

            const hash =
                Noise.simplexHash(
                    i + 1,
                    j + 1
                );

            const index =
                (hash & 255) << 1;

            const gx =
                Noise.gradients[index];

            const gy =
                Noise.gradients[index + 1];

            const dot =
                gx * x2 +
                gy * y2;

            attenuation *= attenuation;

            n2 =
                attenuation *
                attenuation *
                dot;
        }

        return 70.0 *
            (n0 + n1 + n2);
    }
}


class Vector2 extends Float32Array {
    constructor(x = 0, y = 0) {
        super(2);
        this[0] = x;
        this[1] = y;
    }

    get x() { return this[0]; }
    set x(v) { this[0] = v; }

    get y() { return this[1]; }
    set y(v) { this[1] = v; }
}

class Vector3 extends Float32Array {
    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    get x() { return this[0]; }
    set x(v) { this[0] = v; }

    get y() { return this[1]; }
    set y(v) { this[1] = v; }

    get z() { return this[2]; }
    set z(v) { this[2] = v; }
}

class Vector4 extends Float32Array {
    constructor(x = 0, y = 0, z = 0, w = 0) {
        super(4);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
    }

    get x() { return this[0]; }
    set x(v) { this[0] = v; }

    get y() { return this[1]; }
    set y(v) { this[1] = v; }

    get z() { return this[2]; }
    set z(v) { this[2] = v; }

    get w() { return this[3]; }
    set w(v) { this[3] = v; }
}

class Color4 extends Float32Array {
    constructor(r = 1, g = 1, b = 1, a = 1) {
        super(4);
        this[0] = r;
        this[1] = g;
        this[2] = b;
        this[3] = a;
    }

    get r() { return this[0]; }
    set r(v) { this[0] = v; }

    get g() { return this[1]; }
    set g(v) { this[1] = v; }

    get b() { return this[2]; }
    set b(v) { this[2] = v; }

    get a() { return this[3]; }
    set a(v) { this[3] = v; }
}

class Matrix4 extends Float32Array {
    constructor() {
        super(16);
        this.identity();
    }

    identity() {
        this.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ])
        
        return this;
    }

    multiply(other) {
        if (!other || other.length !== 16) return this;

        const a = this;
        const b = other;

        const result = new Float32Array(16);

        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                result[col * 4 + row] =
                    a[0 * 4 + row] * b[col * 4 + 0] +
                    a[1 * 4 + row] * b[col * 4 + 1] +
                    a[2 * 4 + row] * b[col * 4 + 2] +
                    a[3 * 4 + row] * b[col * 4 + 3];
            }
        }

        this.set(result);
        return this;
    }

    static translation(x, y, z) {
        let m = new Matrix4();
        m[12] = x;
        m[13] = y;
        m[14] = z;

        return m;
    }

    translate(x, y, z) {
        return this.multiply(Matrix4.translation(x, y, z));
    }

    static scaling(x, y, z) {
        const m = new Matrix4();

        m[0] = x;
        m[5] = y;
        m[10] = z;

        return m;
    }

    scale(x, y, z) {
        return this.multiply(Matrix4.scaling(x, y, z));
    }

    scaleLinearly(scaleFactor) {
        this.scale(scaleFactor, scaleFactor, scaleFactor);
        return this;
    }

    static rotationX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const m = new Matrix4();

        m[5] = c;
        m[6] = s;
        m[9] = -s;
        m[10] = c;

        return m;
    }

    static rotationY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const m = new Matrix4();

        m[0] = c;
        m[2] = -s;
        m[8] = s;
        m[10] = c;

        return m;
    }

    static rotationZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const m = new Matrix4();

        m[0] = c;
        m[1] = s;
        m[4] = -s;
        m[5] = c;

        return m;
    }

    rotateX(angle) {
        return this.multiply(Matrix4.rotationX(angle));
    }

    rotateY(angle) {
        return this.multiply(Matrix4.rotationY(angle));
    }

    rotateZ(angle) {
        return this.multiply(Matrix4.rotationZ(angle));
    }

static perspective(fov, aspect, near, far) {

    const f = 1 / Math.tan(fov / 2);

    const m = new Matrix4();

    m[0] = f / aspect;
    m[5] = f;

    // WebGPU depth range: 0..1
    m[10] = far / (near - far);
    m[11] = -1;

    m[14] = (far * near) / (near - far);
    m[15] = 0;

    return m;
}
    static lookAt(eye, target, up) {
        const z = new Vector3(
            eye.x - target.x,
            eye.y - target.y,
            eye.z - target.z
        );

        // normalize z
        let len = Math.sqrt(z.x*z.x + z.y*z.y + z.z*z.z);
        z.x /= len;
        z.y /= len;
        z.z /= len;


        // x = up × z
        const x = new Vector3(
            up.y * z.z - up.z * z.y,
            up.z * z.x - up.x * z.z,
            up.x * z.y - up.y * z.x
        );

        len = Math.sqrt(x.x*x.x + x.y*x.y + x.z*x.z);
        x.x /= len;
        x.y /= len;
        x.z /= len;


        // y = z × x
        const y = new Vector3(
            z.y * x.z - z.z * x.y,
            z.z * x.x - z.x * x.z,
            z.x * x.y - z.y * x.x
        );


        const m = new Matrix4();

        m.set([
            x.x, y.x, z.x, 0,
            x.y, y.y, z.y, 0,
            x.z, y.z, z.z, 0,
            -dot(x, eye),
            -dot(y, eye),
            -dot(z, eye),
            1
        ]);

        return m;
    }

    static viewProjection(view, projection) {
        const m = new Matrix4();
        m.set(projection);
        return m.multiply(view);
    }
}

class Engine {
    constructor(canvas, graphicsMethod = "WebGPU", dimension = "3D") {
        this.canvas = canvas;

        // Requested backend.
        // Examples:
        // "WebGPU"
        // "WebGL2"
        // "WebGL"
        // "Auto"
        this.requestedGraphicsMethod = graphicsMethod;

        // This becomes the backend that actually initialized.
        this.graphicsMethod = graphicsMethod;

        this.dimension = dimension.toLowerCase();

        this.scene = null;

        this._lastFrameTime = 0;
        this._fps = 1;
        this._deltaTime = 1 / 50;

        this.ready = this.initGraphics();
    }


    // ============================================================
    // GRAPHICS INITIALIZATION / FALLBACK
    // ============================================================

    async initGraphics() {

        let requested =
            String(this.requestedGraphicsMethod)
                .toLowerCase();


        // --------------------------------------------------------
        // AUTO
        // --------------------------------------------------------
        //
        // Try:
        // WebGPU
        // WebGL2
        // WebGL
        //
        if (requested === "auto") {

            if (await this.tryWebGPU()) {
                return;
            }

            if (this.tryWebGL2()) {
                return;
            }

            if (this.tryWebGL()) {
                return;
            }

            console.error(
                "GUBILO: No graphics backend could be initialized."
            );

            return;
        }


        // --------------------------------------------------------
        // WEBGPU
        // --------------------------------------------------------
        //
        // Requested WebGPU means:
        //
        // WebGPU
        //     ↓ fails
        // WebGL2
        //     ↓ fails
        // WebGL
        //
        if (requested === "webgpu") {

            if (await this.tryWebGPU()) {
                return;
            }

            console.warn(
                "GUBILO: WebGPU failed. Falling back to WebGL2..."
            );

            if (this.tryWebGL2()) {
                return;
            }

            console.warn(
                "GUBILO: WebGL2 failed. Falling back to WebGL..."
            );

            if (this.tryWebGL()) {
                return;
            }

            console.error(
                "GUBILO: WebGPU, WebGL2 and WebGL all failed."
            );

            return;
        }


        // --------------------------------------------------------
        // WEBGL2
        // --------------------------------------------------------
        //
        // Requested WebGL2 means:
        //
        // WebGL2
        //     ↓ fails
        // WebGL
        //
        if (requested === "webgl2") {

            if (this.tryWebGL2()) {
                return;
            }

            console.warn(
                "GUBILO: WebGL2 failed. Falling back to WebGL..."
            );

            if (this.tryWebGL()) {
                return;
            }

            console.error(
                "GUBILO: WebGL2 and WebGL both failed."
            );

            return;
        }


        // --------------------------------------------------------
        // WEBGL
        // --------------------------------------------------------

        if (requested === "webgl") {

            if (this.tryWebGL()) {
                return;
            }

            console.error(
                "GUBILO: WebGL failed."
            );

            return;
        }


        // --------------------------------------------------------
        // UNKNOWN BACKEND
        // --------------------------------------------------------

        console.warn(
            "GUBILO: Unknown graphics method:",
            this.requestedGraphicsMethod
        );

        console.warn(
            "GUBILO: Falling back to automatic selection..."
        );

        if (await this.tryWebGPU()) {
            return;
        }

        if (this.tryWebGL2()) {
            return;
        }

        if (this.tryWebGL()) {
            return;
        }

        console.error(
            "GUBILO: No graphics backend could be initialized."
        );
    }


    // ============================================================
    // TRY WEBGPU
    // ============================================================

    async tryWebGPU() {

        try {

            if (!("gpu" in navigator)) {

                console.warn(
                    "GUBILO: WebGPU is not available."
                );

                return false;
            }


            const adapter =
                await navigator.gpu.requestAdapter();

            if (!adapter) {

                console.warn(
                    "GUBILO: Failed to get WebGPU adapter."
                );

                return false;
            }


            const device =
                await adapter.requestDevice();

            if (!device) {

                console.warn(
                    "GUBILO: Failed to get WebGPU device."
                );

                return false;
            }


            const context =
                this.canvas.getContext("webgpu");

            if (!context) {

                console.warn(
                    "GUBILO: Failed to get WebGPU canvas context."
                );

                return false;
            }


            const presentationFormat =
                navigator.gpu.getPreferredCanvasFormat();


            context.configure({
                device,
                format: presentationFormat,
                alphaMode: "opaque"
            });


            // ----------------------------------------------------
            // Success
            // ----------------------------------------------------

            this.adapter = adapter;
            this.device = device;
            this.context = context;
            this.presentationFormat = presentationFormat;

            this.graphicsMethod = "WebGPU";


            console.log(
                "GUBILO: WebGPU initialized successfully."
            );

            console.log(
                "Adapter:",
                adapter
            );

            console.log(
                "Device:",
                device
            );

            console.log(
                "Format:",
                presentationFormat
            );


            return true;

        } catch (error) {

            console.warn(
                "GUBILO: WebGPU initialization failed:",
                error
            );

            // Make sure a failed WebGPU attempt doesn't
            // accidentally leave partial state behind.
            this.adapter = null;
            this.device = null;
            this.context = null;
            this.presentationFormat = null;

            return false;
        }
    }


    // ============================================================
    // TRY WEBGL2
    // ============================================================

    tryWebGL2() {

        try {

            console.log(
                "GUBILO: Trying WebGL2..."
            );


            const gl =
                this.canvas.getContext(
                    "webgl2",
                    {
                        alpha: false,
                        antialias: true,
                        depth: true
                    }
                );


            if (!gl) {

                console.warn(
                    "GUBILO: WebGL2 is not available."
                );

                return false;
            }


            gl.enable(
                gl.DEPTH_TEST
            );

            gl.depthFunc(
                gl.LESS
            );


            gl.enable(
                gl.BLEND
            );

            gl.blendFunc(
                gl.SRC_ALPHA,
                gl.ONE_MINUS_SRC_ALPHA
            );


            gl.viewport(
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );


            // ----------------------------------------------------
            // Success
            // ----------------------------------------------------

            this.gl = gl;

            this.graphicsMethod = "WebGL2";


            console.log(
                "GUBILO: WebGL2 initialized successfully."
            );


            return true;

        } catch (error) {

            console.warn(
                "GUBILO: WebGL2 initialization failed:",
                error
            );

            this.gl = null;

            return false;
        }
    }


    // ============================================================
    // TRY WEBGL
    // ============================================================

    tryWebGL() {

        try {

            console.log(
                "GUBILO: Trying WebGL..."
            );


            const gl =
                this.canvas.getContext(
                    "webgl",
                    {
                        alpha: false,
                        antialias: true,
                        depth: true
                    }
                );


            if (!gl) {

                console.warn(
                    "GUBILO: WebGL is not available."
                );

                return false;
            }


            gl.enable(
                gl.DEPTH_TEST
            );

            gl.depthFunc(
                gl.LESS
            );


            gl.enable(
                gl.BLEND
            );

            gl.blendFunc(
                gl.SRC_ALPHA,
                gl.ONE_MINUS_SRC_ALPHA
            );


            gl.viewport(
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );


            // WebGL 1 doesn't guarantee 32-bit
            // element indices.
            this.uint32IndexExtension =
                gl.getExtension(
                    "OES_element_index_uint"
                );


            // ----------------------------------------------------
            // Success
            // ----------------------------------------------------

            this.gl = gl;

            this.graphicsMethod = "WebGL";


            console.log(
                "GUBILO: WebGL initialized successfully."
            );


            return true;

        } catch (error) {

            console.warn(
                "GUBILO: WebGL initialization failed:",
                error
            );

            this.gl = null;

            return false;
        }
    }


    // ============================================================
    // FPS
    // ============================================================

    updateFPS() {

        const now = performance.now();

        if (!this._lastFrameTime) {
            this._lastFrameTime = now;
            return 0;
        }

        const delta =
            now - this._lastFrameTime;

        this._deltaTime =
            Math.min(delta, 100) / 1000;

        this._lastFrameTime = now;

        const fps =
            1000 / delta;

        this._fps =
            this._fps * 0.9 +
            fps * 0.1;

        return Math.round(
            this._fps
        );
    }


    getFPS() {
        return Math.round(
            this._fps
        );
    }


    // ============================================================
    // RENDER LOOP
    // ============================================================

    runRenderLoop(callback) {

        const loop = () => {

            this.updateFPS();

            callback();

            const scene =
                this.scene;

            if (scene) {

                if (this.dimension === "2d") {

                    for (const shape of scene.shapes) {

                        scene.updateShapeTransform(
                            shape
                        );
                    }
                }


                if (this.dimension === "3d") {

                    this.uploadDirtyMeshes();


                    for (const mesh of scene.meshes) {

                        mesh.updateMatrix();


                        if (
                            this.graphicsMethod === "WebGPU"
                        ) {

                            this.device.queue.writeBuffer(
                                mesh.transformBuffer,
                                0,
                                mesh.transform
                            );

                        } else {

                            scene.updateMeshTransform(
                                mesh
                            );
                        }
                    }
                }
            }


            if (scene) {

                if (this.dimension === "2d") {
                    scene.render2D();
                }

                if (this.dimension === "3d") {
                    scene.render3D();
                }
            }


            requestAnimationFrame(
                loop
            );
        };


        requestAnimationFrame(
            loop
        );
    }


    // ============================================================
    // DIRTY MESH UPLOADS
    // ============================================================

    uploadDirtyMeshes() {

        const scene =
            this.scene || Scene.current;

        if (!scene) {
            return;
        }


        if (
            this.graphicsMethod === "WebGPU"
        ) {

            if (!this.device) {
                return;
            }


            for (
                const mesh of scene.meshes
            ) {

                if (!mesh.verticesDirty) {
                    continue;
                }

                if (!mesh.vertexBuffer) {
                    continue;
                }


                const data =
                    new Float32Array(
                        mesh.vertices
                    );


                this.device.queue.writeBuffer(
                    mesh.vertexBuffer,
                    0,
                    data
                );


                mesh.verticesDirty = false;
            }


            return;
        }


        // --------------------------------------------------------
        // WebGL2 / WebGL
        // --------------------------------------------------------

        for (
            const mesh of scene.meshes
        ) {

            if (!mesh.verticesDirty) {
                continue;
            }

            if (!mesh.vertexBuffer) {
                continue;
            }


            const gl =
                this.gl;

            const data =
                new Float32Array(
                    mesh.vertices
                );


            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                mesh.vertexBuffer
            );

            gl.bufferSubData(
                gl.ARRAY_BUFFER,
                0,
                data
            );


            mesh.verticesDirty = false;
        }
    }
}

class ShapeCreator {
    constructor(x = 0, y = 0) {
        this.position = new Vector2(x, y);

        this.vertices = [];
        this.vertexCount = 0;
        this.color = new Color4(1, 1, 1, 1);

        this.vertexBuffer = null;
        this.colorBuffer = null;
        this.bindGroup = null;

        // 2D transform matrix (column-major): identity
        this.transform = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

    }

    setIdentity() {
        this.transform.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }


    translate(tx, ty) {
        this.transform[12] += tx;
        this.transform[13] += ty;
    }


    scale(sx, sy) {
        this.transform[0] *= sx;
        this.transform[5] *= sy;
    }

    rotate(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const m00 = this.transform[0];
        const m01 = this.transform[4];
        const m10 = this.transform[1];
        const m11 = this.transform[5];

        this.transform[0] = m00 * c + m01 * -s;
        this.transform[4] = m00 * s + m01 * c;

        this.transform[1] = m10 * c + m11 * -s;
        this.transform[5] = m10 * s + m11 * c;
    }
}

class Triangle extends ShapeCreator {
    constructor(
        name,
        p0 = new Vector2(0, 0.577),
        p1 = new Vector2(-0.5, -0.289),
        p2 = new Vector2(0.5, -0.289),
        color = new Color4(1, 1, 1, 1)
    ) {
        super(p0.x, p0.y);
        this.name = name;

        this.vertices = [p0, p1, p2];
        this.vertexCount = 3;
        this.color = color;

        if (Scene.current) Scene.current.add(this);
    }
}

class Square extends ShapeCreator {
    constructor(
        name,
        x = 0,
        y = 0,
        size = 0.5,
        color = new Color4(0.5, 0.5, 0.5, 1)
    ) {
        super(x, y);
        this.name = name;
        this.color = color;

        const h = size / 2;

        this.vertices = [
            new Vector2(x - h, y + h),
            new Vector2(x + h, y + h),
            new Vector2(x - h, y - h),
            
            new Vector2(x + h, y + h),
            new Vector2(x + h, y - h),
            new Vector2(x - h, y - h),
        ]

        this.vertexCount = 6;
        
        if (Scene.current) Scene.current.add(this);
    }
}

class Circle extends ShapeCreator {
    constructor(
        name,
        x = 0,
        y = 0,
        radius = 0.5,
        color = new Color4(1, 0, 0, 1)
    ) {
        super(x, y);
        this.name = name;
        this.color = color;

        const segments = 64; // smooth circle
        const verts = [];
        for (let i = 0; i < segments; i++) {
            const angle0 = (i / segments) * Math.PI * 2;
            const angle1 = ((i + 1) / segments) * Math.PI * 2;

            const x0 = x + Math.cos(angle0) * radius;
            const y0 = y + Math.sin(angle0) * radius;
            const x1 = x + Math.cos(angle1) * radius;
            const y1 = y + Math.sin(angle1) * radius;

            // Each triangle: center → v0 → v1
            verts.push(new Vector2(x, y));
            verts.push(new Vector2(x0, y0));
            verts.push(new Vector2(x1, y1));
        }
        this.vertices = verts;
        this.vertexCount = verts.length;


        if (Scene.current) Scene.current.add(this);
    }
}

class MeshCreator {
    constructor(x = 0, y = 0, z = 0) {
        this.engine = Scene.current.engine;
        this.position = new Vector3(x, y, z);

        this.rotation = new Vector3(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);

        this.transform = new Matrix4();

        this.vertices = [];
        this.vertexCount = 0;
        this.color = new Color4(1, 1, 1, 1);

        this.vertexBuffer = null;
        this.colorBuffer = null;
        this.bindGroup = null;

        this.verticesDirty = false;
    }

    translate(tx, ty, tz) {
        this.position.x += tx;
        this.position.y += ty;
        this.position.z += tz;
        return this;
    }

    updateMatrix() {
        this.transform.identity();

        this.transform
            .translate(
                this.position.x,
                this.position.y,
                this.position.z
            )
            .rotateX(this.rotation.x)
            .rotateY(this.rotation.y)
            .rotateZ(this.rotation.z)
            .scale(
                this.scale.x,
                this.scale.y,
                this.scale.z
            );

        return this.transform;
    }

    updateVertex(index, value) {
        this.vertices[index] = value;
        this.verticesDirty = true;
    }

    updateVertices() {
        this.verticesDirty = true;
    }

    setHeight(vertexIndex, height) {
        const stride = 10;
        const offset = vertexIndex * stride;

        this.vertices[offset + 1] = height;
        this.verticesDirty = true;
    }

setVertices(array) {
    const mesh = this;

    this.vertices = new Proxy(Array.from(array), {
        set(target, prop, value) {
            target[prop] = value;
            mesh.verticesDirty = true;
            return true;
        }
    });
}
}

class Plane extends MeshCreator {

    constructor(
        name,
        x,
        y,
        z,
        size,
        subdivisions,
        color = new Color4(1, 1, 1, 1)
    ) {

        super(x, y, z);

        this.name = name;

        this.color = color;

        const vertsPerSide = subdivisions + 1;
        const half = size / 2;
        const step = size / subdivisions;

        this.vertices = [];
        this.indices = [];

        // ================================================
        // SHARED VERTICES
        // ================================================

        for (let iz = 0; iz < vertsPerSide; iz++) {

            const zPos = -half + iz * step;

            for (let ix = 0; ix < vertsPerSide; ix++) {

                const xPos = -half + ix * step;

                this.vertices.push(
                    // position
                    xPos,
                    0,
                    zPos,

                    // normal
                    0,
                    1,
                    0,

                    // color
                    color.r,
                    color.g,
                    color.b,
                    color.a
                );
            }
        }


        // ================================================
        // INDEX BUFFER
        // ================================================

        for (let iz = 0; iz < subdivisions; iz++) {

            for (let ix = 0; ix < subdivisions; ix++) {

                const a =
                    iz * vertsPerSide + ix;

                const b =
                    a + 1;

                const c =
                    a + vertsPerSide;

                const d =
                    c + 1;


                // Winding gives +Y normal
                this.indices.push(
                    a, c, b,
                    b, c, d
                );
            }
        }


        this.vertexCount =
            this.vertices.length / 10;

        this.indexCount =
            this.indices.length;

        this.verticesDirty = true;
        this.indicesDirty = true;


        // Register normally
        if (Scene.current) {
            Scene.current.add(this);
        }
    }
}

class Cube extends MeshCreator {
    constructor(name, x = 0, y = 0, z = 0, size = 1, {
        red = 0.2,
        green = 0.3,
        blue = 0.8,
        alpha = 1
    } = {} ) {
        super(x, y, z);

        const h = size / 2;

        this.color = new Color4(red, green, blue, alpha);

        const positions = [
            // Front (+Z)
            [-h,-h, h], [ h,-h, h], [ h, h, h],
            [-h,-h, h], [ h, h, h], [-h, h, h],

            // Back (-Z)
            [ h,-h,-h], [-h,-h,-h], [-h, h,-h],
            [ h,-h,-h], [-h, h,-h], [ h, h,-h],

            // Left (-X)
            [-h,-h,-h], [-h,-h, h], [-h, h, h],
            [-h,-h,-h], [-h, h, h], [-h, h,-h],

            // Right (+X)
            [ h,-h, h], [ h,-h,-h], [ h, h,-h],
            [ h,-h, h], [ h, h,-h], [ h, h, h],

            // Top (+Y)
            [-h, h, h], [ h, h, h], [ h, h,-h],
            [-h, h, h], [ h, h,-h], [-h, h,-h],

            // Bottom (-Y)
            [-h,-h,-h], [ h,-h,-h], [ h,-h, h],
            [-h,-h,-h], [ h,-h, h], [-h,-h, h]
        ];

        const verts = [];

        for (let i = 0; i < positions.length; i += 3) {

            const a = new Vector3(
                positions[i][0],
                positions[i][1],
                positions[i][2]
            );

            const b = new Vector3(
                positions[i+1][0],
                positions[i+1][1],
                positions[i+1][2]
            );

            const c = new Vector3(
                positions[i+2][0],
                positions[i+2][1],
                positions[i+2][2]
            );

            const n = computeNormal(a,b,c);

            verts.push(
                a.x,a.y,a.z,n.x,n.y,n.z, red, green, blue, alpha,
                b.x,b.y,b.z,n.x,n.y,n.z, red, green, blue, alpha,
                c.x,c.y,c.z,n.x,n.y,n.z, red, green, blue, alpha
            );
        }

        this.setVertices(new Float32Array(verts));
        this.vertexCount = this.vertices.length / 10;

        if(Scene.current)
            Scene.current.add(this);
    }
}

class Camera {
    constructor(name, speed = 0.1) {
        this.name = name;
        this.speed = speed;

        this.position = new Vector3(0,0,0);
        this.target = new Vector3(0,0,0);

        if(Scene.current)
            Scene.current.setActiveCamera(this);
    }
}

class Camera2D extends Camera{
    constructor(
        name,
        x = 0,
        y = 0,
        zoom = 1,
        speed = 0.1,
        zoomSpeed = 0.1
    ) {
        super(name, speed);
        this.zoom = zoom;
        this.position = new Vector2(x, y);
        this.zoomSpeed = zoomSpeed;
    }

    get x() {
        return this.position.x;
    }

    set x(value) {
        this.position.x = (value);
    }

    get y() {
        return this.position.y;
    }

    set y(value) {
        this.position.y = value;
    }

    move(dx, dy) {
        this.position.x += dx * this.speed;
        this.position.y += dy * this.speed;
    }

    zoomBy(amount) {
        this.zoom *= (1 + amount * 1);
        this.zoom = Math.max(0.001, this.zoom);
    }

    setZoom(value) {
        this.zoom = Math.max(0.01, value);
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
}

class ArcRotateCamera extends Camera {
    constructor(
        name,
        alpha = 0,
        beta = 1.2,
        radius = 10,
        target = new Vector3(0, 0, 0)
    ) {
        super(name, 0.1);
        
        this.alpha = alpha;
        this.beta = beta;
        this.radius = radius;
        this.target = target;
    }

    get beta() {
        return this._beta;
    }

    set beta(value) {
        this._beta = this.wrapBeta(value);
    }

    wrapBeta(beta) {
        const limit = Math.PI / 2 - 0.05; // 177.14 degrees

        if (beta > limit) {
            beta = limit;
        }

        if (beta < -limit) {
            beta = -limit;
        }

        return beta;
    }

    get radius() {
        return this._radius;
    }

    set radius(value) {
        this._radius = Math.max(
            0.5,
            value
        );
    }

    getPosition() {
        const x = this.target.x + this.radius * Math.cos(this.beta) * Math.cos(this.alpha);
        const y = this.target.y + this.radius * Math.sin(this.beta);
        const z = this.target.z + this.radius * Math.cos(this.beta) * Math.sin(this.alpha);

        return new Vector3(x, y, z);
    }

    get position() {
        return this.getPosition();
    }

    set position(v) {}
}

function updateArcCameraGPU(scene, engine) {
    // recompute view-projection matrix from current ArcRotateCamera
    const viewProj = scene.getCameraMatrix3D(); // returns a Matrix4 (Float32Array)
    // upload to GPU
    engine.device.queue.writeBuffer(scene.cameraBuffer3D, 0, viewProj);
}

class Scene {
    constructor(engine) {
        this.engine = engine;
        this.dimension = engine.dimension;

        this.meshes = [];
        this.shapes = [];

        this.activeCamera = null;

        Scene.current = this;   // IMPORTANT

        this.engine.scene = this;

        this.ready = this.initialize();
    }

    async initialize() {
        await this.engine.ready;

        if (this.dimension === "2d") {
            await this.init2DPipeline();
        }

        if (this.dimension === "3d") {
            await this.init3DPipeline();
        }
    }

    async init2DPipeline() {

        if (this.engine.graphicsMethod === "WebGPU") {
            return this.init2DPipelineWebGPU();
        }

        return this.init2DPipelineWebGL();
    }

    async init2DPipelineWebGPU() {
        const device = this.engine.device;
        this.shaderModule = device.createShaderModule({
            code: `
            struct TransformData {
                mat: mat4x4<f32>
            };

            struct ColorData {
                color: vec4<f32>
            };

            struct CameraData {
                mat: mat4x4<f32>
            };

            @group(0) @binding(0)
            var<uniform> uTransform: TransformData;

            @group(0) @binding(1)
            var<uniform> uColor: ColorData;

            @group(1) @binding(0)
            var<uniform> uCamera: CameraData;

            @vertex
            fn vs_main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
                let p = uCamera.mat * uTransform.mat * vec4<f32>(pos, 0.0, 1.0);
                return p;
            }


            @fragment
            fn fs_main() -> @location(0) vec4<f32> {
                return uColor.color;
            }
            `
        });


        this.pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs_main",
                buffers: [{
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x2"
                    }]
                }]
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs_main",
                targets: [{ format: this.engine.presentationFormat }]
            },
            primitive: { topology: "triangle-list" }
        });

        this.cameraBuffer = this.engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.cameraBindGroup = this.engine.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.cameraBuffer }
                }
            ]
        });

    }

    init2DPipelineWebGL() {

        const gl = this.engine.gl;

        const isWebGL2 =
            this.engine.graphicsMethod === "WebGL2";

        let vertexSource;
        let fragmentSource;

        if (isWebGL2) {

            vertexSource = `#version 300 es

                precision highp float;

                layout(location = 0) in vec2 aPosition;

                uniform mat4 uTransform;
                uniform mat4 uCamera;

                void main() {

                    gl_Position =
                        uCamera *
                        uTransform *
                        vec4(aPosition, 0.0, 1.0);
                }
            `;

            fragmentSource = `#version 300 es

                precision highp float;

                uniform vec4 uColor;

                out vec4 outColor;

                void main() {
                    outColor = uColor;
                }
            `;

        } else {

            vertexSource = `

                attribute vec2 aPosition;

                uniform mat4 uTransform;
                uniform mat4 uCamera;

                void main() {

                    gl_Position =
                        uCamera *
                        uTransform *
                        vec4(aPosition, 0.0, 1.0);
                }
            `;

            fragmentSource = `

                precision mediump float;

                uniform vec4 uColor;

                void main() {
                    gl_FragColor = uColor;
                }
            `;
        }

        this.program2D =
            this.createWebGLProgram(
                vertexSource,
                fragmentSource
            );

        if (!this.program2D) {
            return;
        }

        this.positionLocation =
            gl.getAttribLocation(
                this.program2D,
                "aPosition"
            );

        this.transformLocation =
            gl.getUniformLocation(
                this.program2D,
                "uTransform"
            );

        this.cameraLocation =
            gl.getUniformLocation(
                this.program2D,
                "uCamera"
            );

        this.colorLocation =
            gl.getUniformLocation(
                this.program2D,
                "uColor"
            );
    }

    async init3DPipeline() {

        if (this.engine.graphicsMethod === "WebGPU") {
            return this.init3DPipelineWebGPU();
        }

        return this.init3DPipelineWebGL();
    }

    async init3DPipelineWebGPU() {
        const device = this.engine.device;
        const format = this.engine.presentationFormat;

        this.shader3D = device.createShaderModule({
            code: `
            struct Camera3D {
                viewProj: mat4x4<f32>
            };

            struct ModelData {
                model: mat4x4<f32>
            };

            @group(0) @binding(0)
            var<uniform> uCamera: Camera3D;

            @group(0) @binding(1)
            var<uniform> uModel: ModelData;

            struct VSOut {
                @builtin(position) pos: vec4<f32>,
                @location(0) normal: vec3<f32>,
                @location(1) color: vec4<f32>
            }

            struct LightData {
                direction: vec3<f32>
            }

            @group(0) @binding(2)
            var<uniform> uLight: LightData;


            @vertex
            fn vs_main(
                @location(0) pos: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) color: vec4<f32>
            ) -> VSOut {
                var out: VSOut;

                let world = uModel.model * vec4<f32>(pos, 1.0);
                out.pos = uCamera.viewProj * world;
                /*
                let rot = mat3x3<f32>(
                    uModel.model[0].xyz,
                    uModel.model[1].xyz,
                    uModel.model[2].xyz
                );

                let worldNormal = normalize(transpose(rot) * normal);
                */

                let rot = mat3x3<f32>(
                    uModel.model[0].xyz,
                    uModel.model[1].xyz,
                    uModel.model[2].xyz
                );

                out.normal = normalize(rot * normal);
                out.color = color;
                //out.normal = worldNormal;
                //out.normal = normal;


                return out;
            }


            @fragment
            fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
                let N = normalize(input.normal);
                let L = normalize(uLight.direction);

                let diffuse = max(dot(N, L), 0.0);
                let ambient = 0.2;

                let lighting = ambient + diffuse;

                return vec4<f32>(input.color.rgb * lighting, input.color.a);
            }
            `
        })

        const canvas = this.engine.canvas;
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height, 1],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.pipeline3D = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shader3D,
                entryPoint: "vs_main",
                buffers: [{
                    arrayStride: 40,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x3"
                        },
                        {
                            shaderLocation: 1,
                            offset: 12,
                            format: "float32x3"
                        },
                        {
                            shaderLocation: 2,
                            offset: 24,
                            format: "float32x4"
                        }
                    ]
                }]
            },
            fragment: {
                module: this.shader3D,
                entryPoint: "fs_main",
                targets: [{
                    format,
                    blend: {
                        color: {
                            srcFactor: "src-alpha",
                            dstFactor: "one-minus-src-alpha",
                            operation: "add"
                        },
                        alpha: {
                            srcFactor: "one",
                            dstFactor: "one-minus-src-alpha",
                            operation: "add"
                        }
                    }
                }]
            },
            primitive: { topology: "triangle-list", cullMode: "none" },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            }
        });

        this.cameraBuffer3D = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // LIGHT BUFFER (vec3 + padding)
        this.lightBuffer = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Default light direction
        device.queue.writeBuffer(
            this.lightBuffer,
            0,
            new Float32Array([0.5, 0.7, 1.0, 0.0])
        );

    }

    init3DPipelineWebGL() {

        const gl = this.engine.gl;

        const isWebGL2 =
            this.engine.graphicsMethod === "WebGL2";

        let vertexSource;
        let fragmentSource;

        if (isWebGL2) {

            vertexSource = `#version 300 es

                precision highp float;

                layout(location = 0) in vec3 aPosition;
                layout(location = 1) in vec3 aNormal;
                layout(location = 2) in vec4 aColor;

                uniform mat4 uCamera;
                uniform mat4 uModel;

                out vec3 vNormal;
                out vec4 vColor;

                void main() {

                    vec4 world =
                        uModel *
                        vec4(aPosition, 1.0);

                    gl_Position =
                        uCamera *
                        world;

                    mat3 normalMatrix =
                        mat3(uModel);

                    vNormal =
                        normalize(normalMatrix * aNormal);

                    vColor = aColor;
                }
            `;

            fragmentSource = `#version 300 es

                precision highp float;

                in vec3 vNormal;
                in vec4 vColor;

                uniform vec3 uLightDirection;

                out vec4 outColor;

                void main() {

                    vec3 N = normalize(vNormal);
                    vec3 L = normalize(uLightDirection);

                    float diffuse =
                        max(dot(N, L), 0.0);

                    float ambient = 0.2;

                    float lighting =
                        ambient + diffuse;

                    outColor =
                        vec4(
                            vColor.rgb * lighting,
                            vColor.a
                        );
                }
            `;

        } else {

            vertexSource = `

                attribute vec3 aPosition;
                attribute vec3 aNormal;
                attribute vec4 aColor;

                uniform mat4 uCamera;
                uniform mat4 uModel;

                varying vec3 vNormal;
                varying vec4 vColor;

                void main() {

                    vec4 world =
                        uModel *
                        vec4(aPosition, 1.0);

                    gl_Position =
                        uCamera *
                        world;

                    vNormal = normalize(vec3(
                        uModel[0].x * aNormal.x +
                        uModel[1].x * aNormal.y +
                        uModel[2].x * aNormal.z,

                        uModel[0].y * aNormal.x +
                        uModel[1].y * aNormal.y +
                        uModel[2].y * aNormal.z,

                        uModel[0].z * aNormal.x +
                        uModel[1].z * aNormal.y +
                        uModel[2].z * aNormal.z
                    ));

                    vColor = aColor;
                }
            `;

            fragmentSource = `

                precision mediump float;

                varying vec3 vNormal;
                varying vec4 vColor;

                uniform vec3 uLightDirection;

                void main() {

                    vec3 N =
                        normalize(vNormal);

                    vec3 L =
                        normalize(uLightDirection);

                    float diffuse =
                        max(dot(N, L), 0.0);

                    float ambient = 0.2;

                    float lighting =
                        ambient + diffuse;

                    gl_FragColor =
                        vec4(
                            vColor.rgb * lighting,
                            vColor.a
                        );
                }
            `;
        }

        this.program3D =
            this.createWebGLProgram(
                vertexSource,
                fragmentSource
            );

        if (!this.program3D) {
            return;
        }

        this.position3DLocation =
            gl.getAttribLocation(
                this.program3D,
                "aPosition"
            );

        this.normal3DLocation =
            gl.getAttribLocation(
                this.program3D,
                "aNormal"
            );

        this.color3DLocation =
            gl.getAttribLocation(
                this.program3D,
                "aColor"
            );

        this.camera3DLocation =
            gl.getUniformLocation(
                this.program3D,
                "uCamera"
            );

        this.model3DLocation =
            gl.getUniformLocation(
                this.program3D,
                "uModel"
            );

        this.light3DLocation =
            gl.getUniformLocation(
                this.program3D,
                "uLightDirection"
            );

        this.lightDirection =
            new Float32Array([
                0.5,
                0.7,
                1.0
            ]);
    }

    updateShapeTransform(shape) {
        const device = this.engine.device;
        if (!shape.transformBuffer) return;

        device.queue.writeBuffer(shape.transformBuffer, 0, shape.transform);
    }

    updateMeshTransform(mesh) {
        // WebGL uses uniforms directly during rendering.
        // Nothing needs to be uploaded here.
    }


    updateShapeTransform(shape) {

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            return;
        }

        const device = this.engine.device;

        if (!shape.transformBuffer) {
            return;
        }

        device.queue.writeBuffer(
            shape.transformBuffer,
            0,
            shape.transform
        );
    }    

    createVertexBuffer(object) {

        // ========================================================
        // WEBGL
        // ========================================================

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {

            const gl = this.engine.gl;

            let vertexData;

            if (object instanceof ShapeCreator) {

                vertexData =
                    new Float32Array(
                        object.vertexCount * 2
                    );

                for (
                    let i = 0;
                    i < object.vertexCount;
                    i++
                ) {

                    const vertex =
                        object.vertices[i];

                    vertexData[i * 2 + 0] =
                        vertex.x;

                    vertexData[i * 2 + 1] =
                        vertex.y;
                }

            } else {

                vertexData =
                    new Float32Array(
                        object.vertices
                    );
            }

            object.vertexBuffer =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                object.vertexBuffer
            );

            gl.bufferData(
                gl.ARRAY_BUFFER,
                vertexData,
                gl.DYNAMIC_DRAW
            );

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                null
            );

            // Index buffer
            if (
                object.indices &&
                object.indices.length > 0
            ) {

                let maxIndex = 0;

                for (let i = 0; i < object.indices.length; i++) {
                    if (object.indices[i] > maxIndex) {
                        maxIndex = object.indices[i];
                    }
                }

                let indexData;
                let indexType;

                if (maxIndex <= 65535) {

                    indexData =
                        new Uint16Array(object.indices);

                    indexType = gl.UNSIGNED_SHORT;

                } else {

                    if (
                        this.engine.graphicsMethod === "WebGL" &&
                        !this.engine.uint32IndexExtension
                    ) {
                        throw new Error(
                            "WebGL 1 requires OES_element_index_uint " +
                            "for meshes with indices > 65535."
                        );
                    }

                    indexData =
                        new Uint32Array(object.indices);

                    indexType = gl.UNSIGNED_INT;
                }

                object.indexBuffer =
                    gl.createBuffer();

                gl.bindBuffer(
                    gl.ELEMENT_ARRAY_BUFFER,
                    object.indexBuffer
                );

                gl.bufferData(
                    gl.ELEMENT_ARRAY_BUFFER,
                    indexData,
                    gl.STATIC_DRAW
                );

                object.indexType = indexType;

                gl.bindBuffer(
                    gl.ELEMENT_ARRAY_BUFFER,
                    null
                );
            }

            return;
        }

        // ========================================================
        // WEBGPU
        // ========================================================

        const device = this.engine.device;

        let vertexData;

        if (object instanceof ShapeCreator) {

            vertexData =
                new Float32Array(
                    object.vertexCount * 2
                );

            for (
                let i = 0;
                i < object.vertexCount;
                i++
            ) {

                const vertex =
                    object.vertices[i];

                vertexData[i * 2 + 0] =
                    vertex.x;

                vertexData[i * 2 + 1] =
                    vertex.y;
            }

        } else {

            vertexData =
                new Float32Array(
                    object.vertices
                );
        }

        object.vertexBuffer =
            device.createBuffer({
                size: vertexData.byteLength,
                usage:
                    GPUBufferUsage.VERTEX |
                    GPUBufferUsage.COPY_DST
            });

        device.queue.writeBuffer(
            object.vertexBuffer,
            0,
            vertexData
        );

        if (
            object.indices &&
            object.indices.length > 0
        ) {

            const indexData =
                new Uint32Array(object.indices);

            object.indexBuffer =
                device.createBuffer({
                    size: indexData.byteLength,
                    usage:
                        GPUBufferUsage.INDEX |
                        GPUBufferUsage.COPY_DST
                });

            device.queue.writeBuffer(
                object.indexBuffer,
                0,
                indexData
            );
        }
    }

    createWebGLShader(type, source) {

        const gl = this.engine.gl;

        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

            console.error(
                "WebGL shader compilation failed:",
                gl.getShaderInfoLog(shader)
            );

            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createWebGLProgram(vertexSource, fragmentSource) {

        const gl = this.engine.gl;

        const vertexShader = this.createWebGLShader(
            gl.VERTEX_SHADER,
            vertexSource
        );

        const fragmentShader = this.createWebGLShader(
            gl.FRAGMENT_SHADER,
            fragmentSource
        );

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

            console.error(
                "WebGL program linking failed:",
                gl.getProgramInfoLog(program)
            );

            gl.deleteProgram(program);
            return null;
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    createColorBuffer(shape) {

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            return;
        }

        const device = this.engine.device;

        const colorData =
            new Float32Array([
                shape.color.r,
                shape.color.g,
                shape.color.b,
                shape.color.a
            ]);

        shape.colorBuffer =
            device.createBuffer({
                size: colorData.byteLength,
                usage:
                    GPUBufferUsage.UNIFORM |
                    GPUBufferUsage.COPY_DST
            });

        device.queue.writeBuffer(
            shape.colorBuffer,
            0,
            colorData
        );
    }

    createTransformBuffer(object) {

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            return;
        }

        const device = this.engine.device;

        const transformData =
            new Float32Array(object.transform);

        object.transformBuffer =
            device.createBuffer({
                size: 64,
                usage:
                    GPUBufferUsage.UNIFORM |
                    GPUBufferUsage.COPY_DST
            });

        device.queue.writeBuffer(
            object.transformBuffer,
            0,
            transformData
        );
    }

    createBindGroup(shape) {

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            return;
        }

        const device = this.engine.device;

        shape.bindGroup =
            device.createBindGroup({
                layout:
                    this.pipeline.getBindGroupLayout(0),

                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer:
                                shape.transformBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer:
                                shape.colorBuffer
                        }
                    }
                ]
            });
    }

    createMeshBindGroup(mesh) {

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            return;
        }

        mesh.bindGroup =
            this.engine.device.createBindGroup({
                layout:
                    this.pipeline3D.getBindGroupLayout(0),

                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer:
                                this.cameraBuffer3D
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer:
                                mesh.transformBuffer
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer:
                                this.lightBuffer
                        }
                    }
                ]
            });
    }
 
    getCameraMatrix() {
        const cam = this.activeCamera;
        if (!cam) return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        const x = cam.position.x;
        const y = cam.position.y;
        const z = 0;
        const zoom = cam.zoom;

        return new Float32Array([
            zoom, 0, 0, 0,
            0, zoom, 0, 0,
            0, 0, 1, 0,
            -x*zoom, -y*zoom, 0, 1
        ]);
    }

    getViewMatrix3D() {
        const cam = this.activeCamera;

        if (!cam) {
            return new Matrix4();
        }

        return Matrix4.lookAt(
            cam.position,
            cam.target,
            new Vector3(0, 1, 0)
        );
    }

    getProjectionMatrix3D() {
        const canvas = this.engine.canvas;

        return Matrix4.perspective(
            Math.PI / 3,
            canvas.width / canvas.height,
            0.1,
            100
        );
    }

    getCameraMatrix3D() {
        const view = this.getViewMatrix3D();
        const projection = this.getProjectionMatrix3D();

        return projection.multiply(view);
    }

    clearCanvas(color = { r: 0.15, g: 0.35, b: 0.70, a: 1.0 }) {
        if (this.engine.graphicsMethod === "WebGPU") {
            this.clearWebGPU(color);
        } else if (this.engine.graphicsMethod === "WebGL2") {
            this.clearWebGL2(color);
        } else if (this.engine.graphicsMethod === "WebGL") {
            this.clearWebGL(color);
        }
    }

    clearWebGPU(color) {
        const device = this.engine.device;
        const context = this.engine.context;

        if (!device || !context) {
            console.error("WebGPU not ready yet.");
            return;
        }

        const encoder = device.createCommandEncoder();
        const view = context.getCurrentTexture().createView();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: color,
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        pass.end();
        device.queue.submit([encoder.finish()]);
    }

    clearWebGL2(color) {
        const gl = this.engine.gl;
        if (!gl) return;

        gl.clearColor(color.r, color.g, color.b, color.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    clearWebGL(color) {
        const gl = this.engine.gl;
        if (!gl) return;

        gl.clearColor(color.r, color.g, color.b, color.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resize() {

        const canvas = this.engine.canvas;

        // WebGPU
        if (this.engine.graphicsMethod === "WebGPU") {

            const device = this.engine.device;

            if (this.depthTexture) {
                this.depthTexture.destroy();
            }

            this.depthTexture =
                device.createTexture({
                    size: [
                        canvas.width,
                        canvas.height,
                        1
                    ],
                    format: "depth24plus",
                    usage:
                        GPUTextureUsage.RENDER_ATTACHMENT
                });

            return;
        }

        // WebGL2 / WebGL
        const gl = this.engine.gl;

        if (!gl) {
            return;
        }

        gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    add(object) {

        if (!object) {
            console.error("Scene.add(): object is null");
            return;
        }

        if (object.__addingToScene) {
            console.error(
                "RECURSIVE Scene.add detected:",
                object.name,
                object
            );
            return;
        }

        object.__addingToScene = true;

        try {

            if (object instanceof MeshCreator) {

                console.log("Adding mesh:", object.name);

                this.meshes.push(object);

                this.createVertexBuffer(object);
                this.createColorBuffer(object);
                this.createTransformBuffer(object);
                this.createMeshBindGroup(object);

                return;
            }

            if (object instanceof ShapeCreator) {

                console.log("Adding shape:", object.name);

                this.shapes.push(object);

                this.createVertexBuffer(object);
                this.createColorBuffer(object);
                this.createTransformBuffer(object);
                this.createBindGroup(object);

                return;
            }

        } finally {
            object.__addingToScene = false;
        }
    }

    setActiveCamera(camera) {
        this.activeCamera = camera;
    }

    render2D() {

        if (this.dimension !== "2d") {
            return;
        }

        if (this.shapes.length === 0) {
            return;
        }

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            this.render2DWebGL();
            return;
        }

        // ========================================================
        // WEBGPU
        // ========================================================

        const device = this.engine.device;
        const context = this.engine.context;

        const camMat =
            this.getCameraMatrix();

        device.queue.writeBuffer(
            this.cameraBuffer,
            0,
            camMat
        );

        const encoder =
            device.createCommandEncoder();

        const view =
            context
                .getCurrentTexture()
                .createView();

        const pass =
            encoder.beginRenderPass({
                colorAttachments: [{
                    view,
                    clearValue: {
                        r: 0.15,
                        g: 0.35,
                        b: 0.70,
                        a: 1
                    },
                    loadOp: "clear",
                    storeOp: "store"
                }]
            });

        pass.setPipeline(this.pipeline);

        pass.setBindGroup(
            1,
            this.cameraBindGroup
        );

        for (const shape of this.shapes) {

            if (
                !shape.vertexBuffer ||
                !shape.bindGroup ||
                shape.vertexCount === 0
            ) {
                continue;
            }

            pass.setBindGroup(
                0,
                shape.bindGroup
            );

            pass.setVertexBuffer(
                0,
                shape.vertexBuffer
            );

            pass.draw(
                shape.vertexCount
            );
        }

        pass.end();

        device.queue.submit([
            encoder.finish()
        ]);
    }

    render2DWebGL() {

        const gl = this.engine.gl;

        gl.useProgram(this.program2D);

        gl.viewport(
            0,
            0,
            this.engine.canvas.width,
            this.engine.canvas.height
        );

        gl.clearColor(
            0.15,
            0.35,
            0.70,
            1
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT
        );

        const camera =
            this.getCameraMatrix();

        gl.uniformMatrix4fv(
            this.cameraLocation,
            false,
            camera
        );

        for (const shape of this.shapes) {

            if (
                !shape.vertexBuffer ||
                shape.vertexCount === 0
            ) {
                continue;
            }

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                shape.vertexBuffer
            );

            gl.enableVertexAttribArray(
                this.positionLocation
            );

            gl.vertexAttribPointer(
                this.positionLocation,
                2,
                gl.FLOAT,
                false,
                8,
                0
            );

            gl.uniformMatrix4fv(
                this.transformLocation,
                false,
                shape.transform
            );

            gl.uniform4f(
                this.colorLocation,
                shape.color.r,
                shape.color.g,
                shape.color.b,
                shape.color.a
            );

            gl.drawArrays(
                gl.TRIANGLES,
                0,
                shape.vertexCount
            );
        }

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            null
        );

        gl.useProgram(null);
    }

    render3D() {

        if (this.dimension !== "3d") {
            return;
        }

        if (this.meshes.length === 0) {
            return;
        }

        if (
            this.engine.graphicsMethod === "WebGL2" ||
            this.engine.graphicsMethod === "WebGL"
        ) {
            this.render3DWebGL();
            return;
        }

        // ========================================================
        // WEBGPU
        // ========================================================

        const device = this.engine.device;
        const context = this.engine.context;

        const camMat =
            this.getCameraMatrix3D();

        device.queue.writeBuffer(
            this.cameraBuffer3D,
            0,
            camMat
        );

        const encoder =
            device.createCommandEncoder();

        const pass =
            encoder.beginRenderPass({
                colorAttachments: [{
                    view:
                        context
                            .getCurrentTexture()
                            .createView(),

                    clearValue: {
                        r: 0.15,
                        g: 0.35,
                        b: 0.70,
                        a: 1
                    },

                    loadOp: "clear",
                    storeOp: "store"
                }],

                depthStencilAttachment: {
                    view:
                        this.depthTexture.createView(),

                    depthClearValue: 1,
                    depthLoadOp: "clear",
                    depthStoreOp: "store"
                }
            });

        pass.setPipeline(
            this.pipeline3D
        );

        for (const mesh of this.meshes) {

            if (!mesh.vertexBuffer) {
                continue;
            }

            if (!mesh.bindGroup) {
                continue;
            }

            pass.setBindGroup(
                0,
                mesh.bindGroup
            );

            pass.setVertexBuffer(
                0,
                mesh.vertexBuffer
            );

            if (
                mesh.indexBuffer &&
                mesh.indices &&
                mesh.indices.length > 0
            ) {

                pass.setIndexBuffer(
                    mesh.indexBuffer,
                    "uint32"
                );

                pass.drawIndexed(
                    mesh.indices.length
                );

            } else {

                pass.draw(
                    mesh.vertexCount
                );
            }
        }

        pass.end();

        device.queue.submit([
            encoder.finish()
        ]);
    }

    render3DWebGL() {

        const gl = this.engine.gl;

        gl.useProgram(
            this.program3D
        );

        gl.viewport(
            0,
            0,
            this.engine.canvas.width,
            this.engine.canvas.height
        );

        gl.clearColor(
            0.15,
            0.35,
            0.70,
            1
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.enable(
            gl.DEPTH_TEST
        );

        gl.enable(
            gl.BLEND
        );

        gl.blendFunc(
            gl.SRC_ALPHA,
            gl.ONE_MINUS_SRC_ALPHA
        );

        // Camera
        const camera =
            this.getCameraMatrix3D();

        gl.uniformMatrix4fv(
            this.camera3DLocation,
            false,
            camera
        );

        // Light
        gl.uniform3fv(
            this.light3DLocation,
            this.lightDirection
        );

        for (const mesh of this.meshes) {

            if (!mesh.vertexBuffer) {
                continue;
            }

            const model =
                mesh.transform;

            gl.uniformMatrix4fv(
                this.model3DLocation,
                false,
                model
            );

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                mesh.vertexBuffer
            );

            // position
            gl.enableVertexAttribArray(
                this.position3DLocation
            );

            gl.vertexAttribPointer(
                this.position3DLocation,
                3,
                gl.FLOAT,
                false,
                40,
                0
            );

            // normal
            gl.enableVertexAttribArray(
                this.normal3DLocation
            );

            gl.vertexAttribPointer(
                this.normal3DLocation,
                3,
                gl.FLOAT,
                false,
                40,
                12
            );

            // color
            gl.enableVertexAttribArray(
                this.color3DLocation
            );

            gl.vertexAttribPointer(
                this.color3DLocation,
                4,
                gl.FLOAT,
                false,
                40,
                24
            );

            // Indexed mesh
            if (
                mesh.indexBuffer &&
                mesh.indices &&
                mesh.indices.length > 0
            ) {

                gl.bindBuffer(
                    gl.ELEMENT_ARRAY_BUFFER,
                    mesh.indexBuffer
                );

                gl.drawElements(
                    gl.TRIANGLES,
                    mesh.indices.length,
                    mesh.indexType,
                    0
                );

            } else {

                gl.drawArrays(
                    gl.TRIANGLES,
                    0,
                    mesh.vertexCount
                );
            }
        }

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            null
        );

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            null
        );

        gl.useProgram(null);
    }
}

Math.dot = dot;

GUBILO.Engine = Engine;
GUBILO.Scene = Scene;
GUBILO.Camera2D = Camera2D;
GUBILO.ArcRotateCamera = ArcRotateCamera;
GUBILO.ShapeCreator = ShapeCreator;
GUBILO.MeshCreator = MeshCreator;
GUBILO.ShapeCreator.Triangle = Triangle;
GUBILO.ShapeCreator.Square = Square;
GUBILO.ShapeCreator.Circle = Circle;
GUBILO.MeshCreator.Cube = Cube;
GUBILO.MeshCreator.Plane = Plane;
GUBILO.Vector2 = Vector2;
GUBILO.Vector3 = Vector3;
GUBILO.Vector4 = Vector4;
GUBILO.Color4 = Color4;
GUBILO.Noise = Noise;
GUBILO.Noise.init();