<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import type { Experience } from '../../data/experiences';
import { experiences, education } from '../../data/experiences';

const container = ref<HTMLElement | null>(null);

// Join experiences and education
const allNodesData = [...experiences, ...education];

// Three.js variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;
let backgroundStars: THREE.Points;
let foregroundGroup: THREE.Group;

// Config
const BG_STAR_COUNT = 1500;
const NODE_RADIUS = 30; // Spread of foreground nodes

// Initialize Three.js
function initThree() {
  if (!container.value) return;

  // Scene
  scene = new THREE.Scene();
  // Optional: distinct background color or fog
  scene.background = new THREE.Color(0x050510); // Deep space blue/black
  scene.fog = new THREE.FogExp2(0x050510, 0.002);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    2000
  );
  camera.position.z = 100;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.value.appendChild(renderer.domElement);

  // Lighting (for meshes)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  createBackground();
  createForeground();
  
  // Start loop
  animate();
  
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onClick);
}

// Phase 5: Overlay State
const selectedExperience = ref<Experience | null>(null);
const overlayPos = ref({ x: 0, y: 0 });
const showIntro = ref(true);

// Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const targetFocus = new THREE.Vector3(0, 0, 0);
const currentFocus = new THREE.Vector3(0, 0, 0);
let selectedStar: THREE.Object3D | null = null;
const tempVec = new THREE.Vector3();

// Helper to project 3D position to 2D screen coordinates
function updateOverlayPosition() {
  if (!selectedStar || !container.value) return;
  
  // Reuse tempVec to get world position
  selectedStar.getWorldPosition(tempVec);
  
  // Project to NDC
  tempVec.project(camera);
  
  // Convert to pixel coordinates
  // Move it slightly to the right/top of the star
  const x = (tempVec.x * .5 + .5) * container.value.clientWidth;
  const y = (-(tempVec.y * .5) + .5) * container.value.clientHeight;
  
  overlayPos.value = { x, y };
}

function onClick(event: MouseEvent) {
  if (!container.value) return;

  // Calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Intersect with stars (meshes only, ignore lines)
  const meshes = foregroundGroup.children.filter(c => c instanceof THREE.Mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    selectedStar = intersects[0].object;
    selectedExperience.value = selectedStar.userData as Experience;
    console.log('Clicked experience:', selectedStar.userData);
  } else {
    // Clicked void - deselect
    selectedStar = null;
    selectedExperience.value = null;
  }
}

function createBackground() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  
  for (let i = 0; i < BG_STAR_COUNT; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    vertices.push(x, y, z);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
  });
  
  backgroundStars = new THREE.Points(geometry, material);
  scene.add(backgroundStars);
}

