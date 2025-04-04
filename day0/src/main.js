import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(2, 2, 3);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});


renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: "orange" });
// const material = new THREE.MeshNormalMaterial();
const material = new THREE.MeshPhongMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cube.scale.set(1.5, 1.5, 1.5);


const control = new OrbitControls(camera, renderer.domElement);
control.enableDamping = true;

function animate() {
    requestAnimationFrame(animate);
    control.update();
    renderer.render(scene, camera);
}

animate();
