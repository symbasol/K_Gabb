// shadow.js
export function createShadowGenerator(scene, sun) {
    sun.position = new BABYLON.Vector3(10, 20, 10);

    const shadowGen = new BABYLON.ShadowGenerator(1024, sun);

    // Better shadow quality settings
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;

    return { sun, shadowGen };
}