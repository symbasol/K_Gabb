export function updateCamera(scene, player, camera, dt) {
    camera.target.copyFrom(player.pivot.position);
    camera.alpha = Math.PI / 2 - player.pivot.rotation.y;
}
