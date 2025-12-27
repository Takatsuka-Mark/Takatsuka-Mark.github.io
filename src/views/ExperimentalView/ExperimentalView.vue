<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as THREE from 'three';
import type { Experience } from '../../data/experiences';
import { experiences, education } from '../../data/experiences';
// @ts-ignore
import { forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink } from 'd3-force-3d';

const container = ref<HTMLElement | null>(null);

// Join experiences and education
const allNodesData = [...experiences].reverse().map((d, i) => ({ ...d, id: i }));

// Three.js variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;
let backgroundStars: THREE.Points;
let foregroundGroup: THREE.Group;

// Config
const BG_STAR_COUNT = 15000; // Increased 10x
const NODE_RADIUS = 30; 

// D3 Simulation variables
let simulation: any;
let nodes: any[] = [];
let links: any[] = [];

// Node Labels
interface NodeLabel {
  id: number;
  text: string;
  x: number;
  y: number;
  visible: boolean;
}
const nodeLabels = ref<NodeLabel[]>([]);

// Initialize Three.js
function initThree() {
  if (!container.value) return;

  // Init labels
  nodeLabels.value = allNodesData.map(d => ({
    id: typeof d.id === 'number' ? d.id : 0, // Ensure ID
    text: d.company,
    x: 0,
    y: 0,
    visible: false
  }));

  // Scene
  scene = new THREE.Scene();
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

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  createBackground();
  createForeground();
  createTimeline(); // New
  
  // Start loop
  animate();
  
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onClick);
}

// Phase 5: Overlay State
const selectedExperience = ref<Experience | null>(null);
const overlayPos = ref({ x: 0, y: 0 });
const showIntro = ref(true);
const isBackgroundMoving = ref(true);
const isTimelineView = ref(false);
let timelineGroup: THREE.Group;



// Watch mode switch to handle one-time state changes
watch(isTimelineView, (newVal) => {
  if (newVal) {
    // Switch TO Timeline
    if (simulation) simulation.stop(); // Stop completely so D3 doesn't fight
    
    // Show Timeline visuals
    if (timelineGroup) timelineGroup.visible = true;
    
    // Hide Graph connections
    const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
    if (lineLayer) lineLayer.visible = false;

  } else {
    // Switch TO Graph
    // Restart simulation to let nodes float back
    if (simulation) {
        simulation.alpha(1).restart();
    }
    
    // Hide Timeline visuals
    if (timelineGroup) timelineGroup.visible = false;
    
    // Show Graph connections
    const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
    if (lineLayer) lineLayer.visible = true;
  }
});


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
  const x = (tempVec.x * .5 + .5) * container.value.clientWidth;
  const y = (-(tempVec.y * .5) + .5) * container.value.clientHeight;
  
  overlayPos.value = { x, y };
}

function updateNodeLabels() {
  if (!container.value || nodes.length === 0) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  nodes.forEach((node, i) => {
    // node is the d3 simulation node which holds x,y,z
    // We can use the mesh position directly if we want, or the node pos. 
    // They are synced in animate() before this call usually.
    // Let's use the mesh position to be safe if we add offsets later
    const mesh = foregroundGroup.children.filter(c => c instanceof THREE.Mesh)[i];
    if (!mesh) return;

    mesh.getWorldPosition(tempVec);
    
    // Check if behind camera
    // Project method will return z > 1 if outside frustum in NDC z? 
    // Actually project transforms vector to NDC. 
    // z range is -1 to 1 for inside frustum (OpenGL style)
    tempVec.project(camera);

    const isVisible = tempVec.z < 1 && tempVec.z > -1 
                      && tempVec.x >= -1 && tempVec.x <= 1
                      && tempVec.y >= -1 && tempVec.y <= 1;

    if (isVisible) {
      const x = (tempVec.x * .5 + .5) * width;
      const y = (-(tempVec.y * .5) + .5) * height;
      
      const label = nodeLabels.value[i]; 
      if (label) {
        label.x = x;
        label.y = y - 30; // Shift up slightly
        label.visible = true;
      }
    } else {
       if (nodeLabels.value[i]) nodeLabels.value[i].visible = false;
    }
  });
}

