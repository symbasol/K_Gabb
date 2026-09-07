// worldConfig.js

export const WORLD = {
    CHUNK_SIZE: 32,
    CHUNK_SUBDIVISIONS: 20,

    NOISE_SCALE: 2,
    HEIGHT_SCALE: 1,

    TREE_NOISE_SCALE: 0.05,
    TREE_DENSITY: {
        plains: 0.05,
        forest: 0.4,
        mountain: 0.0
    },

    RENDER_DISTANCE: 20,
    MAX_TREES_PER_CHUNK: 40
};