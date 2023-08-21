import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Polygon from "./polygon.js";
import PCDViewer from "./pcdViewer.js";
import Brush from "./brush.js";
import PointBrush from "./pointBrush.js";
import UI from "./ui.js";
import { MODE } from "./util.js";
const uvGridUrl = "../assets/uv_grid_directx.jpg";
let mode = MODE.pointBrush;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 50, 50);
camera.up.set(0, 0, 1)
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const map = new THREE.TextureLoader().load(uvGridUrl);
map.wrapS = map.wrapT = THREE.RepeatWrapping;
map.anisotropy = 16;
const bGeometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  map: map,
  color: 0x00ff00,
});

const cube = new THREE.Mesh(bGeometry, material);
scene.add(cube);
cube.position.z = 0;
cube.visible = false;
const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
scene.add(gridHelper);
gridHelper.visible = false;
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableRotate = false;
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
document.addEventListener("pointerup", (e) => {
  touchEvent(e, "pointerUp");
});
document.addEventListener("pointermove", (e) => {
  touchEvent(e, "pointerMove");
});
document.addEventListener("keydown", (e) => {
  dealWithKeyboard(e, "keydown");
});
document.addEventListener("keyup", (e) => {
  dealWithKeyboard(e, "keyUp");
});
animate();
const setMode = (val) => {
  mode = val;
};

const polygon = new Polygon(scene, camera, orbitControls);
const brush = new Brush(scene, camera, renderer);
new UI(setMode.bind(this), mode);
const pcdViewer = new PCDViewer(scene);
const pointBrush = new PointBrush(scene, camera, pcdViewer);
function touchEvent(event, type) {
  switch (mode) {
    case MODE.polygon:
      polygon.touchEvent(event, type);
      break;
    case MODE.pointBrush:
      pointBrush.touchEvent(event, type);
      break;
  }
}

function dealWithKeyboard(event, type) {
  if (event.keyCode === 27) {
    polygon.reset = true;
    polygon.meshNext.visible = false;
  }
  if (event.keyCode === 32) {
    orbitControls.enableRotate = event.type === "keydown";
  }
  brush?.dealWithKeyboard(event);
}