function onClick(event: MouseEvent) {
  if (!container.value) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Intersect with stars (meshes only, ignore lines)
  const meshes = foregroundGroup.children.filter(c => c instanceof THREE.Mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    selectedStar = intersects[0].object;
    // @ts-ignore
    selectedExperience.value = selectedStar.userData; // userData is the full Experience object
  } else {
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

  // Init nodes with random positions
  nodes = allNodesData.map(d => ({
    ...d,
    x: Math.random() * 50 - 25,
    y: Math.random() * 50 - 25,
    z: Math.random() * 50 - 25,
    vx: 0, vy: 0, vz: 0
  }));

  // Create links (Chronological chain)
  links = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    links.push({ source: nodes[i].id, target: nodes[i+1].id });
  }

  // Setup Simulation
  simulation = forceSimulation()
    .numDimensions(3)
    .nodes(nodes)
    .force('link', forceLink(links).id((d: any) => d.id).distance(25)) // Reduced distance to keep graph tighter
    .force('charge', forceManyBody().strength(-100)) // Repulsion
    .force('center', forceCenter(0, 0, 0))
    .force('collide', forceCollide(10)); // Prevent overlapping nodes

  // Create Meshes
  nodes.forEach((node) => {
    const geometry = new THREE.SphereGeometry(1.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x40c9ff,
      emissive: 0x004080,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });
    
    // @ts-ignore
    const star = new THREE.Mesh(geometry, material);
    star.userData = node; // Link mesh back to data
    foregroundGroup.add(star);
  });

  // Create Lines (visuals)
  // We'll update their positions in animate()
  // Just create a LineSegments object that will hold all lines
  const geometry = new THREE.BufferGeometry();
  // Allocate enough buffer for links
  const positions = new Float32Array(links.length * 6); // 2 points * 3 coords
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x40c9ff,
    transparent: true,
    opacity: 0.2
  });
  
  const lineSegments = new THREE.LineSegments(geometry, lineMaterial);
  // @ts-ignore
  lineSegments.userData = { isLineLayer: true };
  foregroundGroup.add(lineSegments);
}

function createTimeline() {
  timelineGroup = new THREE.Group();
  scene.add(timelineGroup);
  timelineGroup.visible = false; // Hidden by default

  // Calculate Range
  // @ts-ignore
  const startDates = nodes.map(n => n.startDate).filter(d => d !== undefined);
  // @ts-ignore
  const endDates = nodes.map(n => n.endDate).filter(d => d !== undefined);
  
  const minYear = Math.floor(Math.min(...startDates));
  const maxYear = Math.ceil(Math.max(...endDates));
  
  const yearSpan = maxYear - minYear;
  const unitPerYear = 30; // Scale
  const totalWidth = yearSpan * unitPerYear;
  const startX = -totalWidth / 2;

  // 1. Main Axis Line
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(startX, -15, 0),
      new THREE.Vector3(startX + totalWidth, -15, 0)
  ]);
  const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  const axis = new THREE.Line(axisGeo, axisMat);
  timelineGroup.add(axis);

  // 2. Ticks
  const ticks = [];
  for (let y = minYear; y <= maxYear; y++) {
      const x = startX + (y - minYear) * unitPerYear;
      ticks.push(x, -15, 0);
      ticks.push(x, -17, 0); // Short tick down
  }
  const ticksGeo = new THREE.BufferGeometry();
  ticksGeo.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
  const ticksLines = new THREE.LineSegments(ticksGeo, axisMat);
  timelineGroup.add(ticksLines);

  // Store timeline positions on nodes for easy lerping
  nodes.forEach(node => {
      if (node.startDate !== undefined) {
          const x = startX + (node.startDate - minYear) * unitPerYear;
          // @ts-ignore
          node.timelinePos = new THREE.Vector3(x, -10, 0); // Just above axis
          
          // Duration Line (Bar)
          if (node.endDate !== undefined) {
              const endX = startX + (node.endDate - minYear) * unitPerYear;
              const barGeo = new THREE.BufferGeometry().setFromPoints([
                  new THREE.Vector3(x, -10, 0),
                  new THREE.Vector3(endX, -10, 0)
              ]);
              const barMat = new THREE.LineBasicMaterial({ color: 0x40c9ff, opacity: 0.8, transparent: true });
              const bar = new THREE.Line(barGeo, barMat);
              timelineGroup.add(bar);
          }
      } else {
          // Fallback for nodes without date
          // @ts-ignore
          node.timelinePos = new THREE.Vector3(0, 50, 0); // Float high up?
      }
  });
}

