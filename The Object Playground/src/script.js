import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const canvas = document.querySelector('#canvas');

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
});

// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);



renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1);
const torusGeometry = new THREE.TorusGeometry(0.5, 0.2);
const octahedronGeometry = new THREE.OctahedronGeometry(1);


const basicMaterial = new THREE.MeshBasicMaterial({ color: "gold" });
const phongMaterial = new THREE.MeshPhongMaterial({ color: "red" });
const lambertMaterial = new THREE.MeshLambertMaterial({ color: "lime" });
const standardMaterial = new THREE.MeshStandardMaterial({ color: "powderblue" });
const normalMaterial = new THREE.MeshNormalMaterial();


const cube = new THREE.Mesh(boxGeometry, basicMaterial);
const sphere = new THREE.Mesh(sphereGeometry, phongMaterial);
const cylinder = new THREE.Mesh(cylinderGeometry, lambertMaterial);
const torus = new THREE.Mesh(torusGeometry, standardMaterial);
const octahedron = new THREE.Mesh(octahedronGeometry, normalMaterial);


scene.add(cube);
scene.add(sphere);
scene.add(cylinder);
scene.add(torus);
scene.add(octahedron);

sphere.position.x = -2;
cylinder.position.x = 2;
torus.position.z = 2;
octahedron.position.z = -2;

// group
const group = new THREE.Group();
scene.add(group);

group.add(cube);
group.add(sphere);
group.add(cylinder);
group.add(torus);
group.add(octahedron);  
// floor

const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshBasicMaterial({ color: "gray" });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

camera.position.z = 5;

// ✅ Resize listener
window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size and pixel ratio
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const control = new OrbitControls(camera, renderer.domElement);
control.enableDamping = true;

// 🌀 Animation loop
function animate() {
    requestAnimationFrame(animate);
    control.update();
    renderer.render(scene, camera);
}

animate();
