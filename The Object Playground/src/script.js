import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { GUI } from 'lil-gui';
import { gsap } from 'gsap';

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
});
renderer.shadowMap.enabled = true;
// stats
const stats = new Stats();
document.body.appendChild(stats.dom);


// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 2, 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;

scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(directionalLightHelper);

const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(helper)


renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1);
const torusGeometry = new THREE.TorusGeometry(0.5, 0.2);
torusGeometry.castShadow = true;
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

cube.castShadow = true;
sphere.castShadow = true;
cylinder.castShadow = true;
torus.castShadow = true;
octahedron.castShadow = true;


scene.add(cube);
scene.add(sphere);
scene.add(cylinder);
scene.add(torus);
scene.add(octahedron);

scene.background = new THREE.Color("#afeeee");

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
const floorMaterial = new THREE.MeshStandardMaterial({ color: "ghostwhite" });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);

camera.position.z = 5;



// lil-gui
const gui = new GUI();
gui.add(directionalLight, "intensity").min(0).max(3).step(0.001).name("Light Intensity");

const lightFolder = gui.addFolder('Light Position');
lightFolder.add(directionalLight.position, "x").min(-10).max(10).step(0.01).name("X");
lightFolder.add(directionalLight.position, "y").min(-10).max(10).step(0.01).name("Y");
lightFolder.add(directionalLight.position, "z").min(-10).max(10).step(0.01).name("Z");

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

const clock = new THREE.Clock();
// 🌀 Animation loop
function animate() {
    stats.update();
    requestAnimationFrame(animate);
    control.update();
    renderer.render(scene, camera);
    const time = clock.getElapsedTime();

    directionalLight.position.x = Math.sin(time) * 2;
    directionalLight.position.z = Math.cos(time) * 2;

    camera.position.x = Math.sin(time) * 5;
    camera.position.z = Math.cos(time) * 5;

}

animate();

// GSAP

const tl = gsap.timeline();

tl
    .to(sphere.position, {
        y: 2,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
    })

    .to(torus.position, {
        x: 2,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
    })

    .to(cylinder.position, {
        z: 2,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
    })

    .to(cube.position, {
        z: 2,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
    })

    .to(octahedron.position, {
        x: 2,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
    });

    gsap.to(camera.position, {
        z: 4,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
    }   );
