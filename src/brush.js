import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
export default class Brush {
  pointer = new THREE.Vector2();
  scene;
  camera;
  transformControls;
  cubeBrush;
  shouldPaint = false;
  paintObject = new THREE.Group();
  isPencil = false;
  isEraser = false;
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.transformControls = new TransformControls(camera, renderer.domElement);
    this.scene.add(this.transformControls);
    this.init();
  }
  init() {
    const pointSize = document.getElementById("pointSize");
    pointSize.oninput = (e) => {
      const size = Number(e.target.value) * 0.02;
      this.cubeBrush?.scale.set(size, size, size);
    };
    this.cubeBrush = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      })
    );
    this.scene.add(this.cubeBrush);
    this.scene.add(this.paintObject);
    // this.transformControls.attach(this.cubeBrush);
    this.transformControls.addEventListener(
      "dragging-changed",
      this.draggingChanged_.bind(this)
    );
    this.transformControls.addEventListener(
      "change",
      this.onBoxChange_.bind(this)
    );
  }
  draggingChanged_(e) {
    this.shouldPaint = e.value;
  }
  onBoxChange_(e) {
    if (this.shouldPaint) {
      let distance = 111110;
      if (this.isPencil) {
        if (this.paintObject.children.length > 0) {
          const pos =
            this.paintObject.children[this.paintObject.children.length - 1]
              .position;
          distance = this.cubeBrush.position.distanceTo(pos);
        }
        if (distance > this.cubeBrush?.scale.x * 0.41)
          this.paintObject.add(this.cubeBrush.clone());
      }
      if (this.isEraser) {
        if (this.paintObject.children.length > 0) {
          this.paintObject.children.forEach((obj) => {
            const pos = obj.position;
            distance = this.cubeBrush.position.distanceTo(pos);
            if (distance < this.cubeBrush?.scale.x * 0.5)
              this.paintObject.remove(obj);
          });
        }
      }
    }
  }
  dealWithKeyboard(event) {
    if (event.key.toLowerCase() === "z") {
      this.isPencil = event.type === "keydown";
    }
    if (event.key.toLowerCase() === "x") {
      this.isEraser = event.type === "keydown";
    }
  }
}
