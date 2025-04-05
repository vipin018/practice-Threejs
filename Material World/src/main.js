import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'lil-gui';

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5);

const gui = new GUI();

// Renderer
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// PMREM Generator
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({
    color: '#557fa3',
    metalness: 0.6,
    roughness: 0.2,
  })
);
cube.castShadow = true;
cube.scale.set(1.5, 1, 1.5);
scene.add(cube);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: '#1f1f1f', metalness: 0.1, roughness: 0.6 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);
scene.background = new THREE.Color('#0a0f1c');

// Directional Light
const directionalLight = new THREE.DirectionalLight("#bcdfff", 0.5);
directionalLight.position.set(-5, 6, -4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);

// Point Light
const pointLight = new THREE.PointLight("#aaccff", 1, 100);
pointLight.position.set(2, 1.5, 2);
pointLight.castShadow = true;
pointLight.shadow.mapSize.set(1024, 1024);
pointLight.shadow.radius = 4;
pointLight.shadow.bias = -0.001;
scene.add(pointLight);

// Spotlight - Movie Style
const spotLight = new THREE.SpotLight("#88ccff", 10, 100, Math.PI / 8, 0.2, 2);
spotLight.position.set(0, 6, 3);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(2048, 2048);
spotLight.shadow.radius = 8;
spotLight.shadow.bias = -0.001;
scene.add(spotLight);

// Spotlight Target
const target = new THREE.Object3D();
target.position.set(0, 0, 0);
scene.add(target);
spotLight.target = target;

// Light Cone Visual (Fake Volumetric Light)
const coneGeometry = new THREE.ConeGeometry(1.5, 3, 64, 1, true);
const coneMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.08,
  side: THREE.DoubleSide,
  depthWrite: false
});
const spotlightCone = new THREE.Mesh(coneGeometry, coneMaterial);
spotlightCone.position.copy(spotLight.position);
spotlightCone.lookAt(target.position);
spotlightCone.rotateX(Math.PI);
scene.add(spotlightCone);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const directionalLightFolder = gui.addFolder("directionalLight");
directionalLightFolder.add(directionalLight, "visible");

const pointLightFolder = gui.addFolder("pointLight");
pointLightFolder.add(pointLight, "visible").name("pointLight");

const spotLightFolder = gui.addFolder("spotLight");
spotLightFolder.add(spotLight, "visible").name("spotLight");

// Animate
const clock = new THREE.Clock();
function animate() {
  const elapsedTime = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);

  const t = elapsedTime;

  pointLight.position.set(
    Math.sin(t * 0.8) * 3,
    1.5 + Math.sin(t * 0.4) * 0.5,
    Math.cos(t * 0.8) * 3
  );
  pointLight.intensity = 1 + Math.sin(t * 5) * 0.1;
  
  directionalLight.position.set(
    Math.sin(t * 0.2) * 5,
    6,
    Math.cos(t * 0.2) * 5
  );;

  spotLight.position.set(
    Math.sin(t * 0.5) * 4,
    3 + Math.cos(t * 0.25) * 1,
    Math.cos(t * 0.5) * 4
  );

  target.position.set(
    Math.sin(t) * 2,
    0,
    Math.cos(t) * 2
  );

  spotlightCone.lookAt(target.position);
  spotLight.target.position.copy(target.position);

  camera.position.lerpVectors(
    camera.position,
    new THREE.Vector3(target.position.x + 3, 2, target.position.z + 5),
    0.05
  );
  camera.lookAt(target.position);
}
animate();
