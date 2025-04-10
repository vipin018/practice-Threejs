import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Scene & Camera Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 2.5);

// Renderer
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  // alpha: true,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// scene.background = new THREE.Color("blue");

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 15, 100, Math.PI / 2, 0.1, 0.5);
spotLight.position.set(0, 2, 0);
scene.add(spotLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight1.position.set(1, 2, 3);
// scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(-1, -2, -3);
// scene.add(directionalLight2);

const pointLight = new THREE.PointLight(0xffffff, 10, 100, 1);
pointLight.position.set(0, 1, 0);
// scene.add(pointLight);

const backlight  = new THREE.DirectionalLight(0xffffff, 10);
backlight.position.set(0, -1, 0);
scene.add(backlight);

// Texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
  '/texture/texture4.jpg',
  () => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.repeat.set(20, 10);
  },
  undefined,
  (error) => {
    console.error('Error loading texture:', error);
  }
);

// Load GLB Model
const loader = new GLTFLoader();
loader.load(
  '/model/perfume.glb',
  (gltf) => {
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh && texture) {
        child.material.map = texture;
        child.material.needsUpdate = true;
      }
    });

    // model.scale.set(20, 20, 20);
    model.position.set(0, -1, 0);
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error('Error loading GLB model:', error);
  }
);

// Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
const clock = new THREE.Clock();
function animate() {
  const elapsedTime = clock.getElapsedTime();
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  directionalLight1.position.x = Math.sin(elapsedTime);
  directionalLight1.position.y = Math.cos(elapsedTime);

  directionalLight2.position.x = Math.sin(elapsedTime);
  directionalLight2.position.y = Math.cos(elapsedTime);

  pointLight.position.x = Math.sin(elapsedTime);
  pointLight.position.z = Math.cos(elapsedTime);

  spotLight.position.x = Math.sin(elapsedTime);
  spotLight.position.y = Math.cos(elapsedTime);
}
animate();
