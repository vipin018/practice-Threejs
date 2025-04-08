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
renderer.toneMappingExposure = 0.8;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
 // ===== LIGHTING SETUP (Improved) ===== //

        // --- Ambient & Hemisphere ---
        // Reduced ambient light, relying more on specific sources and hemisphere light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Lower intensity
        scene.add(ambientLight);

        // Added HemisphereLight for soft sky/ground contribution
        const hemisphereLight = new THREE.HemisphereLight(0x607080, 0x202030, 1.5); // Sky color, ground color, intensity
        scene.add(hemisphereLight);

        // --- Directional Lights (Simulating Moon/Distant Light) ---
        // Using one main directional light for a clearer direction
        const moonLight = new THREE.DirectionalLight(0x8090a0, 2.0); // Cool white, moderate intensity
        moonLight.position.set(-15, 30, -15); // Angled position
        moonLight.castShadow = true; // Enable shadows
        moonLight.shadow.mapSize.width = 1024; // Shadow map resolution
        moonLight.shadow.mapSize.height = 1024;
        moonLight.shadow.camera.near = 0.5;
        moonLight.shadow.camera.far = 100;
        moonLight.shadow.camera.left = -30;
        moonLight.shadow.camera.right = 30;
        moonLight.shadow.camera.top = 30;
        moonLight.shadow.camera.bottom = -30;
        moonLight.shadow.bias = -0.001; // Adjust shadow bias to prevent artifacts
        scene.add(moonLight);
        // scene.add(new THREE.CameraHelper(moonLight.shadow.camera)); // Helper to visualize shadow camera

        // Removed the second directional light for simplicity, can be added back if needed

        // --- Street Lights (SpotLights) ---
        const streetLightColor = 0xffd6a5; // Warm yellow
        const streetLightIntensity = 80; // Increased intensity
        const streetLightDistance = 50; // Increased range
        const streetLightAngle = Math.PI / 7; // Slightly wider angle
        const streetLightPenumbra = 0.6; // Softer edges
        const streetLightDecay = 1.5; // More realistic decay

        const streetLight1 = new THREE.SpotLight(
            streetLightColor, streetLightIntensity, streetLightDistance,
            streetLightAngle, streetLightPenumbra, streetLightDecay
        );
        streetLight1.position.set(-5, 10, -15); // Adjusted position
        streetLight1.target.position.set(-5, 0, -15);
        streetLight1.castShadow = true; // Street lights cast shadows
        streetLight1.shadow.mapSize.width = 512;
        streetLight1.shadow.mapSize.height = 512;
        streetLight1.shadow.camera.near = 1;
        streetLight1.shadow.camera.far = 50;
        streetLight1.shadow.bias = -0.005;
        scene.add(streetLight1, streetLight1.target);
        // scene.add( new THREE.SpotLightHelper( streetLight1 ) ); // Helper

        const streetLight2 = new THREE.SpotLight(
            streetLightColor, streetLightIntensity, streetLightDistance,
            streetLightAngle, streetLightPenumbra, streetLightDecay
        );
        streetLight2.position.set(5, 10, 15); // Adjusted position
        streetLight2.target.position.set(5, 0, 15);
        streetLight2.castShadow = true; // Street lights cast shadows
        streetLight2.shadow.mapSize.width = 512;
        streetLight2.shadow.mapSize.height = 512;
        streetLight2.shadow.camera.near = 1;
        streetLight2.shadow.camera.far = 50;
        streetLight2.shadow.bias = -0.005;
        scene.add(streetLight2, streetLight2.target);
        // scene.add( new THREE.SpotLightHelper( streetLight2 ) ); // Helper

        // --- Point Light Glows for Street Lamps ---
        // Slightly reduced intensity as SpotLights are brighter
        const glowColor = 0xffb774; // Slightly warmer glow
        const glowIntensity = 10; // Reduced intensity
        const glowDistance = 8; // Reduced distance
        const glowDecay = 2;

        const glow1 = new THREE.PointLight(glowColor, glowIntensity, glowDistance, glowDecay);
        glow1.position.copy(streetLight1.position).add(new THREE.Vector3(0, -0.5, 0)); // Position slightly below lamp
        scene.add(glow1);

        const glow2 = new THREE.PointLight(glowColor, glowIntensity, glowDistance, glowDecay);
        glow2.position.copy(streetLight2.position).add(new THREE.Vector3(0, -0.5, 0));
        scene.add(glow2);

        // --- Neon Lights ---
        const neonColor = 0x00ffff; // Cyan neon
        const neonIntensity = 150; // Base intensity for flicker
        const neonDistance = 20; // Increased distance
        const neonDecay = 1.5; // Adjusted decay

        const neonLight1 = new THREE.PointLight(neonColor, neonIntensity, neonDistance, neonDecay);
        neonLight1.position.set(7, 6, -10);
        scene.add(neonLight1);

        const neonMat = new THREE.MeshStandardMaterial({
            color: 0x111111, // Base color when off
            emissive: neonColor, // Emissive color matching the light
            emissiveIntensity: 10, // Base emissive intensity
            metalness: 0.5, // Less metallic
            roughness: 0.5, // Less rough
        });

        // Flicker function (adjusted parameters for potentially subtler flicker)
        function flickerNeonLight(light, material) {
            let time = Math.random() * 100; // Random start time
            const baseIntensity = light.intensity;
            const baseEmissive = material.emissiveIntensity;
            const flickerSpeed = 5 + Math.random() * 3; // Randomize speed slightly
            const flickerAmount = baseIntensity * (0.3 + Math.random() * 0.4); // Randomize amount

            function animateFlicker() {
                time += clock.getDelta(); // Use clock delta for frame-rate independence
                const flicker = baseIntensity + Math.sin(time * flickerSpeed) * flickerAmount * (Math.random() > 0.1 ? 1 : 0.2); // Occasional bigger dips
                light.intensity = Math.max(0, flicker); // Ensure intensity doesn't go below 0
                material.emissiveIntensity = baseEmissive * (light.intensity / baseIntensity);

                requestAnimationFrame(animateFlicker);
            }
            animateFlicker();
        }

        flickerNeonLight(neonLight1, neonMat);

        // Neon Sign Geometry
        const neonSignGeo = new THREE.BoxGeometry(3, 1, 0.2);
        const neonSign1 = new THREE.Mesh(neonSignGeo, neonMat);
        neonSign1.position.copy(neonLight1.position);
        neonSign1.castShadow = true;
        scene.add(neonSign1);

        // Second Neon Sign (Cloned material might share flicker, create new if independent flicker needed)
        const neonLight2 = neonLight1.clone(); // Clone light
        const neonSign2 = neonSign1.clone(); // Clone mesh
        neonSign2.material = neonMat.clone(); // Clone material for potentially independent flicker
        neonLight2.position.set(-7, 6, 10);
        neonSign2.position.copy(neonLight2.position);
        scene.add(neonLight2);
        scene.add(neonSign2);
        flickerNeonLight(neonLight2, neonSign2.material); // Flicker second sign independently

        // --- Light Beams (Volumetric effect) ---
        // Adjusted opacity and color to better match source lights
        function createRainLightBeam(lightSource, color) {
            const beamGeo = new THREE.ConeGeometry(2.5, 10, 32, 1, true); // Wider base, taller cone
            const beamMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.04, // Slightly increased opacity
                side: THREE.DoubleSide,
                depthWrite: false, // Don't write to depth buffer
                blending: THREE.AdditiveBlending // Additive blending for glow effect
            });

            const beam = new THREE.Mesh(beamGeo, beamMat);
            // Position beam below the light source
            beam.position.copy(lightSource.position).add(new THREE.Vector3(0, -5, 0));
            beam.rotation.x = Math.PI; // Point down
            // scene.add(beam);
        }
        createRainLightBeam(streetLight1, streetLightColor);
        createRainLightBeam(streetLight2, streetLightColor);


        // --- Thunder Light ---
        const thunderLight = new THREE.DirectionalLight(0xccddff, 50); // Cool blueish white
        thunderLight.position.set(0, 50, 0); // Higher up
        scene.add(thunderLight);

        // Screen Flash Plane (for thunder)
        const flashPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(300, 300), // Larger plane
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
        );
        flashPlane.position.set(0, 20, 0); // Position higher
        flashPlane.rotation.x = -Math.PI / 2;
        scene.add(flashPlane);

        function screenFlash() {
            flashPlane.material.opacity = 0.5 + Math.random() * 0.3; // Random flash intensity
            setTimeout(() => {
                flashPlane.material.opacity = 0;
            }, 50 + Math.random() * 50); // Shorter flash duration
        }

        function triggerThunder() {
            const flashIntensity = 10 + Math.random() * 15; // More intense flash
            thunderLight.intensity = flashIntensity;
            screenFlash();

            // Multiple flashes sometimes
            if (Math.random() > 0.6) {
                setTimeout(() => {
                     thunderLight.intensity = flashIntensity * 0.5;
                     screenFlash();
                     setTimeout(() => { thunderLight.intensity = 0; }, 60 + Math.random() * 60);
                }, 50 + Math.random() * 50);
            } else {
                 setTimeout(() => {
                    thunderLight.intensity = 0;
                 }, 80 + Math.random() * 100);
            }
        }

        // Trigger thunder less frequently but more intensely
        setInterval(() => {
            if (Math.random() < 0.03) { // Lower probability
                triggerThunder();
            }
        }, 1000);

    // Puddles (Adjusted material for better reflection simulation)
    const puddleGeo = new THREE.CircleGeometry(2, 32); // Slightly larger puddles
    const puddleMat = new THREE.MeshStandardMaterial({
        color: 0x333333, // Darker base color
        roughness: 0.1, // Very smooth for reflections
        metalness: 0.9, // Highly metallic to reflect environment
       // envMap: scene.environment, // Use environment map if available (removed HDRI)
        envMapIntensity: 5, // Lower intensity if envMap is used
    });

    const puddles = [
        [-3, 0.01, -15],
        [3, 0.01, 15],
        [0, 0.01, 5], // Adjusted positions
        [5, 0.01, -5]
    ];

    puddles.forEach(pos => {
        const puddle = new THREE.Mesh(puddleGeo, puddleMat);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(...pos);
        puddle.receiveShadow = true; // Puddles can receive shadows (subtle effect)
        scene.add(puddle);
    });

