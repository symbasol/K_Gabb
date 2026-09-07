import {
    isGrounded,
    jump,
    tryMovePlayer
} from "./playerPhysics.js";

export function movePlayer(player, keys, deltaTime) {
    const speed = 3.5;
    const sprintSpeed = 8;
    const turnSpeed = 2.5;

    if (!player || !player.collider) {
        return;
    }

    // --------------------------------------------------
    // GROUND STATE
    // --------------------------------------------------

    const grounded = isGrounded;

    // --------------------------------------------------
    // JUMP
    // --------------------------------------------------

    if (keys["Space"] && grounded) {
        if (jump()) {
            player.playState("jump_start");
            player.currentState = "jump_start";
        }
    }

    const isSprinting =
        keys["ShiftLeft"] || keys["ShiftRight"];

    // --------------------------------------------------
    // ROTATION
    // --------------------------------------------------

    const turnLeft = keys["KeyA"] ? 1 : 0;
    const turnRight = keys["KeyD"] ? 1 : 0;

    player.pivot.rotation.y +=
        (turnRight - turnLeft) *
        turnSpeed *
        deltaTime;

    // --------------------------------------------------
    // FORWARD
    // --------------------------------------------------

    let forward = new BABYLON.Vector3(0, 0, -1);

    forward = BABYLON.Vector3.TransformNormal(
        forward,
        BABYLON.Matrix.RotationY(
            player.pivot.rotation.y
        )
    );

    forward.y = 0;

    if (forward.lengthSquared() > 0) {
        forward.normalize();
    }

    // --------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------

    let moving = false;

    if (keys["KeyW"]) {
        moving = true;

        const moveSpeed =
            isSprinting ? sprintSpeed : speed;

        const movement =
            forward.scale(moveSpeed * deltaTime);

        tryMovePlayer(
            player,
            movement.x,
            movement.z
        );
    }

    // --------------------------------------------------
    // AIRBORNE
    // --------------------------------------------------

    if (!isGrounded) {
        if (
            player.currentState !== "jump_start" &&
            player.currentState !== "jump"
        ) {
            player.playState("jump");
            player.currentState = "jump";
        }
    }

    // --------------------------------------------------
    // GROUND ANIMATION
    // --------------------------------------------------

    else if (moving) {
        const state =
            isSprinting ? "run" : "walk";

        if (player.currentState !== state) {
            player.playState(state);
            player.currentState = state;
        }
    }

    else {
        if (player.currentState !== "idle") {
            player.playState("idle");
            player.currentState = "idle";
        }
    }

    // --------------------------------------------------
    // SYNC VISUAL MODEL
    // --------------------------------------------------

    if (player.sync) {
        player.sync();
    }
}
