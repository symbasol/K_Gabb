import { startWebGL } from "./webgl.js";
import { startEditor } from "./editorEngine.js";

const canvas = document.getElementById("editorCanvas");
const { engine, scene } = startWebGL(canvas);

startEditor({ engine, scene });