const rainCount = 5000; // More raindrops
const rainGeo = new THREE.BufferGeometry();
const positions = new Float32Array(rainCount * 3);
const velocities = new Float32Array(rainCount); // Store velocity for each drop

for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = Math.random() * 120 - 60; // Wider spread
    positions[i * 3 + 1] = Math.random() * 60;   // Start higher
    positions[i * 3 + 2] = Math.random() * 120 - 60; // Deeper spread
    velocities[i] = 0.2 + Math.random() * 0.2; // Randomize fall speed
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const rainMat = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.15, // Slightly larger drops
    transparent: true,
    opacity: 0.5, // Slightly less opaque
    sizeAttenuation: true, // Points get smaller further away
});

const rain = new THREE.Points(rainGeo, rainMat);
scene.add(rain);

function animateRain() {
  const pos = rain.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3 + 1] -= velocities[i]; // Use individual velocity
      if (pos.array[i * 3 + 1] < -5) { // Let drops fall below ground before reset
          pos.array[i * 3 + 1] = 60 + Math.random() * 20; // Reset higher with variation
          // Optionally reset X/Z for wider effect over time
          // pos.array[i * 3] = Math.random() * 120 - 60;
          // pos.array[i * 3 + 2] = Math.random() * 120 - 60;
      }
  }
  pos.needsUpdate = true; // Important!
}

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