function createForeground() {
  foregroundGroup = new THREE.Group();
  scene.add(foregroundGroup);

  allNodesData.forEach((data, index) => {
    // Create a mesh for each experience
    // Using a simple sphere for now as "star" representation
    const geometry = new THREE.SphereGeometry(1.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x40c9ff, // Cyan-ish star
      emissive: 0x004080,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const star = new THREE.Mesh(geometry, material);
    
    // Position randomly within a central cluster
    const r = NODE_RADIUS;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    star.position.set(x, y, z);
    
    // Store metadata on the mesh for later (Phase 4/5)
    star.userData = { ...data, id: index };
    
    foregroundGroup.add(star);
  });

  createConnections();
}

function createConnections() {
  if (foregroundGroup.children.length < 2) return;

  const stars = foregroundGroup.children as THREE.Mesh[];
  const positions: number[] = [];
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x40c9ff,
    transparent: true,
    opacity: 0.2
  });

  // Calculate nearest neighbors
  // For each star, find closest 1-2 neighbors
  stars.forEach((star, i) => {
    const starPos = star.position;
    
    // Sort other stars by distance
    const others = stars.map((other, j) => {
      if (i === j) return { index: -1, distance: Infinity };
      return { index: j, distance: starPos.distanceTo(other.position) };
    }).filter(item => item.index !== -1);

    others.sort((a, b) => a.distance - b.distance);

    // Connect to closest 1 or 2
    const numConnections = Math.min(others.length, 2); 
    for (let k = 0; k < numConnections; k++) {
      const neighbor = stars[others[k].index];
      
      // Add pair of vertices
      positions.push(starPos.x, starPos.y, starPos.z);
      positions.push(neighbor.position.x, neighbor.position.y, neighbor.position.z);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  const lines = new THREE.LineSegments(geometry, lineMaterial);
  foregroundGroup.add(lines);
}

function onWindowResize() {
  if (!container.value || !camera || !renderer) return;
  
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

function animate() {
  animationId = requestAnimationFrame(animate);
  
  // Subtle rotation of the entire universe or clusters
  if (backgroundStars) {
    backgroundStars.rotation.y += 0.00005;
  }
  
  if (foregroundGroup) {
    foregroundGroup.rotation.y += 0.0002;
    foregroundGroup.rotation.x += 0.0001;
  }
  
  // Camera focus logic
  if (selectedStar) {
    // Project for overlay (modifies tempVec internally)
    updateOverlayPosition();
    
    // Get fresh world position for focus logic
    selectedStar.getWorldPosition(tempVec);
    
    // Clamp: Look 80% of the way towards the star
    // This centers it more but keeps context
    tempVec.multiplyScalar(0.8); 
    targetFocus.copy(tempVec);
  } else {
     // Optional: drift back to center
     // targetFocus.set(0, 0, 0);
  }

  currentFocus.lerp(targetFocus, 0.05);
  camera.lookAt(currentFocus);
  
  renderer.render(scene, camera);
}

onMounted(() => {
  initThree();
  setTimeout(() => {
    showIntro.value = false;
  }, 2000);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  
  // Cleanup Three.js resources
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && container.value) {
      container.value.removeChild(renderer.domElement);
    }
  }
  // Dispose geometries/materials... (simplified for now)
});
</script>

<template>
  <div class="experimental-container" ref="container">
    <Transition name="fade">
      <div v-if="showIntro" class="intro-overlay">
        <h1 class="intro-text">Experimental V2</h1>
      </div>
    </Transition>
    <Transition name="fade">
      <div 
        v-if="selectedExperience" 
        class="info-card"
        :style="{ left: overlayPos.x + 'px', top: overlayPos.y + 'px' }"
      >
        <div class="card-glass">
            <h3>{{ selectedExperience.company }}</h3>
            <h4>{{ selectedExperience.title }}</h4>
            <p class="date">{{ selectedExperience.date }}</p>
            <div v-if="selectedExperience.details" class="details">
              <ul>
                <li v-for="(d, i) in selectedExperience.details" :key="i">{{ d }}</li>
              </ul>
            </div>
            <a v-if="selectedExperience.link" :href="selectedExperience.link" target="_blank">More Info</a>
            
            <button class="close-btn" @click.stop="() => { selectedExperience = null; selectedStar = null; }">×</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.experimental-container {
  width: 100vw;
  height: 100vh;
  // Background handled by Three.js
  overflow: hidden;
  position: relative;
  
  /* Ensure no scrollbars/margins leak (double safety) */
  margin: 0;
  padding: 0;
}

.info-card {
  position: absolute;
  z-index: 10;
  pointer-events: none; /* Let clicks pass through, but enable for children? No, card needs interaction */
  
  /* Fix pointer events for the card content only */
  pointer-events: auto;

  transform: translate(20px, -50%); /* Offset slightly right, vert center */
  max-width: 300px;
  width: 90%; // Mobile friendly
}

.card-glass {
  background: rgba(16, 32, 45, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 201, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  color: #fff;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  
  position: relative; // For close button
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #40c9ff;
    font-size: 1.4rem;
  }
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-weight: normal;
    font-size: 1.1rem;
    color: #e0e0e0;
  }
  
  .date {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 1rem;
    font-style: italic;
  }
  
  .details {
    font-size: 0.95rem;
    line-height: 1.4;
    
    ul {
      padding-left: 1.2rem;
      margin: 0;
    }
    
    li {
      margin-bottom: 0.25rem;
    }
  }
  
  a {
      color: #40c9ff;
      display: block;
      margin-top: 1rem;
  }
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 5px;
  
  &:hover {
    color: #fff;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 20;
}

.intro-text {
  font-size: 4rem;
  font-weight: bold;
  color: transparent;
  background: linear-gradient(135deg, #40c9ff, #ff40c9);
  -webkit-background-clip: text;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
  text-shadow: 0 0 20px rgba(64, 201, 255, 0.5);
  animation: pulse 2s infinite;
  text-align: center;
}

@keyframes pulse {
  0%, 100% { text-shadow: 0 0 20px rgba(64, 201, 255, 0.5); }
  50% { text-shadow: 0 0 40px rgba(255, 64, 201, 0.8); }
}
</style>
