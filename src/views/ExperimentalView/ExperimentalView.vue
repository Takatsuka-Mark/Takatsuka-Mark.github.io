<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
import * as THREE from 'three';
import type { Experience } from '../../data/experiences';
import { experiences, education } from '../../data/experiences';
// @ts-ignore
import { forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink, forceX, forceY, forceZ } from 'd3-force-3d';

const container = ref<HTMLElement | null>(null);

// --- Cluster Configuration ---
type ClusterType = 'experience' | 'education' | 'project' | 'contact';

interface ClusterConfig {
    id: ClusterType;
    label: string;
    position: THREE.Vector3; // center of the cluster in 3D space
    color: number;
}

// Layout: Experience (Main) at 0,0,0
// Others in the "background" (Top Right / Top Left / etc)
const CLUSTER_CONFIG: Record<ClusterType, ClusterConfig> = {
    experience: {
        id: 'experience',
        label: 'Experience',
        position: new THREE.Vector3(0, 0, 0),
        color: 0x40c9ff // Cyan
    },
    education: {
        id: 'education',
        label: 'Education',
        position: new THREE.Vector3(80, 50, -50), // Top Right
        color: 0xffaa00 // Orange
    },
    project: {
        id: 'project',
        label: 'Projects', // Personal Projects
        position: new THREE.Vector3(120, 20, -80), // Further Right
        color: 0x55ff55 // Green
    },
    contact: {
        id: 'contact',
        label: 'Contact',
        position: new THREE.Vector3(100, -50, -60), // Bottom Right
        color: 0xff55aa // Pink
    }
};

// --- Data Preparation ---
// Mock Data for Projects and Contact
const projectsData: Experience[] = [
    { company: 'Portfolio V1', title: 'Personal Site', date: '2023', details: ['Previous iteration'], link: '', startDate: 2023, endDate: 2023 },
    { company: 'Game Engine', title: 'C++ Engine', date: '2022', details: ['Custom OpenGL Engine'], link: '', startDate: 2022, endDate: 2022 },
    { company: 'AI Agents', title: 'Research', date: '2024', details: ['LLM Experiments'], link: '', startDate: 2024, endDate: 2024 }
];

const contactData: Experience[] = [
    { company: 'Email', title: 'takatsuka.mark@gmail.com', date: '', details: ['Contact me'], link: 'mailto:takatsuka.mark@gmail.com' },
    { company: 'LinkedIn', title: 'Profile', date: '', details: ['Connect'], link: 'https://linkedin.com' },
    { company: 'GitHub', title: 'Repositories', date: '', details: ['Check my code'], link: 'https://github.com/Takatsuka-Mark' }
];

// Combine and Assign Cluster IDs
const allNodesData = [
    ...experiences.map(d => ({ ...d, cluster: 'experience' as ClusterType })),
    ...education.map(d => ({ ...d, cluster: 'education' as ClusterType })),
    ...projectsData.map(d => ({ ...d, cluster: 'project' as ClusterType })),
    ...contactData.map(d => ({ ...d, cluster: 'contact' as ClusterType }))
].map((d, i) => ({ ...d, id: i }));

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

interface TimelineLabel {
  id: string;
  text: string;
  x: number;
  y: number; // screen y
  worldPos: THREE.Vector3;
  visible: boolean;
}
const timelineLabels = ref<TimelineLabel[]>([]);

