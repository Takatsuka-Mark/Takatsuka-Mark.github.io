import * as THREE from 'three';

// Helper: Create Gradient Texture
export function createGlowTexture(colorStr: string, size: number = 64, intensity: number = 1): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + intensity + ')'); // Bright center
    gradient.addColorStop(0.2, colorStr); // Core color
    gradient.addColorStop(0.5, 'rgba(0,0,0,0)'); // Fade out

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Helper to convert hex number to CSS string
export function hexToRgba(hex: number, alpha: number): string {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

// Helper: Soft Uniform Bloom (No bright center)
export function createSoftBloomTexture(colorHex: number, size: number = 128, opacity: number = 0.2): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const center = size / 2;
    const radius = size / 2;

    // Radial gradient: Constant color in middle, fade at edges
    const gradient = ctx.createRadialGradient(center, center, radius * 0.4, center, center, radius);

    const color = hexToRgba(colorHex, opacity);
    const colorFade = hexToRgba(colorHex, 0);

    gradient.addColorStop(0, color);    // Center (flat color)
    gradient.addColorStop(0.6, color);  // Stay flat until 60%
    gradient.addColorStop(1, colorFade); // Fade to transparent

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}
