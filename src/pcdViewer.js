import { PCDLoader } from "three/addons/loaders/PCDLoader.js";
export default class PCDViewer {
  points;
  constructor(scene) {
    const loader = new PCDLoader();
    loader.load("../assets/_71.pcd", (points) => {
      this.points = points;
      points.rotation.set(-Math.PI * 0.5, 0, Math.PI * 0.23);
      points.position.set(78, 0, 0);
      scene.add(points);
    });
  }
}
