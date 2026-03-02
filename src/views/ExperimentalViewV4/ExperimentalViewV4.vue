<template>
  <div class="experimental-v4-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number;

onMounted(() => {
  if (!canvasRef.value) return;

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Black background

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    75,
    canvasRef.value.clientWidth / canvasRef.value.clientHeight,
    0.1,
    1000
  );
  // Position camera so it looks at the center from somewhat above and away
  camera.position.set(0, 5.77, 10);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  });
  renderer.setSize(canvasRef.value.clientWidth, canvasRef.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- Background Stars ---
  const starsCount = 5000;
  const starsGeometry = new THREE.BufferGeometry();
  const starsPositions = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount; i++) {
    // Generate random positions in a large sphere, pushing them away from center
    const radius = 50 + Math.random() * 200; // between 50 and 250
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    starsPositions[i * 3] = x;
    starsPositions[i * 3 + 1] = y;
    starsPositions[i * 3 + 2] = z;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // --- Spiral Galaxy ---
  const galaxyParameters = {
    count: 20000,
    size: 0.05,
    radius: 7,
    coreRadius: 1.5,
    coreDensity: 0.2, // 20% of particles are in the dense core
    branches: 3,
    spin: 1,
    randomness: 0.4,
    randomnessPower: 3,
    insideColor: '#ff6030',
    outsideColor: '#1b3984',
  };

  const galaxyGeometry = new THREE.BufferGeometry();
  const galaxyPositions = new Float32Array(galaxyParameters.count * 3);
  const galaxyColors = new Float32Array(galaxyParameters.count * 3);

  const colorInside = new THREE.Color(galaxyParameters.insideColor);
  const colorOutside = new THREE.Color(galaxyParameters.outsideColor);

  for (let i = 0; i < galaxyParameters.count; i++) {
    const i3 = i * 3;

    const inCore = i < galaxyParameters.count * galaxyParameters.coreDensity;
    let x, y, z;
    let pointRadiusForColor;

    if (inCore) {
      // Core points
      const r = Math.pow(Math.random(), 0.5) * galaxyParameters.coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi) * 0.5; // flatten slightly
      z = r * Math.sin(phi) * Math.sin(theta);
      pointRadiusForColor = r * 0.5;
    } else {
      // Arm points
      const rRand = Math.random();
      const radius = galaxyParameters.coreRadius + rRand * (galaxyParameters.radius - galaxyParameters.coreRadius);
      const spinAngle = radius * galaxyParameters.spin;
      const branchAngle = ((i % galaxyParameters.branches) / galaxyParameters.branches) * Math.PI * 2;
      
      const spread = galaxyParameters.randomness * (radius / galaxyParameters.radius);

      const randomX = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spread * radius;
      const randomY = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spread * radius;
      const randomZ = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spread * radius;

      x = Math.cos(branchAngle + spinAngle) * radius + randomX;
      y = randomY; // Flattened disc shape
      z = Math.sin(branchAngle + spinAngle) * radius + randomZ;
      pointRadiusForColor = radius;
    }

    galaxyPositions[i3] = x;
    galaxyPositions[i3 + 1] = y;
    galaxyPositions[i3 + 2] = z;

    // Color
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, pointRadiusForColor / galaxyParameters.radius);

    galaxyColors[i3] = mixedColor.r;
    galaxyColors[i3 + 1] = mixedColor.g;
    galaxyColors[i3 + 2] = mixedColor.b;
  }

  galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
  galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

  const galaxyMaterial = new THREE.PointsMaterial({
    size: galaxyParameters.size,
    sizeAttenuation: true,
    depthWrite: false, // Prevents points from hiding each other incorrectly
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
  scene.add(galaxy);

  // Resize handler
  const handleResize = () => {
    if (!canvasRef.value) return;
    const width = canvasRef.value.clientWidth;
    const height = canvasRef.value.clientHeight;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
  window.addEventListener('resize', handleResize);
  
  // Explicitly call handleResize once to ensure correct initial size if parent container is not yet fully measured by CSS
  setTimeout(handleResize, 0); 

  // Animation Loop
  const clock = new THREE.Clock();

  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Rotate the galaxy slowly
    galaxy.rotation.y = elapsedTime * 0.1;

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    animationFrameId = window.requestAnimationFrame(tick);
  };

  tick();

  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.cancelAnimationFrame(animationFrameId);

    // Dispose geometries and materials for performance
    starsGeometry.dispose();
    starsMaterial.dispose();
    galaxyGeometry.dispose();
    galaxyMaterial.dispose();
    
    renderer.dispose();
  });
});
</script>

<style scoped>
.experimental-v4-container {
  /* Using fixed positioning to ensure it fills the viewport exactly as a background */
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #000;
}

canvas {
  width: 100%;
  height: 100%;
  display: block; /* Removes bottom margin on canvas element */
}
</style>
