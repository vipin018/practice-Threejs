import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Main application class
class CyberpunkRainScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.mixer = null;
    this.textureLoader = new THREE.TextureLoader();
    this.audioListener = new THREE.AudioListener();
    this.rainSound = null;
    this.thunderLight = null;
    this.flashPlane = null;
    this.neonLights = [];
    this.neonSigns = [];
    this.rain = null;
    this.rainVelocities = null;

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initEnvironment();
    this.loadModel();
    this.createStreet();
    this.createWalls();
    this.createPuddles();
    this.createRain();
    this.setupAudio();
    this.setupControls();
    this.setupResizeHandler();
    this.animate();
  }

  initScene() {
    this.scene.fog = new THREE.Fog(0x0d0d0f, 10, 80);
    this.scene.background = new THREE.Color(0x0d0d0f);
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
    this.camera.add(this.audioListener);
  }

  initRenderer() {
    const canvas = document.querySelector('#canvas');
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
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

  initEnvironment() {
    new RGBELoader()
      .setPath('./textures/hdri/')
      .load('farm_field_puresky_1k.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.scene.environment = texture;
        // Intentionally not setting scene.background to texture
      });
  }

  initLights() {
    // Base lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 5);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x607080, 0x202030, 15);
    this.scene.add(hemisphereLight);

    // Moon light
    const moonLight = new THREE.DirectionalLight(0x8090a0, 50);
    moonLight.position.set(-15, 30, -15);
    moonLight.castShadow = true;
    
    // Optimize shadow map
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -30;
    moonLight.shadow.camera.right = 30;
    moonLight.shadow.camera.top = 30;
    moonLight.shadow.camera.bottom = -30;
    moonLight.shadow.bias = -0.001;
    moonLight.shadow.normalBias = 0.05;
    this.scene.add(moonLight);

    // Street lights
    this.createStreetLight(-5, 10, -15);
    this.createStreetLight(5, 10, 15);

    // Neon lights and signs
    this.createNeonSign(7, 6, -10, 0x00ffff);
    this.createNeonSign(-7, 6, 10, 0xff1a75);

    // Thunder effect
    this.setupThunderEffect();
  }

  createStreetLight(x, y, z) {
    const streetLightColor = 0xffd6a5;
    const streetLight = new THREE.SpotLight(
      streetLightColor, 800, 50, Math.PI / 7, 0.6, 1.5
    );
    streetLight.position.set(x, y, z);
    streetLight.target.position.set(x, 0, z);
    streetLight.castShadow = true;
    streetLight.shadow.mapSize.width = 512;
    streetLight.shadow.mapSize.height = 512;
    streetLight.shadow.camera.near = 1;
    streetLight.shadow.camera.far = 50;
    streetLight.shadow.bias = -0.005;
    streetLight.shadow.normalBias = 0.02;
    this.scene.add(streetLight, streetLight.target);

    // Glow effect
    const glow = new THREE.PointLight(0xffb774, 10, 8, 2);
    glow.position.copy(streetLight.position).add(new THREE.Vector3(0, -0.5, 0));
    this.scene.add(glow);

    // Light post geometry
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.5
    });
    
    const postGeo = new THREE.CylinderGeometry(0.2, 0.2, y, 8);
    const post = new THREE.Mesh(postGeo, postMaterial);
    post.position.set(x, y/2, z);
    post.castShadow = true;
    this.scene.add(post);
    
    // Lamp head
    const lampGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xffd6a5,
      emissiveIntensity: 5
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.copy(streetLight.position);
    lamp.castShadow = true;
    this.scene.add(lamp);

    // Optional: create light beam
    this.createLightBeam(streetLight, streetLightColor);
  }

  createLightBeam(lightSource, color) {
    const beamGeo = new THREE.ConeGeometry(2.5, 10, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(lightSource.position).add(new THREE.Vector3(0, -5, 0));
    beam.rotation.x = Math.PI;
    // this.scene.add(beam);
  }

  createNeonSign(x, y, z, color) {
    const neonIntensity = 250;
    const neonLight = new THREE.PointLight(color, neonIntensity, 20, 1.5);
    neonLight.position.set(x, y, z);
    this.scene.add(neonLight);
    this.neonLights.push(neonLight);

    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: color,
      emissiveIntensity: 10,
      metalness: 0.5,
      roughness: 0.5,
    });

    // Neon sign geometry
    const neonSignGeo = new THREE.BoxGeometry(3, 1, 0.2);
    const neonSign = new THREE.Mesh(neonSignGeo, neonMat);
    neonSign.position.copy(neonLight.position);
    neonSign.castShadow = true;
    neonSign.receiveShadow = true;
    this.scene.add(neonSign);
    this.neonSigns.push({
      light: neonLight,
      sign: neonSign,
      baseIntensity: neonIntensity,
      baseEmissive: 10,
      material: neonMat,
      time: Math.random() * 100
    });
  }

  setupThunderEffect() {
    this.thunderLight = new THREE.DirectionalLight(0xccddff, 25);
    this.thunderLight.position.set(0, 50, 0);
    this.scene.add(this.thunderLight);

    this.flashPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    this.flashPlane.position.set(0, 20, 0);
    this.flashPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this.flashPlane);
  }

  triggerThunder() {
    const flashIntensity = 10 + Math.random() * 50;
    this.thunderLight.intensity = flashIntensity;
    this.flashPlane.material.opacity = 0.5 + Math.random() * 0.3;

    // Play thunder sound if available
    if (this.thunderSound) {
      this.thunderSound.setVolume(0.3 + Math.random() * 0.2);
      this.thunderSound.play();
    }

    // Multiple flashes
    if (Math.random() > 0.6) {
      setTimeout(() => {
        this.thunderLight.intensity = flashIntensity * 2;
        this.flashPlane.material.opacity = 0.3 + Math.random() * 0.2;
        setTimeout(() => {
          this.thunderLight.intensity = 0;
          this.flashPlane.material.opacity = 0;
        }, 60 + Math.random() * 60);
      }, 50 + Math.random() * 50);
    } else {
      setTimeout(() => {
        this.thunderLight.intensity = 0;
        this.flashPlane.material.opacity = 0;
      }, 80 + Math.random() * 100);
    }
  }

  createPuddles() {
    const puddleGeo = new THREE.CircleGeometry(2, 32);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.1,
      metalness: 0.9,
      envMapIntensity: 5,
    });

    const puddles = [
      [-3, 0.01, -15],
      [3, 0.01, 15],
      [0, 0.01, 5],
      [5, 0.01, -5],
      [-5, 0.01, 0],
      [7, 0.01, -18],
    ];

    puddles.forEach(pos => {
      const puddle = new THREE.Mesh(puddleGeo, puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(...pos);
      puddle.scale.set(
        0.8 + Math.random() * 0.5,
        0.8 + Math.random() * 0.5,
        1
      );
      puddle.receiveShadow = true;
      this.scene.add(puddle);
    });
  }

  createRain() {
    const rainCount = 10000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    this.rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = Math.random() * 120 - 60;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = Math.random() * 120 - 60;
      this.rainVelocities[i] = 0.2 + Math.random() * 0.2;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Use a custom shader for the rain
    const rainMaterial = new THREE.PointsMaterial ({
      color: 0xaaaaaa,
      size: 0.1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.rain = new THREE.Points(rainGeo, rainMaterial);
    this.scene.add(this.rain);
  }

  updateRain() {
    const positions = this.rain.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.array[i * 3 + 1] -= this.rainVelocities[i];
      if (positions.array[i * 3 + 1] < -5) {
        positions.array[i * 3 + 1] = 60 + Math.random() * 20;
        positions.array[i * 3] = Math.random() * 120 - 60;
        positions.array[i * 3 + 2] = Math.random() * 120 - 60;
      }
    }
    positions.needsUpdate = true;
  }

  updateNeonFlicker() {
    const delta = this.clock.getDelta();
    
    this.neonSigns.forEach(neon => {
      neon.time += delta;
      const flickerSpeed = 5 + Math.random() * 3;
      const flickerAmount = neon.baseIntensity * (0.3 + Math.random() * 0.4);
      const flicker = neon.baseIntensity + Math.sin(neon.time * flickerSpeed) * flickerAmount * (Math.random() > 0.1 ? 1 : 0.2);
      
      neon.light.intensity = Math.max(0, flicker);
      neon.material.emissiveIntensity = neon.baseEmissive * (neon.light.intensity / neon.baseIntensity);
    });
  }

  setupAudio() {
    // Rain sound
    this.rainSound = new THREE.Audio(this.audioListener);
    const audioLoader = new THREE.AudioLoader();
    
    audioLoader.load('./audio/rain.mp3', (buffer) => {
      this.rainSound.setBuffer(buffer);
      this.rainSound.setLoop(true);
      this.rainSound.setVolume(0.4);
      this.rainSound.play();
    });
    
    // Thunder sound
    this.thunderSound = new THREE.Audio(this.audioListener);
    audioLoader.load('./audio/thunder.mp3', (buffer) => {
      this.thunderSound.setBuffer(buffer);
      this.thunderSound.setLoop(false);
    });
  }

  loadModel() {
    const loader = new GLTFLoader();
    
    loader.load('./models/model.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(2, 2, 2);
      model.position.set(0, 0, -80);
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(model);

      this.mixer = new THREE.AnimationMixer(model);
      
      // Check if animation exists
      if (gltf.animations && gltf.animations.length > 0) {
        const walkAnimIndex = Math.min(9, gltf.animations.length - 1);
        this.mixer.clipAction(gltf.animations[walkAnimIndex]).play();
      }

      // Animate model approach
      this.animateModelApproach(model);
    }, 
    // Progress callback
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // Error callback
    (error) => {
      console.error('An error happened loading the model:', error);
    });
  }

  animateModelApproach(model) {
    const targetZ = 10;
    const speed = 0.1;
    
    const animateModel = () => {
      if (model.position.z < targetZ) {
        model.position.z += speed;
        requestAnimationFrame(animateModel);
      }
    };
    
    animateModel();
  }

  createStreet() {
    const streetGeo = new THREE.PlaneGeometry(20, 100, 50, 100); // More segments for better shadows
    streetGeo.setAttribute('uv2', new THREE.Float32BufferAttribute(streetGeo.attributes.uv.array, 2));

    const streetDiffuse = this.textureLoader.load('./textures/street/diff.jpg');
    streetDiffuse.wrapS = streetDiffuse.wrapT = THREE.RepeatWrapping;
    streetDiffuse.repeat.set(1, 5);

    const streetNormal = this.textureLoader.load('./textures/street/normal.jpg');
    streetNormal.wrapS = streetNormal.wrapT = THREE.RepeatWrapping;
    streetNormal.repeat.set(1, 5);

    const streetARM = this.textureLoader.load('./textures/street/arm.jpg');
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
      envMapIntensity: 1.5
    });

    const street = new THREE.Mesh(streetGeo, streetMaterial);
    street.rotation.x = -Math.PI / 2;
    street.receiveShadow = true;
    this.scene.add(street);

    // Add drain grates
    this.addDrainGrates();
  }

  addDrainGrates() {
    const grateGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const grateMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.9,
      normalMap: this.textureLoader.load('./textures/grate_normal.jpg'),
    });

    const gratePositions = [
      [-6, 0.02, -10],
      [6, 0.02, 12],
    ];

    gratePositions.forEach(pos => {
      const grate = new THREE.Mesh(grateGeo, grateMat);
      grate.rotation.x = -Math.PI / 2;
      grate.position.set(...pos);
      grate.receiveShadow = true;
      this.scene.add(grate);
    });
  }

  createWalls() {
    const wallGeo = new THREE.BoxGeometry(1, 10, 100);
    wallGeo.setAttribute('uv2', new THREE.Float32BufferAttribute(wallGeo.attributes.uv.array, 2));

    const wallDiffuse = this.textureLoader.load('./textures/walls/diff.jpg');
    wallDiffuse.wrapS = wallDiffuse.wrapT = THREE.RepeatWrapping;
    wallDiffuse.repeat.set(20, 2);

    const wallNormal = this.textureLoader.load('./textures/walls/normal.jpg');
    wallNormal.wrapS = wallNormal.wrapT = THREE.RepeatWrapping;
    wallNormal.repeat.set(20, 2);

    const wallARM = this.textureLoader.load('./textures/walls/arm.jpg');
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
      envMapIntensity: 1.5
    });

    // Left wall
    const wall1 = new THREE.Mesh(wallGeo, wallMaterial);
    wall1.position.set(-10.5, 5, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene.add(wall1);

    // Right wall
    const wall2 = wall1.clone();
    wall2.position.set(10.5, 5, 0);
    this.scene.add(wall2);

    // Add wall details
    this.addWallDetails();
  }

  addWallDetails() {
    // Add windows, fire escapes, pipes, etc.
    const windowGeo = new THREE.PlaneGeometry(1.5, 2);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x444444,
      emissiveIntensity: 0.5
    });

    // Left wall windows
    const windowPositions = [
      [-10, 6, -20],
      [-10, 6, -10],
      [-10, 6, 0],
      [-10, 6, 10],
      [-10, 6, 20],
    ];

    windowPositions.forEach(pos => {
      const windowMesh = new THREE.Mesh(windowGeo, windowMat);
      windowMesh.position.set(...pos);
      windowMesh.rotation.y = Math.PI / 2;
      this.scene.add(windowMesh);

      // Clone to right wall
      const rightWindow = windowMesh.clone();
      rightWindow.position.set(-pos[0], pos[1], pos[2]);
      rightWindow.rotation.y = -Math.PI / 2;
      this.scene.add(rightWindow);
    });
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    this.controls.update();
    
    this.camera.position.z += Math.sin(this.clock.getElapsedTime() * 0.5) * 0.01;
    // this.camera.position.x += Math.cos(this.clock.getElapsedTime() * 0.5) * 0.01;

    this.camera.rotation.z += Math.sin(this.clock.getElapsedTime() * 0.5) *0.1;
    this.updateRain();
    this.updateNeonFlicker();
    
    // Random thunder
    if (Math.random() < 0.0005) {
      this.triggerThunder();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
  new CyberpunkRainScene();
});