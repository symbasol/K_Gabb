import { createNoise2D } from "https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm";
import { NoiseSettings } from "./settings.js";

const rand = mulberry32(12345);
const noise2D = createNoise2D(rand);

export function Simplex2d(x, y) {

    let total = 0;

    let amplitude = 1;
    let frequency = 1;

    let maxAmplitude = 0;

    for (let i = 0; i < NoiseSettings.octaves; i++) {

        const nx =
            x *
            NoiseSettings.scale *
            frequency;

        const ny =
            y *
            NoiseSettings.scale *
            frequency;

        total +=
            noise2D(nx, ny) *
            amplitude;

        maxAmplitude += amplitude;

        amplitude *=
            NoiseSettings.persistence;

        frequency *=
            NoiseSettings.lacunarity;
    }

    // NORMALIZE TO [-1, 1]
    total /= maxAmplitude;

    // APPLY HEIGHT SCALE
    return total * NoiseSettings.height;
}

function mulberry32(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}