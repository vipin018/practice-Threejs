import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';

// Init
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1f);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 6);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

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



//Lights
const createSpot = (color, pos) => {
  const light = new THREE.SpotLight(color, 80, 30, Math.PI / 18, 0.5, 1);
  light.castShadow = true;
  light.position.set(...pos);
  light.target.position.set(0, 0, 0);
  scene.add(light, light.target);
  return light;
};

const spotLights = [
  createSpot("#9D00FF", [10, 5, 15]),
  createSpot("#00FFFF", [-10, 5, 15]),
  createSpot("#FF007F", [0, 5, 15]),
  createSpot("#FF4500", [0, 5, -15]),
];

const flashLight = new THREE.DirectionalLight(0xffffff, 2);
flashLight.castShadow = true;
flashLight.position.set(2, 8, 0);
scene.add(flashLight);

const overheadSpot = new THREE.SpotLight("#BFAFFF", 80, 30, Math.PI * 0.07, 0.5, 1);
overheadSpot.position.set(0, 20, 0);
overheadSpot.target.position.set(0, 0, -1);
overheadSpot.castShadow = true;
scene.add(overheadSpot, overheadSpot.target);

// Models
const loader = new GLTFLoader();

// Mixers
let mixer, djMixer, dancer1Mixer, dancer2Mixer;

// ✅ Reusable Load Model Function
const loadModel = (
  path,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  parent = scene,
  callback = () => {},
  animationIndex = null
) => {
  loader.load(path, (gltf) => {
    const model = gltf.scene;
    model.scale.set(...scale);
    model.position.set(...position);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    parent.add(model);

    if (gltf.animations.length) {
      const mix = new THREE.AnimationMixer(model);

      if (animationIndex !== null && gltf.animations[animationIndex]) {
        mix.clipAction(gltf.animations[animationIndex]).play();
      } else {
        gltf.animations.forEach((clip) => mix.clipAction(clip).play());
      }

      callback(mix);
    }
  });
};



// 🔊 DJ & Main Model
loadModel('./animated_model/scene.gltf', [2.2, 2.2, 2.2], [0, -2, 2], scene, m => mixer = m);

const dj = new THREE.Object3D();
dj.position.set(0, -2, -2.5);
scene.add(dj);
loadModel('./monkey_dj_animated/scene.gltf', [1.8, 1.8, 1.8], [0, 0, 0], dj, m => djMixer = m);

// 🕺 Dancers on stage
const dancers = new THREE.Object3D();
dancers.position.set(0, -2, 2);
scene.add(dancers);


loadModel('./man1.glb', [0.8, 0.8, 0.8], [-2, 0, -3], dancers, (m) => dancer1Mixer = m, 3); // wave
loadModel('./man2.glb', [0.8, 0.8, 0.8], [3, 0, 2], dancers, (m) => dancer2Mixer = m, 0); // jump





// Audio Setup
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();

const tracks = {
  music1: new THREE.Audio(listener),
  music2: new THREE.Audio(listener),
};

['music1.mp3', 'music2.mp3'].forEach((file, i) => {
  audioLoader.load(`./audio/${file}`, buffer => {
    const key = i === 0 ? 'music1' : 'music2';
    tracks[key].setBuffer(buffer);
    tracks[key].setLoop(false);
    tracks[key].setVolume(0.6);
  });
});

const crowdFiles = ['crowd1.mp3', 'crowd2.mp3', 'crowd3.mp3'];
const randomCrowds = crowdFiles.map(file => {
  const sound = new THREE.Audio(listener);
  audioLoader.load(`./audio/${file}`, buffer => sound.setBuffer(buffer));
  return sound;
});

let concertActive = false;

function startConcert() {
  if (concertActive) return;
  concertActive = true;

  tracks.music1.play();
  fadeInCrowd();

  tracks.music1.onEnded = () => {
    setTimeout(() => {
      tracks.music2.play();
    }, 1000);
  };
}

