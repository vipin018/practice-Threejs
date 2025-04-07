import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Main class to organize the application
class RainyScene {
  constructor() {
    // Core components
    this.canvas = document.querySelector('#canvas');
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.mixer = null;
    this.model = null;
    
    // Asset managers
    this.textureLoader = new THREE.TextureLoader();
    this.audioLoader = new THREE.AudioLoader();
    this.loadingManager = new THREE.LoadingManager(
      // onLoad
      () => {
        console.log('All assets loaded');
        this.startAnimation();
      },
      // onProgress
      (url, loaded, total) => {
        console.log(`Loading: ${url} (${Math.round(loaded / total * 100)}%)`);
      },
      // onError
      (url) => {
        console.error(`Error loading ${url}`);
      }
    );
    
    // Environment settings
    this.HDRI_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/farm_field_puresky_1k.hdr';
    this.MODEL_URL = './models/model.glb';
    this.RAIN_SOUND_URL = './audio/rain.mp3';
    this.FOG_COLOR = 0x0d0d0f;
    this.NEON_COLOR = 0x00ffff;
    this.LAMP_COLOR = 0xffc288;
    
    // Scene settings
    this.rainCount = 5000;
    this.animationIndex = 9;
    
    // Initialize
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.setupEventListeners();
    this.loadAssets();
  }
  
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 30);
    this.camera.lookAt(0, 0, 0);
    
    // Add audio listener to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    
    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
  }
  
  initScene() {
    // Scene environment
    this.scene.fog = new THREE.Fog(this.FOG_COLOR, 80, 1);
    this.scene.background = new THREE.Color(this.FOG_COLOR);
  }
  
  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Optional: Add a click listener to pause/resume animation
    this.canvas.addEventListener('click', this.toggleAnimation.bind(this));
    
    // Clean up event listeners when leaving the page
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('resize', this.onWindowResize.bind(this));
      this.canvas.removeEventListener('click', this.toggleAnimation.bind(this));
    });
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  
  toggleAnimation() {
    if (this.animationPaused) {
      this.clock.start();
      this.sound?.play();
      this.animationPaused = false;
    } else {
      this.clock.stop();
      this.sound?.pause();
      this.animationPaused = true;
    }
  }
  
  loadAssets() {
    this.loadHDRI();
    this.loadModel();
    this.loadAudio();
    this.createEnvironment();
  }
  
  loadHDRI() {
    new RGBELoader(this.loadingManager).load(this.HDRI_URL, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.scene.environment = texture;
      // We're keeping the fog background, but the HDR will affect reflections
    });
  }
  
  loadModel() {
    new GLTFLoader(this.loadingManager).load(this.MODEL_URL, (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(2, 2, 2);
      this.model.position.set(0, 0, -80);
      this.model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(this.model);
      
      // Setup animation mixer
      this.mixer = new THREE.AnimationMixer(this.model);
      const action = this.mixer.clipAction(gltf.animations[this.animationIndex]);
      action.play();
    }, 
    // Progress callback
    undefined, 
    // Error callback
    (error) => {
      console.error('Error loading model:', error);
    });
  }
  
  loadAudio() {
    this.sound = new THREE.Audio(this.listener);
    
    this.audioLoader.load(this.RAIN_SOUND_URL, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0.4);
      // Only play when user has interacted with the page
      document.addEventListener('click', () => {
        if (!this.sound.isPlaying) this.sound.play();
      }, { once: true });
    }, undefined, (error) => {
      console.error('Error loading audio:', error);
    });
  }
  
  createEnvironment() {
    this.createLighting();
    this.createWalls();
    this.createStreet();
    this.createNeonSigns();
    this.createStreetLamps();
    this.createPuddles();
    this.createRain();
    this.createThunderEffect();
  }
  
  createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    this.scene.add(ambientLight);
    
    // Directional lights with shadows
    const createDirectionalLight = (x, intensity = 0 ) => {
      const light = new THREE.DirectionalLight(0xaaaaff, intensity);
      light.position.set(x, 20, 10);
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 50;
      light.shadow.camera.left = -20;
      light.shadow.camera.right = 20;
      light.shadow.camera.top = 20;
      light.shadow.camera.bottom = -20;
      this.scene.add(light);
      return light;
    };
    
    this.directionalLight1 = createDirectionalLight(10);
    this.directionalLight2 = createDirectionalLight(-10);
  }
  
  createRainLightBeam(pos, color = this.LAMP_COLOR) {
    const beamGeo = new THREE.ConeGeometry(1.8, 8, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.02,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(pos).add(new THREE.Vector3(0, -4, 0));
    // beam.rotation.x = Math.PI;
    // this.scene.add(beam);
    return beam;
  }
  
  createWalls() {
    const wallGeo = new THREE.BoxGeometry(1, 10, 100);
    wallGeo.setAttribute('uv2', wallGeo.attributes.uv); // Required for aoMap
    
    // Load textures with proper error handling
    const loadTexture = (url, repeat = [20, 2]) => {
      const texture = this.textureLoader.load(
        url,
        undefined,
        undefined,
        () => console.error(`Error loading texture: ${url}`)
      );
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(...repeat);
      return texture;
    };
    
    const wallDiffuse = loadTexture('./textures/walls/diff.jpg');
    const wallNormal = loadTexture('./textures/walls/normal.jpg');
    const wallARM = loadTexture('./textures/walls/arm.jpg');
    
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
    
    // First wall
    const wall1 = new THREE.Mesh(wallGeo, wallMaterial);
    wall1.position.set(-10.5, 5, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene.add(wall1);
    
    // Second wall - reuse geometry and material
    const wall2 = new THREE.Mesh(wallGeo, wallMaterial);
    wall2.position.set(10.5, 5, 0);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene.add(wall2);
  }
  
  createStreet() {
    const streetGeo = new THREE.PlaneGeometry(20, 100);
    streetGeo.setAttribute('uv2', streetGeo.attributes.uv);
    
    // Load textures with proper error handling
    const loadTexture = (url, repeat = [1, 5]) => {
      const texture = this.textureLoader.load(
        url, 
        undefined, 
        undefined, 
        () => console.error(`Error loading texture: ${url}`)
      );
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(...repeat);
      return texture;
    };
    
    const streetDiffuse = loadTexture('./textures/street/diff.jpg');
    const streetNormal = loadTexture('./textures/street/normal.jpg');
    const streetARM = loadTexture('./textures/street/arm.jpg');
    
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
    street.receiveShadow = true;
    this.scene.add(street);
  }
  
  createStreetLamps() {
    // Create street lights - optimized to only include what's needed
    const createStreetLight = (x, z) => {
      const spotLight = new THREE.SpotLight(this.LAMP_COLOR, 50, 40, Math.PI / 6, 0.4, 2);
      spotLight.position.set(x, 8, z);
      spotLight.target.position.set(x, 0, z);
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      this.scene.add(spotLight, spotLight.target);
      
      // Add glow effect
      const glow = new THREE.PointLight(0xffb774, 15, 10, 2);
      glow.position.copy(spotLight.position);
      this.scene.add(glow);
      
      // Add light beam effect
      this.createRainLightBeam(spotLight.position);
      
      return { spotLight, glow };
    };
    
    this.streetLight1 = createStreetLight(-3, -15);
    this.streetLight2 = createStreetLight(3, 15);
    this.streetLamp = createStreetLight(-3, -10);
  }
  
  createNeonSigns() {
    // Neon material with improved emissive properties
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: this.NEON_COLOR,
      emissiveIntensity: 100,
      metalness: 0.8,
      roughness: 0.3,
    });
    
    // Create neon lights with flickering effect
    const createNeonSign = (x, z) => {
      const neonLight = new THREE.PointLight(this.NEON_COLOR, 200, 15, 2);
      neonLight.position.set(x, 6, z);
      this.scene.add(neonLight);
      
      const neonSign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 0.2), 
        neonMat
      );
      neonSign.position.set(x, 6, z);
      this.scene.add(neonSign);
      
      return { neonLight, neonSign, flickerTime: 0 };
    };
    
    this.neonSign1 = createNeonSign(7, -10);
    this.neonSign2 = createNeonSign(-7, 10);
  }
  
  createPuddles() {
    const puddleGeo = new THREE.CircleGeometry(1.5, 32);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.2,
      metalness: 1,
      envMapIntensity: 10,
      emissive: 0x222222,
    });
    
    const puddlePositions = [
      [-3, 0.01, -15],
      [3, 0.01, 15],
      [0, 0.01, 15],
      [1, 0.1, 15]
    ];
    
    this.puddles = puddlePositions.map(pos => {
      const puddle = new THREE.Mesh(puddleGeo, puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(...pos);
      puddle.receiveShadow = true;
      this.scene.add(puddle);
      return puddle;
    });
  }
  
  createRain() {
    // Use instanced mesh for better performance
    this.createRainParticles();
  }
  
  createRainParticles() {
    // More efficient rain using instanced buffer geometry
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);
    
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = Math.random() * 100 - 50;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = Math.random() * 100 - 50;
      velocities[i] = 0.1 + Math.random() * 0.3; // Varied rain speeds
    }
    
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rainGeo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    
    const rainMat = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    
    this.rain = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rain);
  }
  
  updateRain() {
    if (!this.rain) return;
    
    const positions = this.rain.geometry.attributes.position;
    const velocities = this.rain.geometry.attributes.velocity;
    
    for (let i = 0; i < positions.count; i++) {
      // Update position with individual velocity
      positions.array[i * 3 + 1] -= velocities.array[i];
      
      // Reset when rain hits the ground
      if (positions.array[i * 3 + 1] < 0) {
        positions.array[i * 3 + 1] = 50;
        // Randomly position when recycling
        positions.array[i * 3] = Math.random() * 100 - 50;
        positions.array[i * 3 + 2] = Math.random() * 100 - 50;
      }
    }
    
    positions.needsUpdate = true;
  }
  
  createThunderEffect() {
    this.thunderLight = new THREE.DirectionalLight(0xddeeff, 0);
    this.thunderLight.position.set(0, 20, 0);
    this.scene.add(this.thunderLight);
    
    this.flashPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    this.flashPlane.position.set(0, 10, 0);
    this.flashPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.flashPlane);
    
    // Setup thunder interval
    this.thunderInterval = setInterval(() => {
      if (Math.random() < 0.05) {
        this.triggerThunder();
      }
    }, 1000);
  }
  
  triggerThunder() {
    const flashIntensity = 5 + Math.random() * 5;
    this.thunderLight.intensity = flashIntensity;
    this.flashPlane.material.opacity = 0.4;
    
    setTimeout(() => {
      this.thunderLight.intensity = 0;
      this.flashPlane.material.opacity = 0;
    }, 80 + Math.random() * 100);
  }
  
  updateModelAnimation() {
    if (this.model && this.model.position.z < 10) {
      this.model.position.z += 0.1;
    }
  }
  
  updateNeonFlicker() {
    const updateNeon = (neon) => {
      neon.flickerTime += 0.1;
      const flicker = 10 + Math.sin(neon.flickerTime * 3 + Math.random()) * 5;
      neon.neonLight.intensity = flicker;
      neon.neonSign.material.emissiveIntensity = flicker * 10;
    };
    
    updateNeon(this.neonSign1);
    updateNeon(this.neonSign2);
  }
  
  startAnimation() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate.bind(this));
    }
  }
  
  stopAnimation() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    if (this.thunderInterval) {
      clearInterval(this.thunderInterval);
    }
    
    if (this.sound && this.sound.isPlaying) {
      this.sound.stop();
    }
  }
  
  animate() {
    this.frameId = requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    
    // Update animations
    if (this.mixer) this.mixer.update(delta);
    this.updateModelAnimation();
    this.updateRain();
    this.updateNeonFlicker();
    
    // Update controls
    this.controls.update();
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
  
  // Cleanup method for proper resource management
  dispose() {
    this.stopAnimation();
    
    // Dispose geometries
    this.scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(object.material);
        }
      }
    });
    
    // Clear scene
    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Remove DOM elements
    this.renderer.domElement.remove();
  }
  
  disposeMaterial(material) {
    // Dispose textures
    for (const key in material) {
      const value = material[key];
      if (value && typeof value === 'object' && 'isTexture' in value) {
        value.dispose();
      }
    }
    material.dispose();
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const app = new RainyScene();
  
  // Optional: Store the app instance for debugging
  window.app = app;
  
  // Clean up when leaving the page
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});


const helpers = new THREE.Helpers();
scene.add(helpers);