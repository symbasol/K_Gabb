import { initEngine } from "./Engine/INIT.js";
import { startEngine } from "./Engine/ENGINE.JS";
import { NoiseSettings } from "./Engine/ground/procedural/settings.js"

const canvas = document.getElementById("testCanvas");

const {engine, scene, camera, light } = initEngine({canvas});

startEngine({engine, scene, camera, light});