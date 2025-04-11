import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import gsap from 'gsap';

// === SCENE & CAMERA SETUP ===
const scene = new THREE.Scene();
// scene.background = new THREE.Color('#343434');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// === RENDERER ===
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// === LIGHTS ===
const spotLight = new THREE.PointLight(0xffffff, 100, 100, 0.5, 10, 1);
spotLight.position.set(0, 0, 1);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 10);
directionalLight1.position.set(2, 1, 2);
scene.add(directionalLight1);
const directionalLight2 = directionalLight1.clone();
directionalLight2.position.set(-2, -1, -1);
scene.add(directionalLight2);

// Light helpers
const lightHelper = new THREE.PointLightHelper(spotLight, 0.5);
// scene.add(lightHelper);

const directionalLightHelper1 = new THREE.DirectionalLightHelper(directionalLight1, 0.5);
// scene.add(directionalLightHelper1);

const directionalLightHelper2 = new THREE.DirectionalLightHelper(directionalLight2, 0.5);
// scene.add(directionalLightHelper2);

// === BOTTLE MATERIAL ===
const bottleMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x080808),
  roughness: 0.3,
  metalness: 0.9,
  emissive: new THREE.Color(0x080808),
  emissiveIntensity: 0.5,
});

// === GLTF MODEL LOAD ===
const loader = new GLTFLoader();
loader.load('/model/bottle2.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.7, 0.7, 0.7);
  model.position.y = -3;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = bottleMaterial.clone();
    }
  });

  scene.add(model);
}, undefined, (error) => {
  console.error('Failed to load model:', error);
});

// === HDRI ENVIRONMENT ===
const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/photo_studio_01_2k.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  // scene.background = environmentMap;
  scene.environment = environmentMap;
});

// === CONTROLS ===
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

// === RESIZE HANDLER ===
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// === ANIMATION LOOP ===
const clock = new THREE.Clock();
function animate() {
  const elapsedTime = clock.getElapsedTime();
  // controls.update();

  // Animate directional lights
  directionalLight1.position.x = -Math.sin(elapsedTime * 1);
  directionalLight1.position.y = Math.cos(elapsedTime * 1);

  directionalLight2.position.x = Math.sin(elapsedTime * 1);
  directionalLight2.position.y = -Math.cos(elapsedTime * 1);
  directionalLight2.position.z = Math.sin(elapsedTime * 1);

  // Subtle camera pulsing
  camera.position.z = 5 + Math.sin(elapsedTime * 0.5) * 0.2;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// === NAVBAR GSAP ANIMATIONS ===

const nav = document.querySelector('nav');
gsap.from(nav, {
  opacity: 0,
  duration: 2,
  scale: 0,
  ease: 'elastic.out',
});

const text = document.querySelector('#hero_text h1');
gsap.from(text, {
  opacity: 0,
  duration: 2,
  delay: 1,
  scale: 0,
  ease: 'bounce.out',
});
