import { initEngine } from "./Engine/engineInitializer.js";
import { startEngine } from "./Engine/engine.js";

async function play() {
    const canvas = document.getElementById("gameCanvas");

    const {engine, scene, player, camera} = await initEngine(canvas);
    startEngine({engine, scene, player, camera});
}

play();