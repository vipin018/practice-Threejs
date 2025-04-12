import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

// === DOM ELEMENTS ===
const canvas = document.querySelector('#canvas');
const loadingIndicator = document.querySelector('#loading-indicator');

// === SCENE SETUP ===
const scene = new THREE.Scene();

// === CAMERA SETUP ===
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// === RENDERER SETUP ===
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

// === LOADING MANAGER ===
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => {
  loadingIndicator.style.display = 'block';
  loadingIndicator.textContent = 'Loading... 0%';
};
loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
  loadingIndicator.textContent = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
};
loadingManager.onLoad = () => {
  loadingIndicator.style.display = 'none';
};
loadingManager.onError = (url) => {
  loadingIndicator.textContent = 'Error loading assets!';
  loadingIndicator.style.color = 'red';
  console.error(`Error loading: ${url}`);
};

// === TEXTURE LOADING ===
const textureLoader = new THREE.TextureLoader(loadingManager);
const matcapTexture = textureLoader.load('/texture/tex7.jpg');

// === MATERIAL SETUP ===
const baseMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });

// === MODEL LOADING ===
const gltfLoader = new GLTFLoader(loadingManager);
let model;

gltfLoader.load(
  '/model/bottle2.glb',
  (gltf) => {
    model = gltf.scene;
    model.scale.set(0.9, 0.8, 0.9);
    model.position.y = -4;

    model.traverse((child) => {
      if (child.isMesh) {
        child.material = baseMaterial.clone();
      }
    });

    scene.add(model);
  },
  undefined,
  (err) => {
    loadingIndicator.textContent = 'Error loading model!';
    loadingIndicator.style.color = 'red';
    console.error('GLTF load error:', err);
  }
);

// === CONTROLS ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, -1, 0);
controls.enableZoom = false;
controls.update();

// === CAMERA ANIMATION HANDLER ===
function animateCamera(pos, target, duration = 1.2) {
  gsap.to(camera.position, {
    ...pos,
    duration,
    ease: 'bounce.out',
    onUpdate: () => {
      camera.lookAt(controls.target);
    }
  });

  gsap.to(controls.target, {
    ...target,
    duration,
    ease: 'bounce.out',
    onUpdate: () => {
      controls.update();
    }
  });
}

// === CAMERA PRESETS ===
const cameraPresets = {
  'Front View': () => animateCamera({ x: 0, y: 0, z: 5 }, { x: 0, y: -1, z: 0 }),
  'Top View': () => animateCamera({ x: 0, y: 5, z: 0 }, { x: 0, y: 0, z: 0 }),
  'Side View': () => animateCamera({ x: 5, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
  'Isometric': () => animateCamera({ x: 3, y: 3, z: 3 }, { x: 0, y: -1, z: 0 }),
};

// === DOM BUTTON EVENTS ===
document.querySelectorAll('#camera-buttons button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.view;
    if (cameraPresets[preset]) cameraPresets[preset]();
  });
});

// === RESIZE HANDLER ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === ANIMATION LOOP ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (model) model.rotation.y = clock.getElapsedTime() * 0.1;
  // camera.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 5;
  renderer.render(scene, camera);
}
animate();
