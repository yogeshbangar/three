import { PCDLoader } from "three/addons/loaders/PCDLoader.js";
import * as THREE from "three";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
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

export default class PCDViewer {
  points;
  bvhMesh;
  sphereCollision;
  constructor(scene) {
    const loader = new PCDLoader();
    this.sphereCollision = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    this.sphereCollision.visible = false;
    scene.add(this.sphereCollision);
    loader.load("../assets/_71.pcd", (points) => {
      const uniforms_ = {
        u_color: { value: new THREE.Color(0x00ff00) },
        u_maxPointSize: { value: 2.0 },
        u_isBounding: { value: false },
        u_min: { value: new THREE.Vector3(-5.0, -5.0, -5.0) },
        u_max: { value: new THREE.Vector3(5.0, 5.0, 5.0) },
      };
      const geometry = points.geometry;
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
      this.displacement = new THREE.BufferAttribute(displacementFloat, 1);
      geometry.setAttribute("displacement", this.displacement);
      this.points = new THREE.Points(geometry, shaderMaterial);
      this.points.matrixAutoUpdate = false;
      scene.add(this.points);

      // BVH Mesh creation
      const indices = [];
      const bvhGeometry = geometry.clone();
      let verticesLength = bvhGeometry.attributes.position.count;
      for (let i = 0, l = verticesLength; i < l; i++) {
        indices.push(i, i, i);
      }

      bvhGeometry.setIndex(indices);
      const bvhMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.bvhMesh = new THREE.Mesh(bvhGeometry, bvhMaterial);

      console.time("computeBoundsTree");
      this.bvhMesh.geometry.computeBoundsTree();
      console.timeEnd("computeBoundsTree");
      console.log(this.bvhMesh);
    });
  }
}
