import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// RGBELoader is removed as it's not needed for MatCap

// === DOM ELEMENTS ===
const canvas = document.querySelector('#canvas');
const loadingIndicator = document.querySelector('#loading-indicator');

// === SCENE SETUP ===
const scene = new THREE.Scene();
// No scene background color needed if renderer alpha is true and body has background
// scene.background = new THREE.Color(0x1a1a1a); // Optional: Set if alpha is false

// === CAMERA SETUP ===
const camera = new THREE.PerspectiveCamera(
    75, // Field of View (degrees)
    window.innerWidth / window.innerHeight, // Aspect Ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.set(0, 0, 5); // Adjusted initial position slightly

// === RENDERER SETUP ===
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,    // Target canvas
    antialias: true,   // Smooth edges
    alpha: true        // Make canvas transparent to see HTML background/elements
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Adjust for device pixel ratio
renderer.outputEncoding = THREE.sRGBEncoding; // Correct color output
// Tone mapping is not needed for MatCap material
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 1.0;

// === LOADING MANAGER ===
// Manages loading progress for textures and models
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
    console.log(`Loading started: ${url} (${itemsLoaded}/${itemsTotal})`);
    loadingIndicator.style.display = 'block';
    loadingIndicator.textContent = 'Loading... 0%';
};
loadingManager.onLoad = () => {
    console.log('Loading complete!');
    loadingIndicator.style.display = 'none';
};
loadingManager.onError = (url) => {
    console.error(`Loading error: ${url}`);
    loadingIndicator.textContent = 'Error loading assets!';
    loadingIndicator.style.color = 'red';
};
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    console.log(`Loading progress: ${url} (${itemsLoaded}/${itemsTotal} - ${progress}%)`);
    loadingIndicator.textContent = `Loading... ${progress}%`;
};

// === TEXTURE LOADER (for MatCap) ===
const textureLoader = new THREE.TextureLoader(loadingManager); // Use loading manager
// !!! IMPORTANT: Replace with your actual MatCap texture path or URL !!!
const matcapTexturePath = '/texture/tex2.jpg'; // <<< YOUR MATCAP PATH HERE
let matcapTexture = null; // Initialize

try {
     matcapTexture = textureLoader.load(
        matcapTexturePath,
        (texture) => { // onLoad
            texture.encoding = THREE.sRGBEncoding; // Set correct encoding
            texture.needsUpdate = true; // Usually handled automatically, but safe to include
            console.log('MatCap texture loaded.');
            // Re-apply material if model loaded first (edge case)
            if (model && bottleMaterial) {
                 bottleMaterial.matcap = texture;
                 bottleMaterial.needsUpdate = true;
            }
        },
        undefined, // onProgress (handled by manager)
        (error) => { // onError
            console.error(`Failed to load matcap texture: ${matcapTexturePath}`, error);
        }
    );
} catch (error) {
     console.error(`Error initiating texture load for: ${matcapTexturePath}`, error);
}


// === MATERIAL (MatCap) ===
// Create the material; texture will be assigned in loader callback
const bottleMaterial = new THREE.MeshMatcapMaterial();
if (matcapTexture) { // Assign if loaded synchronously (rare, usually from cache)
     bottleMaterial.matcap = matcapTexture;
}

// === MODEL LOADING (GLTF/GLB) ===
let model = null; // Declare model variable
const gltfLoader = new GLTFLoader(loadingManager); // Use loading manager

const modelPath = '/model/bottle2.glb'; // <<< YOUR MODEL PATH HERE

gltfLoader.load(
    modelPath,
    (gltf) => { // onLoad: Model loaded successfully
        model = gltf.scene;
        model.scale.set(0.7, 0.7, 0.7); // Set scale as per your code
        model.position.y = -4; // Adjusted Y position for better centering

        // Apply the MatCap material to all meshes in the model
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Clone material if you might change properties per mesh later
                child.material = bottleMaterial.clone();
                 // Ensure matcap texture is assigned if it loaded after model started loading
                 if (matcapTexture && !child.material.matcap) {
                      child.material.matcap = matcapTexture;
                 }
            }
        });

        scene.add(model);
        console.log('Model loaded successfully.');
    },
    undefined, // onProgress (handled by manager)
    (error) => { // onError: Model loading failed
        console.error(`Failed to load model: ${modelPath}`, error);
        loadingIndicator.textContent = 'Error loading model!';
        loadingIndicator.style.color = 'red';
    }
);

// === LIGHTS ===
// Lights (Ambient, Directional, etc.) are NOT needed for MeshMatcapMaterial
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// scene.add(ambientLight);
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// directionalLight.position.set(5, 10, 7.5);
// scene.add(directionalLight);

// === CONTROLS (OrbitControls) ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // Keep panning centered
controls.minDistance = 1;
controls.maxDistance = 20;
controls.target.set(0, -1, 0); // Adjust target slightly based on model position
controls.update();

// === RESIZE HANDLER ===
const handleResize = () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // No need to set clear color/alpha here if renderer alpha is true
};
window.addEventListener('resize', handleResize);

// === ANIMATION LOOP ===
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate); // Loop animation

    const elapsedTime = clock.getElapsedTime();

    // Update controls (required for damping)
    controls.update();

    // --- Optional Animations ---
    // Example: Rotate model slowly
    if (model) {
        model.rotation.y = elapsedTime * 0.1;
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();

// === MOUSE EVENTS (Removed) ===
// The direct mousemove camera manipulation conflicts with OrbitControls
// and is generally less user-friendly. OrbitControls handles interaction.
/*
window.addEventListener('mousemove', (event) => {
     const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
     const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
     // Direct camera manipulation removed
     // camera.position.x = mouseX * 3;
     // camera.position.y = mouseY * 3;
     // camera.lookAt(scene.position); // Ensure camera keeps looking at the center
});
*/