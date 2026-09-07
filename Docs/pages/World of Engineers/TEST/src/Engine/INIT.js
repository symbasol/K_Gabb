export function initEngine({canvas}) {
    const engine = new BABYLON.Engine(canvas, true);

    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        1.2,
        10,
        new BABYLON.Vector3(0, 0, 0),
        scene
    )

    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    )

    return { engine, scene, camera, light };
}