// // import Stats from 'stats.js/src/Stats';
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { PCDLoader } from "three/addons/loaders/PCDLoader.js";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  MeshBVHVisualizer,
  INTERSECTED,
  NOT_INTERSECTED,
  SAH,
  CENTER,
  AVERAGE,
} from "three-mesh-bvh";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const pointShaderColor = {
  vertex: `
      attribute float displacement;
      varying float vDisplacement;
      void main() {
        gl_PointSize = 10.;
        vDisplacement = displacement;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_PointSize = 50. * (1. / -mvPosition.z);
       
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
  fragment: `
      uniform vec3 u_color;
      varying float vDisplacement;
      void main() {
        vec4 color = vec4(u_color,1.);
        gl_FragColor = color;
        if(vDisplacement > 10.5){
            gl_FragColor = vec4(1.,1.,1.,1.);
        }
        
      }`,
};
// let stats;
let scene, camera, renderer, bvhMesh, helper, pointCloud, outputContainer;
let mouse = new THREE.Vector2();
let sphereCollision;
let displacement;
let points;
let counter = 0;
const plyPath = "../assets/scene.ply";
const raycaster = new THREE.Raycaster();
const params = {
  displayHelper: false,
  helperDepth: 10,
  displayParents: false,

  strategy: CENTER,
  pointSize: 0.5,
  raycastThreshold: 0.005,
  useBVH: true,
};
const uniforms_ = {
  u_color: { value: new THREE.Color(0x00ff00) },
  u_maxPointSize: { value: 2.0 },
  u_isBounding: { value: false },
  u_min: { value: new THREE.Vector3(-5.0, -5.0, -5.0) },
  u_max: { value: new THREE.Vector3(5.0, 5.0, 5.0) },
};
function init() {
  const bgColor = 0x263238 / 2;

  outputContainer = document.getElementById("output");

  // renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(bgColor, 1);
  document.body.appendChild(renderer.domElement);

  // scene setup
  scene = new THREE.Scene();

  // camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5000000
  );
  camera.position.set(3, 3, 3);
  camera.updateProjectionMatrix();

  new OrbitControls(camera, renderer.domElement);

  // stats setup
  // stats = new Stats();
  // document.body.appendChild( stats.dom );

  window.addEventListener(
    "resize",
    function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  // Load point cloud
  const loader = new PLYLoader();
  loader.load(plyPath, (geometry) => {
    // geometry.center();
    // const material = new THREE.PointsMaterial({
    //   size: params.pointSize,
    //   vertexColors: true,
    // });
    // pointCloud = new THREE.Points(geometry, material);
    // pointCloud.matrixAutoUpdate = false;
    // scene.add(pointCloud);
    // BVH Mesh creation
    // const indices = [];
    // const bvhGeometry = geometry.clone();
    // let verticesLength = bvhGeometry.attributes.position.count;
    // for (let i = 0, l = verticesLength; i < l; i++) {
    //   indices.push(i, i, i);
    // }
    // bvhGeometry.setIndex(indices);
    // const bvhMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // bvhMesh = new THREE.Mesh(bvhGeometry, bvhMaterial);
    // console.time("computeBoundsTree");
    // bvhMesh.geometry.computeBoundsTree({ mode: params.mode });
    // console.timeEnd("computeBoundsTree");
    // helper = new MeshBVHVisualizer( bvhMesh, params.depth );
    // scene.add( helper );
  });

  const pcdLoader = new PCDLoader();
  pcdLoader.load("../assets/_71.pcd", (_points) => {
    const geometry = _points.geometry;
    geometry.center();
    // const material = new THREE.PointsMaterial({
    //   size: params.pointSize,
    //   color: 0xffffff,
    // });
    const shaderMaterial = new THREE.ShaderMaterial({
      fragmentShader: pointShaderColor.fragment,
      vertexShader: pointShaderColor.vertex,
      uniforms: uniforms_,
      depthTest: false,
    });
    const displacementFloat = new Float32Array(
      geometry.attributes.position.count
    );
    for (let i = 0; i < displacementFloat.length; i++) {
      displacementFloat[i] = Math.random();
    }
    displacement = new THREE.BufferAttribute(displacementFloat, 1);
    geometry.setAttribute("displacement", displacement);

    pointCloud = new THREE.Points(geometry, shaderMaterial);
    pointCloud.matrixAutoUpdate = false;
    pointCloud.rotation.set(-Math.PI * 0.5, 0, Math.PI * 0.23);
    
    scene.add(pointCloud);
    console.log(
      pointCloud.geometry.attributes.position.getX(0),
      "~~pointCloud~~~",
      pointCloud
    );

    // BVH Mesh creation
    const indices = [];
    const bvhGeometry = _points.geometry.clone();
    let verticesLength = bvhGeometry.attributes.position.count;
    for (let i = 0, l = verticesLength; i < l; i++) {
      indices.push(i, i, i);
    }

    bvhGeometry.setIndex(indices);
    const bvhMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    bvhMesh = new THREE.Mesh(bvhGeometry, bvhMaterial);

    console.time("computeBoundsTree");
    bvhMesh.geometry.computeBoundsTree({ mode: params.mode });
    console.timeEnd("computeBoundsTree");
    console.log(bvhMesh, "~~~", params.mode);
  });

  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.9,
    transparent: true,
  });
  sphereCollision = new THREE.Mesh(geometry, material);
  sphereCollision.visible = false;
  scene.add(sphereCollision);

  const gui = new GUI();
  const helperFolder = gui.addFolder("helper");
  helperFolder.add(params, "displayHelper");
  helperFolder.add(params, "displayParents").onChange((v) => {
    helper.displayParents = v;
    helper.update();
  });
  helperFolder
    .add(params, "helperDepth", 1, 20, 1)
    .name("depth")
    .onChange((v) => {
      helper.depth = parseInt(v);
      helper.update();
    });
  helperFolder.open();

  const pointsFolder = gui.addFolder("points");
  pointsFolder.add(params, "useBVH");
  pointsFolder
    .add(params, "strategy", { CENTER, AVERAGE, SAH })
    .onChange((v) => {
      console.time("computeBoundsTree");
      bvhMesh.geometry.computeBoundsTree({ strategy: parseInt(v) });
      console.timeEnd("computeBoundsTree");
      helper.update();
    });
  pointsFolder.add(params, "pointSize", 0.001, 0.01, 0.001);
  pointsFolder.add(params, "raycastThreshold", 0.001, 0.01, 0.001);
  pointsFolder.open();
}

window.addEventListener(
  "pointermove",
  (event) => {
    if (!bvhMesh) {
      return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const startTime = window.performance.now();
    if (params.useBVH) {
      sphereCollision.visible = false;

      const inverseMatrix = new THREE.Matrix4();
      inverseMatrix.copy(bvhMesh.matrixWorld).invert();
      raycaster.ray.applyMatrix4(inverseMatrix);

      const threshold = raycaster.params.Points.threshold;
      const localThreshold =
        threshold / ((bvhMesh.scale.x + bvhMesh.scale.y + bvhMesh.scale.z) / 3);
      const localThresholdSq = localThreshold * localThreshold;

      const { ray } = raycaster;
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
    } else {
      const intersects = raycaster.intersectObject(pointCloud, true);
      const hit = intersects[0];
      console.log(hit);
      if (hit) {
        sphereCollision.position.copy(hit.point);
        sphereCollision.visible = true;
      } else {
        sphereCollision.visible = false;
      }
    }

    const delta = window.performance.now() - startTime;
    outputContainer.innerText = `${delta.toFixed(2)}ms`;
  },
  false
);

function render() {
  requestAnimationFrame(render);

  if (pointCloud) {
    pointCloud.material.size = params.pointSize;
    // helper.visible = params.displayHelper;
    raycaster.params.Points.threshold = params.raycastThreshold;
  }

  // stats.begin();

  renderer.render(scene, camera);
  //   if (counter === 100) {
  //     for (
  //       let i = 0;
  //       i < pointCloud.geometry.attributes.displacement.array.length;
  //       i++
  //     ) {
  //       pointCloud.geometry.attributes.displacement.array[i] = 100.0;
  //     }
  //     pointCloud.geometry.attributes.displacement.needsUpdate = true;
  //     debugger
  //   }
  //   if(counter < pointCloud.geometry.attributes.displacement.array.length){
  //     pointCloud.geometry.attributes.displacement.array[counter] = 100.0;
  //     pointCloud.geometry.attributes.displacement.needsUpdate = true;
  //   }
  counter++;
  // stats.end();
  pointCloud?.position.set(counter, 0, 0);
}

init();
render();
