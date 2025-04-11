import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

scene.background = new THREE.Color('#121212') // or '#0f0f0f'

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.render(scene, camera);

// hdri lights
const rgbeLoader = new RGBELoader()
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_08_2k.hdr', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture
  // scene.background = texture // optional: remove if you want a separate BG
})


// model
const loader = new GLTFLoader();

const model = loader.load( '/model/bottle2.glb', function ( gltf ) {

  scene.add( gltf.scene );
  gltf.scene.scale.set(0.5, 0.5, 0.5);
  gltf.scene.position.y = -2;
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = bottleMaterial;
      
    }
  });
  // gltf.scene.lookAt(new THREE.Vector3(0, 0, 0));

}, undefined, function ( error ) {

  console.error( error );

} );

// bottle material
const bottleMaterial = new THREE.MeshStandardMaterial({
  color: 0x080808,
  emissive: 0xffffff,
  emissiveIntensity: 0.01,
  roughness: 0.3,
  metalness: 0.9,
});



camera.position.z = 5;

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const clock = new THREE.Clock();
function animate() {
  const elapsedTime = clock.getElapsedTime();
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);


  pointLight.position.x = Math.sin(elapsedTime);
  pointLight.position.z = Math.cos(elapsedTime);

  
}
animate();