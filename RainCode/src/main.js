import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 30);
camera.lookAt(0, 0, 0);

// Renderer
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

// Fog
scene.fog = new THREE.Fog(0x0d0d0f, 10, 80);
scene.background = new THREE.Color(0x0d0d0f);

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// HDRI Environment
new RGBELoader().load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/farm_field_puresky_1k.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    // scene.environment = texture;
    // scene.background = texture;
  }
);

// Animated Model
const loader = new GLTFLoader();
const clock = new THREE.Clock();
let mixer;

loader.load('./models/model.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(2, 2, 2);
  model.position.set(0, 0, -80);
  scene.add(model);

  mixer = new THREE.AnimationMixer(model);
  mixer.clipAction(gltf.animations[9]).play(); // 🔥 Animation index changed here

  const animateModel = () => {
    if (model.position.z < 10) {
      model.position.z += 0.1;
    }
    requestAnimationFrame(animateModel);
  };
  animateModel();
});

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 3);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xaaaaff, 15);
directionalLight1.position.set(10, 20, 10);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xaaaaff, 15);
directionalLight2.position.set(-10, 20, 10);
scene.add(directionalLight2);

const streetLight1 = new THREE.SpotLight(0xffd6a5, 50, 40, Math.PI / 6, 0.4, 2);
streetLight1.position.set(-3, 8, -15);
streetLight1.target.position.set(-3, 0, -15);
scene.add(streetLight1, streetLight1.target);

const streetLight2 = new THREE.SpotLight(0xffd6a5, 50, 40, Math.PI / 6, 0.4, 2);
streetLight2.position.set(3, 8, 15);
streetLight2.target.position.set(3, 0, 15);
scene.add(streetLight2, streetLight2.target);

const glow1 = new THREE.PointLight(0xffb774, 15, 10, 2);
glow1.position.copy(streetLight1.position);
scene.add(glow1);

const glow2 = new THREE.PointLight(0xffb774, 15, 10, 2);
glow2.position.copy(streetLight2.position);
scene.add(glow2);

const neonColor = 0x00ffff;
const neon = new THREE.PointLight(neonColor, 200, 15, 2);
neon.position.set(7, 6, -10);
scene.add(neon);

const neonMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  emissive: neonColor,
  emissiveIntensity: 100,
  metalness: 0.8,
  roughness: 0.3,
});

function flickerNeonLight(light, material) {
  let time = 0;
  function animateFlicker() {
    time += 0.1;
    const flicker = 10 + Math.sin(time * 3 + Math.random()) * 5;
    light.intensity = flicker;
    material.emissiveIntensity = flicker * 10;
    requestAnimationFrame(animateFlicker);
  }
  animateFlicker();
}
flickerNeonLight(neon, neonMat);

const neonSign = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.2), neonMat);
neonSign.position.set(7, 6, -10);
scene.add(neonSign);

const neonSign2 = neonSign.clone();
neonSign2.position.set(-7, 6, 10);
scene.add(neonSign2);

const lampColor = 0xffc288;
const streetLamp = new THREE.SpotLight(lampColor, 30, 40, Math.PI / 6, 0.3);
streetLamp.position.set(-3, 6, -10);
streetLamp.target.position.set(-3, 0, -10);
scene.add(streetLamp, streetLamp.target);

function createRainLightBeam(pos, color = 0xffc288) {
  const beamGeo = new THREE.ConeGeometry(1.8, 8, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.02,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.copy(pos).add(new THREE.Vector3(0, -4, 0));
  beam.rotation.x = Math.PI;
  scene.add(beam);
}
createRainLightBeam(streetLamp.position);

const thunderLight = new THREE.DirectionalLight(0xddeeff, 0);
thunderLight.position.set(0, 20, 0);
scene.add(thunderLight);

const flashPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
);
flashPlane.position.set(0, 10, 0);
flashPlane.rotation.x = -Math.PI / 2;
scene.add(flashPlane);

function screenFlash() {
  flashPlane.material.opacity = 0.4;
  setTimeout(() => {
    flashPlane.material.opacity = 0;
  }, 100);
}

function triggerThunder() {
  const flashIntensity = 5 + Math.random() * 5;
  thunderLight.intensity = flashIntensity;
  screenFlash();

  setTimeout(() => {
    thunderLight.intensity = 0;
    flashPlane.material.opacity = 0;
  }, 80 + Math.random() * 100);
}

