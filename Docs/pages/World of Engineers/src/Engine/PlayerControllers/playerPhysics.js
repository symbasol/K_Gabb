import { getHeightAtWorld } from "../Scene/Ground/terrain.js";

let velocityY = 0;

const GRAVITY = -0.01;
const JUMP_FORCE = 0.25;

const COLLIDER_HALF_HEIGHT = 1;

// Maximum walkable slope in degrees
const MAX_SLOPE_ANGLE = 90;

// How far ahead we sample the terrain when checking movement
const SLOPE_SAMPLE_DISTANCE = 0.5;

// Small tolerance so the player does not constantly switch
// between grounded and falling because of floating point errors.
const GROUND_EPSILON = 0.05;

export let isGrounded = false;

let _player = null;


/**
 * Jump the player.
 */
export function jump() {
    if (!isGrounded) {
        return false;
    }

    velocityY = JUMP_FORCE;
    isGrounded = false;

    return true;
}


/**
 * Get the terrain slope around a world position.
 *
 * Returns the slope angle in radians.
 */
function getSlopeAngle(x, z) {
    const d = SLOPE_SAMPLE_DISTANCE;

    const heightLeft = getHeightAtWorld(x - d, z);
    const heightRight = getHeightAtWorld(x + d, z);

    const heightBack = getHeightAtWorld(x, z - d);
    const heightForward = getHeightAtWorld(x, z + d);

    // Height change per world unit.
    const slopeX = (heightRight - heightLeft) / (2 * d);
    const slopeZ = (heightForward - heightBack) / (2 * d);

    // Total slope.
    const slope = Math.sqrt(
        slopeX * slopeX +
        slopeZ * slopeZ
    );

    return Math.atan(slope);
}


/**
 * Check whether a position is on a walkable slope.
 */
function canWalkOnSlope(x, z) {
    const slopeAngle = getSlopeAngle(x, z);

    const maxSlopeRadians =
        BABYLON.Tools.ToRadians(MAX_SLOPE_ANGLE);

    return slopeAngle <= maxSlopeRadians;
}


/**
 * Get the terrain height underneath the player.
 */
function getGroundHeight(x, z) {
    return getHeightAtWorld(x, z);
}


/**
 * Update player gravity, terrain collision and jumping.
 *
 * Horizontal movement can be handled by your movement controller.
 * This function makes sure the collider follows the terrain.
 */
export function updatePlayerPhysics(player, input) {
    _player = player;

    if (!player || !player.collider) {
        return;
    }

    // --------------------------------------------------
    // INPUT
    // --------------------------------------------------

    input.jump = !!input["Space"];

    // --------------------------------------------------
    // JUMP
    // --------------------------------------------------

    if (input.jump && isGrounded) {
        jump();
    }

    // --------------------------------------------------
    // GRAVITY
    // --------------------------------------------------

    velocityY += GRAVITY;

    // Apply vertical velocity.
    player.collider.position.y += velocityY;

    // --------------------------------------------------
    // TERRAIN
    // --------------------------------------------------

    const x = player.collider.position.x;
    const z = player.collider.position.z;

    const groundY = getGroundHeight(x, z);

    const feetY =
        player.collider.position.y -
        COLLIDER_HALF_HEIGHT;

    const difference = groundY - feetY;

    // --------------------------------------------------
    // PLAYER IS TOUCHING / BELOW TERRAIN
    // --------------------------------------------------

    if (difference >= -GROUND_EPSILON) {

        player.collider.position.y =
            groundY + COLLIDER_HALF_HEIGHT;

        velocityY = 0;

        isGrounded = true;

    } else {

        isGrounded = false;
    }
}


/**
 * Try moving the player horizontally while respecting
 * terrain slope.
 *
 * Use this instead of directly changing:
 *
 * player.collider.position.x += ...
 * player.collider.position.z += ...
 *
 * Returns true if movement was allowed.
 */
export function tryMovePlayer(player, moveX, moveZ) {
    if (!player || !player.collider) {
        return false;
    }

    const currentX = player.collider.position.x;
    const currentZ = player.collider.position.z;

    const nextX = currentX + moveX;
    const nextZ = currentZ + moveZ;

    // Check the slope at the destination.
    if (!canWalkOnSlope(nextX, nextZ)) {
        return false;
    }

    // Get terrain height at destination.
    const currentGroundY =
        getGroundHeight(currentX, currentZ);

    const nextGroundY =
        getGroundHeight(nextX, nextZ);

    const currentFeetY =
        player.collider.position.y -
        COLLIDER_HALF_HEIGHT;

    /*
     * Maximum amount the player can climb in one movement
     * update.
     *
     * This prevents the player from teleporting vertically
     * onto a huge cliff.
     */
    const MAX_STEP_UP = 100000;

    const heightDifference =
        nextGroundY - currentGroundY;

    // Too large of a vertical step.
    if (
        heightDifference > MAX_STEP_UP &&
        isGrounded
    ) {
        return false;
    }

    // --------------------------------------------------
    // APPLY HORIZONTAL MOVEMENT
    // --------------------------------------------------

    player.collider.position.x = nextX;
    player.collider.position.z = nextZ;

    // --------------------------------------------------
    // FOLLOW TERRAIN
    // --------------------------------------------------

    if (isGrounded && velocityY <= 0) {

        player.collider.position.y =
            nextGroundY + COLLIDER_HALF_HEIGHT;

        velocityY = 0;
    }

    return true;
}


/**
 * Get current vertical velocity.
 */
export function getVerticalVelocity() {
    return velocityY;
}


/**
 * Reset vertical velocity.
 */
export function resetVerticalVelocity() {
    velocityY = 0;
}
