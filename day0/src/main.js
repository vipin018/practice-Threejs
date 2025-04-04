import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// camera.position.set(2, 2, 3);
camera.position.set(0, 0, 5);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

renderer.setSize(window.innerWidth, window.innerHeight);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
const capsuleGeo = new THREE.CapsuleGeometry(1, 1, 16, 16);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
const torusGeo = new THREE.TorusGeometry(1, 0.5, 16, 64);
const coneGeo = new THREE.ConeGeometry(1, 2, 16);
const torusKnotGeo = new THREE.TorusKnotGeometry(1, 0.4, 128, 64, 2, 3);
const planeGeo = new THREE.PlaneGeometry(10, 10);
const ringGeo = new THREE.RingGeometry(1, 2, 32);


const material = new THREE.MeshStandardMaterial({ 
    color: "cadetblue",
    roughness: 0.2,
    metalness: 0.7,
    side: THREE.DoubleSide,
    
 });
// const material = new THREE.MeshNormalMaterial({ wireframe: false });

const cube = new THREE.Mesh(boxGeo, material);
const sphere = new THREE.Mesh(sphereGeo, material);
const capsule = new THREE.Mesh(capsuleGeo, material);
const cylinder = new THREE.Mesh(cylinderGeo, material);
const torus = new THREE.Mesh(torusGeo, material);
const cone = new THREE.Mesh(coneGeo, material);
const torusKnot = new THREE.Mesh(torusKnotGeo, material);
const plane = new THREE.Mesh(planeGeo, material);
const ring = new THREE.Mesh(ringGeo, material);

scene.add(cube);
cube.position.set(0, 0, 0);
cube.scale.set(0.8, 0.8, 0.8);

scene.add(sphere);
sphere.position.set(2, 0, 0);
sphere.scale.set(0.8, 0.8, 0.8);

scene.add(capsule);
capsule.position.set(-2, 0, 0);
capsule.scale.set(0.5, 0.5, 0.5);

scene.add(cylinder);
cylinder.scale.set(0.5, 1, 0.5);
cylinder.position.set(0, 2, 0);

scene.add(torus);
torus.scale.set(0.5, 0.5, 0.5);
torus.position.set(0, -2, 0);

scene.add(cone);
cone.scale.set(0.5, 0.5, 0.5);
cone.position.set(2, 2, 0);

scene.add(torusKnot);
torusKnot.scale.set(0.5, 0.5, 0.5);
torusKnot.position.set(-2, 2, 0);

scene.add(plane);
plane.scale.set(0.15, 0.15, 0.1);
plane.position.set(2, -2, 0);


scene.add(ring);
ring.scale.set(0.3, 0.3, 2);
ring.position.set(-2, -2, 0);

const group = new THREE.Group();
group.add(cube, sphere, capsule, cylinder, torus, cone, torusKnot, plane, ring);
scene.add(group);
group.position.set(0, -0.5, 0);

const control = new OrbitControls(camera, renderer.domElement);
control.enableDamping = true;

function animate() {
    requestAnimationFrame(animate);
    control.update();
    renderer.render(scene, camera);
    cube.rotation.x += Math.sin(0.01);
    sphere.rotation.y += Math.sin(0.01);
    capsule.rotation.z += Math.sin(0.01);
    cylinder.rotation.x += Math.sin(0.01);
    torus.rotation.y += Math.sin(0.01);
    cone.rotation.z += Math.sin(0.01);
    torusKnot.rotation.x += Math.sin(0.01);
    plane.rotation.y += Math.sin(0.01);
    ring.rotation.z += Math.sin(0.01);

}

animate();