function onWindowResize() {
  if (!container.value || !camera || !renderer) return;
  
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  // Run simulation tick (optional: could run only N times, but continuous is smooth)
  // simulation.tick(); // d3-force usually ticks automatically if not stopped, 
  // but usually we just read x/y/z. forceSimulation starts automatically.

  // Update Node Meshes
  const meshes = foregroundGroup.children.filter(c => c instanceof THREE.Mesh);
  meshes.forEach((mesh, i) => {
     // nodes[i] matches meshes[i] order if we created them in order
     // Double check data ID if unsure, but sequential creation is safe here
     const node = nodes[i]; 
     
     if (isTimelineView.value) {
         // Lerp to timeline position
         // @ts-ignore
         if (node.timelinePos) {
             // We modify the node.x/y/z directly so the camera logic still works naturally?
             // Or better, modify smooth target.
             // Implem: lerp node position directly here, simulation OFF
             node.x += (node.timelinePos.x - node.x) * 0.1;
             node.y += (node.timelinePos.y - node.y) * 0.1;
             node.z += (node.timelinePos.z - node.z) * 0.1;
         }
     } else {
         // Simulation ON (handled by d3 usually, but if we dragged them away manually, 
         // we need to let d3 take back control. d3 updates x/y/z on tick(), so we just read them.
         // If we want smooth transition BACK, we might need to verify if d3 snaps or lerps.
         // d3 force simulation is iterative. If we stop updating 'node' from simulation, it pauses.
         // But if we override node.x, d3 will try to correct it in next tick.
         // So for "smooth return", we just let d3 do its thing.
         // However, if we stopped ticking, we must restart.
     }
     
     mesh.position.set(node.x, node.y, node.z);
  });
  



  // Update Links
  const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
  if (lineLayer && lineLayer.geometry && lineLayer.geometry.attributes.position) {
      const positions = lineLayer.geometry.attributes.position.array as Float32Array;
      links.forEach((link, i) => {
          // d3-force replaces source/target with object references after init
          const source = link.source; 
          const target = link.target;
          
          positions[i * 6 + 0] = source.x;
          positions[i * 6 + 1] = source.y;
          positions[i * 6 + 2] = source.z;
          
          positions[i * 6 + 3] = target.x;
          positions[i * 6 + 4] = target.y;
          positions[i * 6 + 5] = target.z;
      });
      lineLayer.geometry.attributes.position.needsUpdate = true;
  }
  
  // Background rotation
  if (backgroundStars && isBackgroundMoving.value) {
    backgroundStars.rotation.y += 0.00005; // Keep this subtle
  }
  
  // Update Labels
  updateNodeLabels();
  
  // Foreground rotation - REMOVED random tumbling
  // But maybe we want slight global drift?
  // foregroundGroup.rotation.y += 0.0002; 
  
  // Camera focus logic
  const targetPos = selectedStar ? selectedStar.position : new THREE.Vector3(0, 0, 0);
  
  // 1. Determine optimal camera Z to keep all nodes in view relative to targetPos
  // We align camera X/Y with targetPos X/Y so it's centered
  let maxZreq = 100; // Minimum distance
  
  const fov = camera.fov * (Math.PI / 180);
  const aspect = camera.aspect;
  // tan(fov/2) is the ratio of half-height to distance
  const tanFov2 = Math.tan(fov / 2);
  
  // Iterate all nodes to find most constraining one
  nodes.forEach(node => {
     // Distances from the center of view (which is targetPos.x, targetPos.y)
     const dx = Math.abs(node.x - targetPos.x);
     const dy = Math.abs(node.y - targetPos.y);
     const margin = 20; // Padding units
     
     // Required distance Zc from node.z to see this dx/dy
     // visible_y = (dist) * tanFov2 * 2
     // we want (dy + margin) < visible_y / 2  => (dy + margin) < dist * tanFov2
     // dist > (dy + margin) / tanFov2
     
     // The camera is at Zc, node is at node.z. Distance is (Zc - node.z) assuming Zc > node.z
     // Zc > node.z + (required_dist)
     
     const zReqY = node.z + (dy + margin) / tanFov2;
     const zReqX = node.z + (dx + margin) / (tanFov2 * aspect);
     
     maxZreq = Math.max(maxZreq, zReqY, zReqX);
  });

  // Override camera for Timeline
  if (isTimelineView.value) {
      // Fixed camera position for timeline
      targetPos.set(0, -10, 0); // Look at center of timeline
      maxZreq = 180; // Fixed zoom
  }
  
  // Clamping strictness
  // If we are unconnected, we might zoom way out. 
  // Limit max zoom for sanity? 
  maxZreq = Math.min(maxZreq, 400); 

  // Smoothly move camera
  // Target position is (target.x, target.y, calculated_Z)
  // Target LookAt is (target.x, target.y, target.z)
  
  const currentCamPos = camera.position;
  const desiredCamPos = new THREE.Vector3(targetPos.x, targetPos.y, maxZreq);
  
  // Lerp factor
  const alpha = 0.05;
  currentCamPos.lerp(desiredCamPos, alpha);
  
  // Look at target (smoothly)
  currentFocus.lerp(targetPos, alpha);
  camera.lookAt(currentFocus);
  
  if (selectedStar) updateOverlayPosition();

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
  
  if (simulation) simulation.stop();

  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && container.value) {
      container.value.removeChild(renderer.domElement);
    }
  }
});
</script>