// Color Palette Helper
function checksum(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

const colorPalette = [
    0x40c9ff, // Cyan
    0xff5555, // Red
    0x55ff55, // Green
    0xffaa00, // Orange
    0xaa55ff, // Purple
    0xff55aa  // Pink
];

function getCompanyColor(company: string): number {
    const idx = Math.abs(checksum(company)) % colorPalette.length;
    return colorPalette[idx];
}


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

// New: Navigation State
const activeCluster = ref<ClusterType | null>(null);

function navigateToCluster(clusterId: ClusterType | null) {
    activeCluster.value = clusterId;
    if (clusterId === null) {
        selectedExperience.value = null; // Clear selection on zoom out
        selectedStar = null;
    }
}

// Cluster Labels (3D -> 2D)
interface ClusterLabel {
    id: ClusterType;
    text: string;
    x: number;
    y: number;
    visible: boolean;
    scale: number; // For scaling effect tailored to distance
}
const clusterLabels = ref<ClusterLabel[]>([]);

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
    
    // Force experience cluster active implicitly? Or just ignore activeCluster in camera logic
    navigateToCluster('experience'); // Keep it simple

  } else {
    // Switch TO Graph
    // Randomize velocity to break the line structure naturally, but don't teleport positions
    nodes.forEach(node => {
        // Kick them!
        node.vx = (Math.random() - 0.5) * 5;
        node.vy = (Math.random() - 0.5) * 5;
        node.vz = (Math.random() - 0.5) * 5;
    });

    // Restart simulation to let nodes float back
    if (simulation) {
        simulation.alpha(1).restart();
    }
    
    // Hide Timeline visuals
    if (timelineGroup) timelineGroup.visible = false;
    
    // Show Graph connections
    const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
    if (lineLayer) lineLayer.visible = true;
    
    // Go to Overview
    navigateToCluster(null);
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

  // Update Node Labels
  nodes.forEach((node, i) => {
    // Show labels only for the ACTIVE cluster to avoid clutter
    // Or for all? "When I enter... I want each of these clusters to be shown with their heading."
    // User wants Cluster Headers. Node labels are separate.
    // Show node labels ONLY if we are zoomed in (activeCluster is not null) AND node belongs to activeCluster
    const shouldShow = activeCluster.value !== null && node.cluster === activeCluster.value;
    
    if (!shouldShow) {
        if (nodeLabels.value[i]) nodeLabels.value[i].visible = false;
        return;
    }

    // node is the d3 simulation node which holds x,y,z
    const mesh = foregroundGroup.children.filter(c => c instanceof THREE.Mesh)[i];
    if (!mesh) return;

    mesh.getWorldPosition(tempVec);
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
  
  // Update Cluster Labels
  clusterLabels.value = (Object.keys(CLUSTER_CONFIG) as ClusterType[]).map(type => {
      const config = CLUSTER_CONFIG[type];
      tempVec.copy(config.position);
      
      // We want the label to appear 'above' the cluster
      tempVec.y += 20; 
      
      tempVec.project(camera);
      
      const isVisible = tempVec.z < 1 && tempVec.z > -1; 
      
      if (isVisible) {
          const x = (tempVec.x * .5 + .5) * width;
          const y = (-(tempVec.y * .5) + .5) * height;
          
          // Scale based on distance (pseudo)
          const scale = Math.max(0.5, 1 - (tempVec.z * 0.5)); 
          
          return {
              id: type,
              text: config.label,
              x, y,
              visible: true,
              scale
          };
      } else {
           return { id: type, text: config.label, x: 0, y: 0, visible: false, scale: 1 };
      }
  });
  
  // Update Timeline Labels
  if (isTimelineView.value) {
      timelineLabels.value.forEach(label => {
          // Use stored worldPos
          tempVec.copy(label.worldPos);
          tempVec.project(camera);
          
          const isVisible = tempVec.z < 1 && tempVec.z > -1 
                          && tempVec.x >= -1 && tempVec.x <= 1
                          && tempVec.y >= -1 && tempVec.y <= 1;
                          
          if (isVisible) {
              label.x = (tempVec.x * .5 + .5) * width;
              label.y = (-(tempVec.y * .5) + .5) * height;
              label.visible = true;
          } else {
              label.visible = false;
          }
      });
  }
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

// Update Foreground with Multi-Cluster Logic
function createForeground() {
  foregroundGroup = new THREE.Group();
  scene.add(foregroundGroup);

  // Init nodes with random positions near their cluster center
  nodes = allNodesData.map(d => {
      // @ts-ignore
      const center = CLUSTER_CONFIG[d.cluster].position;
      return {
        ...d,
        x: center.x + (Math.random() - 0.5) * 50,
        y: center.y + (Math.random() - 0.5) * 50,
        z: center.z + (Math.random() - 0.5) * 50,
        vx: 0, vy: 0, vz: 0
      };
  });

  // Create links (Chronological chain WITHIN clusters)
  links = [];
  const clusters = ['experience', 'education', 'project', 'contact'];
  
  clusters.forEach(clusterId => {
      const clusterNodes = nodes.filter(n => n.cluster === clusterId);
      for (let i = 0; i < clusterNodes.length - 1; i++) {
          links.push({ source: clusterNodes[i].id, target: clusterNodes[i+1].id });
      }
  });

  // Setup Simulation
  simulation = forceSimulation()
    .numDimensions(3)
    .nodes(nodes)
    .force('link', forceLink(links).id((d: any) => d.id).distance(20))
    .force('charge', forceManyBody().strength(-50)) // Reduced repulsion to keep clusters tight
    .force('collide', forceCollide(8))
    // Cluster positioning forces
    .force('x', forceX((d: any) => CLUSTER_CONFIG[d.cluster as ClusterType].position.x).strength(0.1))
    .force('y', forceY((d: any) => CLUSTER_CONFIG[d.cluster as ClusterType].position.y).strength(0.1))
    .force('z', forceZ((d: any) => CLUSTER_CONFIG[d.cluster as ClusterType].position.z).strength(0.1));

  // Create Meshes
  nodes.forEach((node) => {
    const geometry = new THREE.SphereGeometry(1.5, 16, 16);
    // @ts-ignore
    const color = CLUSTER_CONFIG[node.cluster].color;
    
    // Maybe vary slightly based on company hash for texture, but keep base hue?
    // Let's stick to distinct cluster colors for now as requested.
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: 0x004080,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.8
    });
    
    // @ts-ignore
    const star = new THREE.Mesh(geometry, material);
    star.userData = node; // Link mesh back to data
    foregroundGroup.add(star);
  });

  // Create Lines (visuals)
  const geometry = new THREE.BufferGeometry();
  const positionCount = links.length * 6; // 2 points * 3 coords
  // Guard against empty links (e.g. single node clusters)
  const positions = new Float32Array(Math.max(positionCount, 0)); 
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x40c9ff,
    transparent: true,
    opacity: 0.1
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
  const startDates = nodes.map(n => n.startDate).filter((d): d is number => d !== undefined);
  const endDates = nodes.map(n => n.endDate).filter((d): d is number => d !== undefined);
  
  if (startDates.length === 0) return; // Should not happen with valid data
  
  // Add some padding
  const minYear = Math.floor(Math.min(...startDates));
  const maxYear = Math.ceil(Math.max(...endDates));
  
  const unitPerYear = 30; // Scale
  
  // Adjust bounds relative to a center point or just start from left?
  // Let's center the whole timeline around 0
  const range = maxYear - minYear;
  const startX = -(range * unitPerYear) / 2;
  
  // 1. Main Axis Line
  const totalWidth = range * unitPerYear;
  
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(startX, -15, 0),
      new THREE.Vector3(startX + totalWidth, -15, 0)
  ]);
  const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
  const axis = new THREE.Line(axisGeo, axisMat);
  timelineGroup.add(axis);

  // 2. Axis Ticks & Labels (Years)
  const axisTicks = [];
  timelineLabels.value = [];
  
  for (let y = minYear; y <= maxYear; y++) {
      const x = startX + (y - minYear) * unitPerYear;
      axisTicks.push(x, -15, 0);
      axisTicks.push(x, -18, 0); // Tick down
      
      // Store label info
      timelineLabels.value.push({
          id: `year-${y}`,
          text: y.toString(),
          x: 0,
          y: 0,
          worldPos: new THREE.Vector3(x, -25, 0),
          visible: false
      });
  }
  
  const axisTicksGeo = new THREE.BufferGeometry();
  axisTicksGeo.setAttribute('position', new THREE.Float32BufferAttribute(axisTicks, 3));
  const axisTicksLines = new THREE.LineSegments(axisTicksGeo, axisMat);
  timelineGroup.add(axisTicksLines);

  // 3. Experience Bars (Stacked)
  // Sort nodes by startDate
  const sortedNodes = [...nodes].sort((a, b) => (a.startDate || 0) - (b.startDate || 0));
  
  // Lanes logic
  const lanes: number[] = []; // Stores the endDate of the last item in each lane
  const laneHeight = 10;
  const baseHeight = -5; // Start slightly above axis
  
  sortedNodes.forEach(node => {
      if (node.startDate === undefined) {
           // Fallback for non-dated nodes
           // @ts-ignore
           node.timelinePos = new THREE.Vector3(0, 50, 0);
           return;
      }
      
      const nodeStart = node.startDate;
      // @ts-ignore
      const nodeEnd = node.endDate || node.startDate + 0.5; // fallback duration
      
      // Find a lane
      let laneIndex = -1;
      for (let i = 0; i < lanes.length; i++) {
          if (lanes[i] < nodeStart) {
              laneIndex = i;
              break;
          }
      }
      
      if (laneIndex === -1) {
          laneIndex = lanes.length;
          lanes.push(0);
      }
      
      // Update lane
      lanes[laneIndex] = nodeEnd;
      
      // Calculate Position
      const xStart = startX + (nodeStart - minYear) * unitPerYear;
      const xEnd = startX + (nodeEnd - minYear) * unitPerYear;
      const yPos = baseHeight + (laneIndex * laneHeight);
      
      // @ts-ignore
      node.timelinePos = new THREE.Vector3(xStart, yPos, 0); // Node sits at start of bar? Or middle?
      // Let's sit node at the *start* of the experience for now, or maybe centered?
      // User request: "Ticks on the experience"
      
      // Draw Bar
      const color = getCompanyColor(node.company);
      const barGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xStart, yPos - 2, 0), // Offset slightly from node center?
          new THREE.Vector3(xEnd, yPos - 2, 0)
      ]);
      const barMat = new THREE.LineBasicMaterial({ color: color, opacity: 0.8, transparent: true });
      const bar = new THREE.Line(barGeo, barMat);
      timelineGroup.add(bar);
      
      // Draw Ticks on Experience (Yearly ticks)
      const expTicks = [];
      const startYearCeil = Math.ceil(nodeStart);
      const endYearFloor = Math.floor(nodeEnd);
      
      for (let y = startYearCeil; y <= endYearFloor; y++) {
             const tickX = startX + (y - minYear) * unitPerYear;
             expTicks.push(tickX, yPos - 1, 0);
             expTicks.push(tickX, yPos - 3, 0);
      }
      
      if (expTicks.length > 0) {
          const expTicksGeo = new THREE.BufferGeometry();
          expTicksGeo.setAttribute('position', new THREE.Float32BufferAttribute(expTicks, 3));
          const expTicksMat = new THREE.LineBasicMaterial({ color: color, opacity: 0.5, transparent: true });
          const expTicksLines = new THREE.LineSegments(expTicksGeo, expTicksMat);
          timelineGroup.add(expTicksLines);
      }
  });
}