function stopConcert() {
  concertActive = false;
  Object.values(tracks).forEach(t => t.stop());
  randomCrowds.forEach(c => { c.stop(); c.setVolume(0); });
}

function fadeInCrowd() {
  if (!concertActive) return;

  const crowd = randomCrowds[Math.floor(Math.random() * randomCrowds.length)];
  if (!crowd.isPlaying) {
    crowd.setVolume(0);
    crowd.play();

    let volume = 0;
    const interval = setInterval(() => {
      if (!concertActive || !crowd.isPlaying) return clearInterval(interval);
      volume += 0.02;
      crowd.setVolume(Math.min(0.5, volume));
      if (volume >= 0.5) clearInterval(interval);
    }, 100);
  }

  crowd.onEnded = () => {
    setTimeout(fadeInCrowd, 2000 + Math.random() * 3000);
  };
}



// GUI
const gui = new GUI();
const folder = gui.addFolder('🎛 Concert Controls');
folder.add({ start: startConcert }, 'start').name('▶ Start Concert');
folder.add({ stop: stopConcert }, 'stop').name('⏹ Stop Concert');
folder.close();

// Animation
const clock = new THREE.Clock();
let colorTimer = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  mixer?.update(delta);
  djMixer?.update(delta);
  dancer1Mixer?.update(delta);
  dancer2Mixer?.update(delta);


  // Animate lights
  const [l1, l2, l3, l4] = spotLights;
  l1.position.x = Math.sin(time * 1.5) * 10;
  l1.position.z = Math.cos(time * 1.5) * 10;
  l2.position.x = Math.sin(time * 1.5) * 10;
  l2.position.z = -Math.cos(time * 1.5) * 10;
  l3.position.y = Math.sin(time * 1.5) * 10;
  l3.position.z = Math.cos(time * 1.5) * 10;
  l4.position.y = Math.sin(time * 1.5) * 10;
  l4.position.x = -Math.cos(time * 1.5) * 10;

  if (time - colorTimer > 0.2) {
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    flashLight.color.lerp(color, 0.1);
    colorTimer = time;
  }
  flashLight.intensity = Math.abs(Math.sin(time * 10));

  overheadSpot.position.x = Math.sin(time * 0.5);
  overheadSpot.position.z = Math.cos(time * 0.5);

  // Camera
  const concertOrbit = {
    radius: 4,
    height: 2.8,
    speed: 0.3,
  };
  
  const idleCinematicPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5, 3, 6),
    new THREE.Vector3(0, 4, 2),
    new THREE.Vector3(2, 3, -1),
    new THREE.Vector3(-2, 2.5, -4),
    new THREE.Vector3(-5, 3, 6), // loop
  ]);
  
  if (tracks.music1.isPlaying || tracks.music2.isPlaying) {
    // Cinematic orbit with slow dolly & sway
    const angle = time * concertOrbit.speed;
    const x = concertOrbit.radius * Math.cos(angle);
    const z = concertOrbit.radius * Math.sin(angle);
    const y = concertOrbit.height + Math.sin(time * 0.4) * 0.1; // soft vertical sway
  
    const targetPos = new THREE.Vector3(x, y, z);
    camera.position.lerp(targetPos, 0.04);
  
    const focusPoint = new THREE.Vector3(
      0 + Math.sin(time * 0.2) * 0.1,
      1 + Math.sin(time * 0.3) * 0.1,
      0
    );
    camera.lookAt(focusPoint);
  } else {
    // Idle: smooth drone-like cinematic path loop
    const loopDuration = 45;
    const t = (time % loopDuration) / loopDuration;
    const position = idleCinematicPath.getPointAt(t);
    const lookAhead = idleCinematicPath.getPointAt((t + 0.01) % 1);
  
    camera.position.lerp(position, 0.03);
    camera.lookAt(lookAhead);
  }
  
 
  controls.update();
  renderer.render(scene, camera);

  // Update crowd volume
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.querySelector('#loading').style.display = 'none';
