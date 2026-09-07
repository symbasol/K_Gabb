import { createAnimator } from "../animator.js";

export class Player {
    constructor(name, scene, shadowGen) {
        this.name = name;
        this.scene = scene;
        this.shadowGen = shadowGen;

        this.pivot = null;
        this.root = null;
        this.animator = null;
        this.isMovingForward = false;
        this.currentState = "";
    }

    async load(path, file) {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "",
                path,
                file,
                this.scene,
                (meshes, ps, skels, anims) => {

                    // Create root (visual container)
                    this.root = new BABYLON.TransformNode(`${this.name}_root`, this.scene);

                    // Parent ALL meshes (not just skinned ones)
                    meshes.forEach(m => {
                        if (m !== this.root) {
                            m.parent = this.root;
                        }
                    });

                    // Create pivot (movement controller)
                    this.pivot = new BABYLON.TransformNode(`${this.name}_pivot`, this.scene);
                    this.root.parent = this.pivot;

                    // Initialize transforms
                    this.pivot.position = new BABYLON.Vector3(0, 0, 0);
                    this.root.position = new BABYLON.Vector3(0, 0.001, 0);
                    this.root.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
                    this.root.parent = this.pivot;

                    this.root.rotation.y = Math.PI; // 180 degrees

                    // Shadows (avoid duplicates)
                    const allMeshes = meshes.flatMap(m => [m, ...m.getChildMeshes()]);
                    allMeshes.forEach(m => {
                        this.shadowGen.addShadowCaster(m);
                    });

                    // Animator
                    this.animator = createAnimator(anims);
                    console.log(this.animator);

                    this.collider = BABYLON.MeshBuilder.CreateCapsule("playerCollider", {
                                                        height: 2,
                                                        radius: 0.5
                                                    }, this.scene);

                    this.collider.isVisible = false; // true for debugging
                    this.collider.checkCollisions = true;
                    this.collider.applyGravity = true;
                    this.collider.position.y = 1;
                    

                    // Link hierarchy
                    this.collider.parent = null;

                    resolve(this);
                },
                null,
                (err) => {
                    console.error("Failed to load player:", err);
                    reject(err);
                }
            );
        });
    }

    playAnimation(name, loop = true) {
        if (!this.animator) return;

        const normalize = (s) =>
            (s || "")
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/_/g, "")
                .replace(/\|/g, "");

        const current = normalize(this.animator.getCurrentName());
        const next = normalize(name);

        if (current === next) return;

        this.animator.play(name, loop);
        this.currentState = `${name}`;
    }

    playState(state) {
        const map = {
            idle: "Idle_Loop",
            walk: "Walk_Loop",
            run: "Sprint_Loop",
            jump_start: "Jump_Start"
        };

        const anim = map[state];

        if (!anim) {
            console.warn("Unknown state:", state);
            return;
        }

        this.playAnimation(anim);
    }
    sync() {
        this.pivot.position.copyFrom(this.collider.position);
        this.pivot.position.y -= 1;
        this.root.position.set(0, 0.001, 0);
    }
}