// ... (previous code)

function onWindowResize() {
  if (!container.value || !camera || !renderer) return;
  
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  // Update Node Meshes (Lerping)
  const meshes = foregroundGroup.children.filter(c => c instanceof THREE.Mesh);
  meshes.forEach((mesh, i) => {
     const node = nodes[i]; 
     
     if (isTimelineView.value) {
         // @ts-ignore
         if (node.timelinePos) {
             const lerpSpeed = 0.04;
             node.x += (node.timelinePos.x - node.x) * lerpSpeed;
             node.y += (node.timelinePos.y - node.y) * lerpSpeed;
            node.z += (node.timelinePos.z - node.z) * lerpSpeed;
            mesh.position.set(node.x, node.y, node.z);
        }
    } else {
        // Simulation ON
        const lerpSpeed = 0.04;
        mesh.position.x += (node.x - mesh.position.x) * lerpSpeed;
        mesh.position.y += (node.y - mesh.position.y) * lerpSpeed;
        mesh.position.z += (node.z - mesh.position.z) * lerpSpeed;
    }
 });

  // Update Links (Visuals)
  const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
  if (lineLayer && lineLayer.geometry && lineLayer.geometry.attributes.position) {
      const positions = lineLayer.geometry.attributes.position.array as Float32Array;
      links.forEach((link, i) => {
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
    backgroundStars.rotation.y += 0.00005; 
  }
  
  // Camera focus logic
  const targetPos = new THREE.Vector3(0, 0, 0); 
  let maxZreq = 100;
  
  if (isTimelineView.value) {
     // TIMELINE VIEW
     if (selectedStar) {
         targetPos.copy(selectedStar.position);
         maxZreq = 100; 
     } else {
         targetPos.set(0, 0, 0); 
         maxZreq = 180;
     }
     
     // Clamp focus X
     const clampRange = 100;
     if (targetPos.x < -clampRange) targetPos.x = -clampRange;
     if (targetPos.x > clampRange) targetPos.x = clampRange;
     
  } else {
      // GRAPH VIEW
      if (activeCluster.value) {
          // Focus on active cluster
            if (activeCluster.value === 'experience' && selectedStar === null) {
              // Special case for Experience (center):
               targetPos.copy(CLUSTER_CONFIG['experience'].position);
               maxZreq = 120;
            } else if (selectedStar) {
              targetPos.copy(selectedStar.position);
              maxZreq = 80; // Zoom in on node
            } else {
              targetPos.copy(CLUSTER_CONFIG[activeCluster.value].position);
              maxZreq = 120; 
            }
      } else {
          // Overview: See all clusters
          targetPos.set(50, 0, 0); // Roughly center
          maxZreq = 250; // Far out
      }
  }
 
  // Smoothly move camera
  const currentCamPos = camera.position;
  const desiredCamPos = new THREE.Vector3(targetPos.x, targetPos.y, maxZreq);
  
  const alpha = 0.05;
  currentCamPos.lerp(desiredCamPos, alpha);
  
  currentFocus.lerp(targetPos, alpha);
  camera.lookAt(currentFocus);
  
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  updateNodeLabels();
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
    
    <!-- Page Title / Breadcrumb -->
    <div class="page-title" @click="navigateToCluster(null)" style="cursor: pointer;">
        {{ activeCluster ? '← Back to Overview' : 'Experimental Lab' }}
    </div>

    <!-- Background Toggle -->
    <div class="bg-toggle" @click="isBackgroundMoving = !isBackgroundMoving">
        {{ isBackgroundMoving ? 'PAUSE STARS' : 'PLAY STARS' }}
    </div>

    <!-- Timeline Toggle (Only show if in Experience or Overview?) -->
    <div class="timeline-toggle" @click="isTimelineView = !isTimelineView" v-if="activeCluster === 'experience' || !activeCluster">
        {{ isTimelineView ? 'SHOW GRAPH' : 'SHOW TIMELINE' }}
    </div>

    <!-- Cluster Headers -->
    <div
        v-if="!isTimelineView"
        v-for="label in clusterLabels"
        :key="label.id"
        class="cluster-label"
        :class="{ 'active': activeCluster === label.id }"
        :style="{
            left: label.x + 'px',
            top: label.y + 'px',
            opacity: label.visible ? (activeCluster === label.id ? 0 : 0.8) : 0,
            transform: `translate(-50%, -50%) scale(${label.scale})`,
            pointerEvents: label.visible ? 'auto' : 'none'
        }"
        @click.stop="navigateToCluster(label.id)"
    >
        {{ label.text }}
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
    
    <!-- Timeline Labels (Years) -->
    <div
        v-if="isTimelineView"
        v-for="label in timelineLabels"
        :key="label.id"
        class="timeline-label"
        :style="{
            left: label.x + 'px',
            top: label.y + 'px',
            opacity: label.visible ? 0.5 : 0
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

.cluster-label {
    position: absolute;
    color: #ffffff;
    font-family: 'Orbitron', 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(0,0,0,0.8);
    cursor: pointer;
    z-index: 10;
    transition: color 0.3s ease, text-shadow 0.3s ease;
    white-space: nowrap;
}

.cluster-label:hover {
    color: #40c9ff;
    text-shadow: 0 0 20px #40c9ff;
}

.page-title {
    transition: opacity 0.3s ease;
}
.page-title:hover {
    opacity: 0.8;
}
</style>