setInterval(() => {
  if (Math.random() < 0.05) {
    triggerThunder();
  }
}, 1000);

const puddleGeo = new THREE.CircleGeometry(1.5, 32);
const puddleMat = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.2,
  metalness: 1,
  envMapIntensity: 10,
  emissive: 0x222222,
});

const puddles = [
  [-3, 0.01, -15],
  [3, 0.01, 15],
  [0, 0.01, 15],
  [1, 0.1, 15]
];

puddles.forEach(pos => {
  const puddle = new THREE.Mesh(puddleGeo, puddleMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(...pos);
  scene.add(puddle);
});

const rainCount = 2000;
const rainGeo = new THREE.BufferGeometry();
const positions = new Float32Array(rainCount * 3);

for (let i = 0; i < rainCount; i++) {
  positions[i * 3] = Math.random() * 100 - 50;
  positions[i * 3 + 1] = Math.random() * 50;
  positions[i * 3 + 2] = Math.random() * 100 - 50;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const rainMat = new THREE.PointsMaterial({
  color: 0xaaaaaa,
  size: 0.1,
  transparent: true,
  opacity: 0.6,
});

const rain = new THREE.Points(rainGeo, rainMat);
scene.add(rain);

function animateRain() {
  const pos = rain.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.array[i * 3 + 1] -= 0.3;
    if (pos.array[i * 3 + 1] < 0) pos.array[i * 3 + 1] = 50;
  }
  pos.needsUpdate = true;
  requestAnimationFrame(animateRain);
}
animateRain();

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('./audio/rain.mp3', (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.4);
  sound.play();
});






// helpers


// ===== WALLS SETUP ===== //
const wallGeo = new THREE.BoxGeometry(1, 10, 100);
wallGeo.setAttribute('uv2', wallGeo.attributes.uv); // Required for aoMap

const wallDiffuse = textureLoader.load('./textures/walls/diff.jpg');
wallDiffuse.wrapS = wallDiffuse.wrapT = THREE.RepeatWrapping;
wallDiffuse.repeat.set(20, 2);

const wallNormal = textureLoader.load('./textures/walls/normal.jpg');
wallNormal.wrapS = wallNormal.wrapT = THREE.RepeatWrapping;
wallNormal.repeat.set(20, 2);

const wallARM = textureLoader.load('./textures/walls/arm.jpg');
wallARM.wrapS = wallARM.wrapT = THREE.RepeatWrapping;
wallARM.repeat.set(20, 2);

const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallDiffuse,
  normalMap: wallNormal,
  aoMap: wallARM,
  roughnessMap: wallARM,
  metalnessMap: wallARM,
  color: "#111111",
  metalness: 0.95,
  roughness: 0.15,
});

const wall1 = new THREE.Mesh(wallGeo, wallMaterial);
wall1.position.set(-10.5, 5, 0);
scene.add(wall1);

const wall2 = wall1.clone();
wall2.position.set(10.5, 5, 0);
scene.add(wall2);

// ===== STREET SETUP ===== //
const streetGeo = new THREE.PlaneGeometry(20, 100);
streetGeo.setAttribute('uv2', streetGeo.attributes.uv); // For aoMap

const streetDiffuse = textureLoader.load('./textures/street/diff.jpg');
streetDiffuse.wrapS = streetDiffuse.wrapT = THREE.RepeatWrapping;
streetDiffuse.repeat.set(1, 5);

const streetNormal = textureLoader.load('./textures/street/normal.jpg');
streetNormal.wrapS = streetNormal.wrapT = THREE.RepeatWrapping;
streetNormal.repeat.set(1, 5);

const streetARM = textureLoader.load('./textures/street/arm.jpg');
streetARM.wrapS = streetARM.wrapT = THREE.RepeatWrapping;
streetARM.repeat.set(1, 5);

const streetMaterial = new THREE.MeshStandardMaterial({
  map: streetDiffuse,
  normalMap: streetNormal,
  aoMap: streetARM,
  roughnessMap: streetARM,
  metalnessMap: streetARM,
  color: "#0e0d0c",
  metalness: 0.95,
  roughness: 0.15,
});

const street = new THREE.Mesh(streetGeo, streetMaterial);
street.rotation.x = -Math.PI / 2;
scene.add(street);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animate

  const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
    animateRain();
  };

animate();
