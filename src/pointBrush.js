import * as THREE from "three";
import { INTERSECTED, NOT_INTERSECTED } from "three-mesh-bvh";
export default class PointBrush {
  pcdViewer;
  scene;
  camera;
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();
  constructor(scene, camera, pcdViewer) {
    this.scene = scene;
    this.camera = camera;
    this.pcdViewer = pcdViewer;
    this.cubeBrush = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      })
    );
    this.scene.add(this.cubeBrush);
  }
  touchEvent(event, type) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const bvhMesh = this.pcdViewer.bvhMesh;
    const pointCloud = this.pcdViewer.points;
    const sphereCollision = this.pcdViewer.sphereCollision;
    if (!bvhMesh) {
      return;
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const startTime = window.performance.now();
    sphereCollision.visible = false;
    const inverseMatrix = new THREE.Matrix4();
    inverseMatrix.copy(bvhMesh.matrixWorld).invert();
    this.raycaster.ray.applyMatrix4(inverseMatrix);

    const threshold = this.raycaster.params.Points.threshold;
    const localThreshold =
      threshold / ((bvhMesh.scale.x + bvhMesh.scale.y + bvhMesh.scale.z) / 3);
    const localThresholdSq = localThreshold * localThreshold;

    const { ray } = this.raycaster;
    let closestDistance = Infinity;
    bvhMesh.geometry.boundsTree.shapecast({
      boundsTraverseOrder: (box) => {
        // traverse the closer bounds first.
        return box.distanceToPoint(ray.origin);
      },
      intersectsBounds: (box, isLeaf, score) => {
        // if we've already found a point that's closer then the full bounds then
        // don't traverse further.
        if (score > closestDistance) {
          return NOT_INTERSECTED;
        }

        box.expandByScalar(localThreshold);
        return ray.intersectsBox(box) ? INTERSECTED : NOT_INTERSECTED;
      },
      intersectsTriangle: (triangle) => {
        const distancesToRaySq = ray.distanceSqToPoint(triangle.a);
        if (distancesToRaySq < localThresholdSq * 100000) {
          for (
            let i = 0;
            i < pointCloud.geometry.attributes.position.count &&
            triangle.points.length > 0;
            i++
          ) {
            if (
              pointCloud.geometry.attributes.position.getX(i) ===
              triangle.points[0].x
            ) {
              pointCloud.geometry.attributes.displacement.array[i] = 100.0;
              pointCloud.geometry.attributes.displacement.needsUpdate = true;
            }
          }
          const distanceToPoint = ray.origin.distanceTo(triangle.a);
          if (distanceToPoint < closestDistance) {
            closestDistance = distanceToPoint;
            sphereCollision.position
              .copy(triangle.a)
              .applyMatrix4(bvhMesh.matrixWorld);
            sphereCollision.visible = true;
          }
        }
      },
    });

    // const delta = window.performance.now() - startTime;
    // outputContainer.innerText = `${delta.toFixed(2)}ms`;
  }
}
