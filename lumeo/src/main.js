import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
        import { FontLoader } from 'three/addons/loaders/FontLoader.js';
        import gsap from 'gsap';

        // === DOM ===
        const canvas = document.querySelector('#canvas');
        const loadingIndicator = document.querySelector('#loading-indicator');
        const cursor = document.querySelector('.cursor'); // Get the cursor element

        // === Scene Setup ===
        const scene = new THREE.Scene();

        // === Camera Setup ===
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 8);

        // === Renderer Setup ===
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // === Lighting ===
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7);
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 50;
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        // === Ground ===
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.ShadowMaterial({ opacity: 0.2 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -4.5;
        ground.receiveShadow = true;
        scene.add(ground);

        // === Loading Manager ===
        const loadingManager = new THREE.LoadingManager();
        loadingManager.onStart = () => loadingIndicator.style.display = 'block';
        loadingManager.onLoad = () => loadingIndicator.style.display = 'none';
        loadingManager.onProgress = (_, loaded, total) => {
            loadingIndicator.textContent = `Loading... ${Math.round((loaded / total) * 100)}%`;
        };
        loadingManager.onError = () => {
            loadingIndicator.textContent = 'Error loading!';
            loadingIndicator.style.color = 'red';
        };

        // === Texture ===
        const textureLoader = new THREE.TextureLoader(loadingManager);
        const matcap = textureLoader.load('/texture/tex7.jpg');
        const material = new THREE.MeshMatcapMaterial({ matcap });

        // === Load Model ===
        const gltfLoader = new GLTFLoader(loadingManager);
        let model;

        gltfLoader.load('/model/bottle2.glb', (gltf) => {
            model = gltf.scene;
            model.scale.set(0.01, 0.01, 0.01);
            model.position.y = -4;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = material.clone();
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);
            runIntroAnimation();
        });

        function runIntroAnimation() {
            gsap.to(model.scale, {
                x: 0.9,
                y: 0.8,
                z: 0.9,
                duration: 1.5,
                ease: "expo.out",
                delay: 0.2
            });

            gsap.from(camera.position, {
                z: 12,
                duration: 1.5,
                ease: "power2.out"
            });
        }

        // === Controls ===
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, -1, 0);
        controls.enableZoom = false;
        controls.enableRotate = false;
        controls.update();

        // === Camera Presets ===
        const cameraPresets = {
            front: () => setCamera(0, 0, 8),
            top: () => setCamera(0, 8, 0),
            side: () => setCamera(8, 0, 0),
        };

        function setCamera(x, y, z) {
          gsap.to(camera.position, {
              x, y, z,
              duration: 1.2,
              ease: "power2.out"
          });
      }
      
      const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

let hovered = false;


        document.querySelectorAll('#camera-buttons button').forEach(btn => {
            const view = btn.dataset.view;
            if (cameraPresets[view]) {
                btn.addEventListener('click', () => cameraPresets[view]());
            }
        });

        // === Text Geometry ===
        let textMesh;
        const fontLoader = new FontLoader(loadingManager);
        fontLoader.load('/fonts/Satoshi Variable_Bold.json', (font) => {
            const textGeometry = new TextGeometry('LUMEO', {
                font: font,
                size: 5,
                height: 0.5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelSegments: 5,
                depth: 1,
            });

            textGeometry.center();

            const textMaterial = new THREE.MeshStandardMaterial({
                color: "#BCC0C6",
                metalness: 0.9,
                roughness: 0.2,
                emissive: "#ffffff",
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0
            });

            textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(0, -2, -2);
            textMesh.receiveShadow = true;
            scene.add(textMesh);

            gsap.from(textMesh.scale, {
                x: 0.5, y: 0.5, z: 0.5,
                duration: 1.2,
                ease: 'bounce.out',
                delay: 0.8
            });

            gsap.from(textMesh.position, {
                y: -6,
                duration: 1.5,
                ease: 'elastic.out',
                delay: 0.8
            });

            gsap.to(textMaterial, {
                opacity: 1,
                duration: 1.2,
                ease: "elastic.out",
                delay: 0.9
            });
        });

        // === Resize ===
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
           
        });

        // === Animation Loop ===
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            if (model) {
                model.rotation.y = clock.getElapsedTime() * 0.5;
            }

            light.position.x = Math.sin(clock.getElapsedTime() * 0.5) * 5;
            light.position.z = Math.cos(clock.getElapsedTime() * 0.5) * 5;

            controls.update();
            renderer.render(scene, camera);

            if (model) {
              raycaster.setFromCamera(mouse, camera);
              const intersects = raycaster.intersectObject(model, true);
              if (intersects.length > 0) {
                  if (!hovered) {
                      hovered = true;
                      gsap.to(model.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.3 });
                  }
              } else {
                  if (hovered) {
                      hovered = false;
                      gsap.to(model.scale, { x: 0.9, y: 0.8, z: 0.9, duration: 0.3 });
                  }
              }
          }
          
        }

        animate();

        // Custom cursor functionality
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (cursor) {
                cursor.style.left = mouseX + 'px';
                cursor.style.top = mouseY + 'px';
            }
        });

        window.addEventListener('scroll', () => {
          const t = window.scrollY;
          camera.position.y = t * -0.002;
      });
      