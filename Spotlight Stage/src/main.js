import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5);

// Renderer
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// scene.add(ambientLight);

// SpotLight (cinematic)
const spotLight = new THREE.SpotLight(0xffffff, 5, 50,  0.1082 * Math.PI, 0.1, 1);
spotLight.position.set(2, 5, 3);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(1024, 1024);
scene.add(spotLight);
scene.add(spotLight.target);

const spotLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(spotLightHelper);

// Point Light (moving)
const pointLight = new THREE.PointLight(0xff0040, 10, 10);
pointLight.castShadow = true;
scene.add(pointLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
// scene.add(pointLightHelper);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(1, 2, 3);
scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
// scene.add(directionalLightHelper);

// Floor / Stage
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.5, 10),
  new THREE.MeshStandardMaterial({ color: '#557fa3' })
);
stage.position.set(0, -2.3, 0);
stage.receiveShadow = true;
scene.add(stage);

// GLTF Model with animation
let model, mixer;
const loader = new GLTFLoader();
loader.load(
  './animated_model/scene.gltf',
  function (gltf) {
    model = gltf.scene;
    model.scale.set(2.2, 2.2, 2.2);
    model.position.set(1, -2, 0);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model);

    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }
  },
  undefined,
  function (error) {
    console.error('An error occurred while loading the model:', error);
  }
);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// lil-gui Controls
// const gui = new GUI();

// Spotlight controls
// const spotFolder = gui.addFolder('Spotlight');
// spotFolder.add(spotLight, 'intensity', 0, 5, 0.1);
// spotFolder.add(spotLight, 'angle', 0, Math.PI / 2, 0.01);
// spotFolder.add(spotLight.position, 'x', -10, 10, 0.1).name('X');
// spotFolder.add(spotLight.position, 'y', 0, 10, 0.1).name('Y');
// spotFolder.add(spotLight.position, 'z', -10, 10, 0.1).name('Z');

// Point light animation
const pointLightConfig = {
  radius: 3,
  speed: 1,
  color: pointLight.color.getHex()
};
// const pointFolder = gui.addFolder('Point Light');
// pointFolder.addColor(pointLightConfig, 'color').onChange((val) => {
//   pointLight.color.set(val);
// });
// pointFolder.add(pointLightConfig, 'radius', 0, 10, 0.1);
// pointFolder.add(pointLightConfig, 'speed', 0.1, 5, 0.1);

// Shadow toggle
// const shadowConfig = { enabled: true };
// gui.add(shadowConfig, 'enabled').name('Shadows').onChange((val) => {
//   renderer.shadowMap.enabled = val;
//   spotLight.castShadow = val;
//   pointLight.castShadow = val;
// });

// Animate
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  if (mixer) mixer.update(delta);

  // Animate point light in circle
  const r = pointLightConfig.radius;
  const s = pointLightConfig.speed;
  pointLight.position.set(
    Math.cos(time * s) * r,
    2 + Math.sin(time * s) * 0.5,
    Math.sin(time * s) * r
  );

  controls.update();
  renderer.render(scene, camera);

  camera.position.x = Math.sin(time * 0.1) * 5  ;
  camera.position.z = Math.cos(time * 0.1) ;
}
animate();
