import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

// === DOM ===
const canvas = document.querySelector('#canvas');
const loadingIndicator = document.querySelector('#loading-indicator');

// === Scene Setup ===
const scene = new THREE.Scene();

// === Camera Setup ===
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);

// === Renderer Setup ===
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

// === Loading Manager ===
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => loadingIndicator.style.display = 'block';
loadingManager.onLoad = () => loadingIndicator.style.display = 'none';
loadingManager.onProgress = (_, loaded, total) => {
  loadingIndicator.textContent = `Loading... ${Math.round((loaded / total) * 100)}%`;
};
loadingManager.onError = () => {
  loadingIndicator.textContent = 'Error loading!';
  loadingIndicator.style.color = 'red';
};

// === Texture ===
const textureLoader = new THREE.TextureLoader(loadingManager);
const matcap = textureLoader.load('/texture/tex7.jpg');
const material = new THREE.MeshMatcapMaterial({ matcap });

// === Load Model ===
const gltfLoader = new GLTFLoader(loadingManager);
let model;

gltfLoader.load('/model/bottle2.glb', (gltf) => {
  model = gltf.scene;
  model.scale.set(0.01, 0.01, 0.01);
  model.position.y = -4;

  model.traverse((child) => {
    if (child.isMesh) child.material = material.clone();
  });

  scene.add(model);
  runIntroAnimation();
});

// === GSAP Animation ===
function runIntroAnimation() {
  gsap.to(model.scale, {
    x: 0.9,
    y: 0.8,
    z: 0.9,
    duration: 1.5,
    ease: "expo.out",
    delay: 0.2
  });

  gsap.from(camera.position, {
    z: 12,
    duration: 1.5,
    ease: "power2.out"
  });

  gsap.from("#hero_text h1", {
    opacity: 0,
    y: 50,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.6
  });
}

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, -1, 0);
controls.update();

// === Camera Presets ===
const cameraPresets = {
  front: () => setCamera(0, 0, 8),
  top: () => setCamera(0, 8, 0),
  side: () => setCamera(8, 0, 0),
};

function setCamera(x, y, z) {
  gsap.to(camera.position, {
    x, y, z,
    duration: 1,
    ease: "sin.out",
    onUpdate: () => controls.update()
  });
}

// === Buttons Hook ===
document.querySelectorAll('#camera-buttons button').forEach(btn => {
  const view = btn.dataset.view;
  if (cameraPresets[view]) {
    btn.addEventListener('click', () => cameraPresets[view]());
  }
});

// === Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Loop ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y = clock.getElapsedTime() * 0.1;
  controls.update();
  renderer.render(scene, camera);
}
animate();
