import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';



// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1f);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 6);

// Renderer
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Stage
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.5, 10),
  new THREE.MeshStandardMaterial({ color: '#557fa3' })
);
stage.position.set(0, -2.3, 0);
stage.scale.set(1.5, 1, 2.5);
stage.receiveShadow = true;
scene.add(stage);

// Lights

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const addSpot = (color, x, y, z) => {
  const light = new THREE.SpotLight(color, 80, 30, Math.PI / 18, 0.5, 1);
  light.castShadow = true;
  light.position.set(x, y, z);
  light.target.position.set(0, 0, 0);
  scene.add(light, light.target);
  return light;
};

const aboveHeadSpotlight = new THREE.SpotLight("#BFAFFF", 80, 30, Math.PI * 0.07, 0.5, 1);
aboveHeadSpotlight.position.set(0, 20, 0);
aboveHeadSpotlight.target.position.set(0, 0, -1);
aboveHeadSpotlight.castShadow = true;
scene.add(aboveHeadSpotlight, aboveHeadSpotlight.target);

const light1 = addSpot("#9D00FF", 10, 5, 15);
const light2 = addSpot("#00FFFF", -10, 5, 15);
const light3 = addSpot("#FF007F", 0, 5, 15);
const light4 = addSpot("#FF4500", 0, 5, -15);

const flashLight = new THREE.DirectionalLight(0xffffff, 2);
flashLight.castShadow = true;
flashLight.position.set(2, 8, 0);
scene.add(flashLight);

// Load Models
const loader = new GLTFLoader();
let mixer, djMixer;

loader.load('./animated_model/scene.gltf', (gltf) => {
  const model = gltf.scene;
  model.scale.set(2.2, 2.2, 2.2);
  model.position.set(0, -2, 2);
  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(model);
  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
  }
});

const dj = new THREE.Object3D();
dj.position.set(0, -2, -2.5);
scene.add(dj);

loader.load('./monkey_dj_animated/scene.gltf', (gltf) => {
  const djModel = gltf.scene;
  djModel.scale.set(1.8, 1.8, 1.8);
  djModel.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  dj.add(djModel);
  if (gltf.animations.length) {
    djMixer = new THREE.AnimationMixer(djModel);
    gltf.animations.forEach(clip => djMixer.clipAction(clip).play());
  }
});

// 🎧 Audio Setup
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();

const tracks = {
  music1: new THREE.Audio(listener),
  music2: new THREE.Audio(listener),
};

const crowdSounds = ['crowd1.mp3', 'crowd2.mp3', 'crowd3.mp3'];
const randomCrowds = [];

crowdSounds.forEach((file) => {
  const sound = new THREE.Audio(listener);
  audioLoader.load(`./audio/${file}`, buffer => {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.0); // Start silent
  });
  randomCrowds.push(sound);
});

audioLoader.load('./audio/music1.mp3', buffer => {
  tracks.music1.setBuffer(buffer);
  tracks.music1.setLoop(false);
  tracks.music1.setVolume(0.6);
});

audioLoader.load('./audio/music2.mp3', buffer => {
  tracks.music2.setBuffer(buffer);
  tracks.music2.setLoop(false);
  tracks.music2.setVolume(0.6);
});

let concertActive = false;

function startConcert() {
  if (concertActive) return;
  concertActive = true;

  tracks.music1.play();
  fadeInRandomCrowd();

  tracks.music1.onEnded = () => {
    setTimeout(() => {
      tracks.music2.play();
    }, 1000);
  };
}

function stopConcert() {
  concertActive = false;

  Object.values(tracks).forEach(audio => audio.stop());
  randomCrowds.forEach(crowd => {
    crowd.stop();
    crowd.setVolume(0);
  });
}

function fadeInRandomCrowd() {
  if (!concertActive || (!tracks.music1.isPlaying && !tracks.music2.isPlaying)) return;

  const random = Math.floor(Math.random() * randomCrowds.length);
  const crowd = randomCrowds[random];

  if (!crowd.isPlaying) {
    crowd.setVolume(0);
    crowd.play();

    let vol = 0;
    const fadeInterval = setInterval(() => {
      if (!concertActive || !crowd.isPlaying) {
        clearInterval(fadeInterval);
        return;
      }
      vol += 0.02;
      if (vol >= 0.5) {
        clearInterval(fadeInterval);
      } else {
        crowd.setVolume(vol);
      }
    }, 100);
  }

  crowd.onEnded = () => {
    setTimeout(fadeInRandomCrowd, 2000 + Math.random() * 3000);
  };
}

// 🎛 GUI
const gui = new GUI();
const controlsFolder = gui.addFolder('🎛 Concert Controls');
controlsFolder.add({ start: startConcert }, 'start').name('▶ Start Concert');
controlsFolder.add({ stop: stopConcert }, 'stop').name('⏹ Stop Concert');
controlsFolder.close();

// 🎥 Camera + Lights Animation
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  mixer?.update(delta);
  djMixer?.update(delta);

  // Dynamic lights
  light1.position.x = Math.sin(time * 1.5) * 10;
  light1.position.z = Math.tan(time * 1.5) * 10;
  light2.position.x = Math.sin(time * 1.5) * 10;
  light2.position.z = -Math.tan(time * 1.5) * 10;
  light3.position.y = Math.sin(time * 1.5) * 10;
  light3.position.z = Math.tan(time * 1.5) * 10;
  light4.position.y = Math.sin(time * 1.5) * 10;
  light4.position.x = -Math.tan(time * 1.5) * 10;

  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  flashLight.color.lerp(new THREE.Color(`rgb(${r},${g},${b})`), 0.05);
  flashLight.intensity = Math.abs(Math.sin(time * 10)) * 10;

  aboveHeadSpotlight.position.x = Math.sin(time * 0.5);
  aboveHeadSpotlight.position.z = Math.cos(time * 0.5);

  // 🎥 Cinematic Drone Style Camera
  const droneRadius = 8;
  const height = 2.5 + Math.sin(time * 0.5) * 1.5;
  const zoomIn = 3 + Math.sin(time * 0.8) * 1;

  const camX = Math.cos(time * 0.2) * droneRadius;
  const camZ = Math.sin(time * 0.2) * droneRadius;
  const camY = height;
  const lookAtY = Math.sin(time * 2) * 0.5;

  if (tracks.music1.isPlaying || tracks.music2.isPlaying) {
    camera.position.lerp(new THREE.Vector3(0, 2.5, zoomIn), 0.02);
    camera.lookAt(0, lookAtY, 0);
  } else {
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.02);
    camera.lookAt(0, lookAtY, 0);
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.querySelector('#loading').style.display = 'none';