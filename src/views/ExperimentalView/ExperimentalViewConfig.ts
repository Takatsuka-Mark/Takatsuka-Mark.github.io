import * as THREE from 'three';

// --- Types ---
export type ClusterType = 'experience' | 'education' | 'project' | 'contact';

export interface ClusterConfig {
    id: ClusterType;
    label: string;
    position: THREE.Vector3; // center of the cluster in 3D space
    color: number;
}

// --- Configuration ---
// Layout: Experience (Main) at 0,0,0
// Others in the "background" (Top Right / Top Left / etc)
export const CLUSTER_CONFIG: Record<ClusterType, ClusterConfig> = {
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

export const BG_STAR_COUNT = 15000;
export const NODE_RADIUS = 30;

// --- Colors ---
export const COLOR_PALETTE = [
    0x40c9ff, // Cyan
    0xff5555, // Red
    0x55ff55, // Green
    0xffaa00, // Orange
    0xaa55ff, // Purple
    0xff55aa  // Pink
];

// --- Helpers ---
function checksum(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

export function getCompanyColor(company: string): number {
    const idx = Math.abs(checksum(company)) % COLOR_PALETTE.length;
    return COLOR_PALETTE[idx] || 0xffffff;
}