<template>
  <div class="experimental-container" ref="container">
    
    <!-- Page Title -->
    <div class="page-title">Experience</div>

    <!-- Background Toggle -->
    <div class="bg-toggle" @click="isBackgroundMoving = !isBackgroundMoving">
        {{ isBackgroundMoving ? 'PAUSE STARS' : 'PLAY STARS' }}
    </div>

    <!-- Timeline Toggle -->
    <div class="timeline-toggle" @click="isTimelineView = !isTimelineView">
        {{ isTimelineView ? 'SHOW GRAPH' : 'SHOW TIMELINE' }}
    </div>

    <!-- Node Labels -->
    <div 
        v-for="label in nodeLabels" 
        :key="label.id" 
        class="node-label"
        :style="{ 
            left: label.x + 'px', 
            top: label.y + 'px', 
            opacity: label.visible ? 0.7 : 0 
        }"
    >
        {{ label.text }}
    </div>

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

<style scoped src="./ExperimentalView.scss" lang="scss"/>

<style scoped>
.timeline-toggle {
    position: absolute;
    top: 5rem; /* Below the PAUSE STARS button */
    left: 2rem;
    color: #40c9ff;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    z-index: 20;
    padding: 0.5rem 1rem;
    border: 1px solid rgba(64, 201, 255, 0.3);
    border-radius: 4px;
    background: rgba(16, 32, 45, 0.6);
    backdrop-filter: blur(4px);
    transition: all 0.2s ease;
}

.timeline-toggle:hover {
    background: rgba(64, 201, 255, 0.2);
    color: #fff;
    border-color: rgba(64, 201, 255, 0.6);
}
</style>
