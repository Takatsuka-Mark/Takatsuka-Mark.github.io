<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps<{
  quaternion: THREE.Quaternion;
  cameraPosition: THREE.Vector3;
}>();

const container = ref<HTMLElement | null>(null);

// Three.js variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let sphere: THREE.LineSegments;
let axesHelper: THREE.AxesHelper;
let animationId: number;

function initThree() {
  if (!container.value) return;

  // Scene
  scene = new THREE.Scene();
  // Transparent background
  
  // Camera
  // We want a fixed camera looking at the center
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.z = 5;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.value.appendChild(renderer.domElement);

  // Wireframe Sphere
  // Use Icosahedron for a nice triangulated look, or SphereGeometry with WireframeGeometry
  const geometry = new THREE.SphereGeometry(1.5, 16, 16);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ 
      color: 0x40c9ff,
      transparent: true,
      opacity: 0.3
  });
  sphere = new THREE.LineSegments(wireframe, material);
  scene.add(sphere);

  // Axes Helper
  // Disable depth test so they are always visible? Maybe.
  axesHelper = new THREE.AxesHelper(2);
  // Custom colors if needed, but default RGB is fine for XYZ
  // Modify material to be transparent/thinner if possible
  const axesMat = (axesHelper.material as THREE.LineBasicMaterial);
  axesMat.transparent = true; 
  axesMat.opacity = 0.6;
  
  scene.add(axesHelper);

  // Add Axis Labels
  const createLabel = (text: string, color: string, position: THREE.Vector3) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(0.5, 0.5, 1);
    scene.add(sprite);
    return sprite;
  };

  createLabel('X', '#ff4444', new THREE.Vector3(1.8, 0, 0));
  createLabel('Y', '#44ff44', new THREE.Vector3(0, 1.8, 0));
  createLabel('Z', '#4444ff', new THREE.Vector3(0, 0, 1.8));

  // Animation Loop

  animate();

  // Resize Observer to handle container resizing
  const resizeObserver = new ResizeObserver(() => {
    onResize();
  });
  resizeObserver.observe(container.value);
}

function onResize() {
  if (!container.value || !camera || !renderer) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (props.quaternion && props.cameraPosition) {
      // Sync rotation and position
      camera.quaternion.copy(props.quaternion);
      camera.position.copy(props.cameraPosition);
      camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}


onMounted(() => {
  initThree();
});

onUnmounted(() => {
    if (renderer) renderer.dispose();
    if (animationId) cancelAnimationFrame(animationId);
});

// Watch for changes in prop to trigger re-render if not using loop? 
// The loop handles it.
</script>

<template>
  <div ref="container" class="orbit-gizmo-container"></div>
</template>

<style scoped>
.orbit-gizmo-container {
  width: 100%;
  height: 100%;
  /* Pointer events handled by parent */
}
</style>
