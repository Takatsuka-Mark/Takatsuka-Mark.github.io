import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
import * as THREE from 'three';
import type { Experience } from '../../data/experiences';
import { experiences, education } from '../../data/experiences';
// @ts-ignore
import { forceSimulation, forceManyBody, forceCollide, forceLink, forceX, forceY, forceZ } from 'd3-force-3d';

import { CLUSTER_CONFIG, type ClusterType, getCompanyColor, BG_STAR_COUNT, NODE_RADIUS } from './ExperimentalViewConfig';
import { createSoftBloomTexture } from './ExperimentalViewHelpers';

export function useExperimentalView() {
    const container = ref<HTMLElement | null>(null);

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

    // Orbit Control State
    const orbitState = ref({
        theta: Math.PI / 4, // Horizontal angle
        phi: Math.PI / 3,   // Vertical angle (from top)
        radius: 100         // Distance from target
    });

    const instructionMinimized = ref(false);
    const cameraQuaternion = ref(new THREE.Quaternion()); // New: Sync for Gizmo
    const gizmoCameraPos = ref(new THREE.Vector3(0, 0, 5)); // New: Sync for Gizmo


    const interactionState = {
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 }
    };

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
        createClusterHitZones(); // New: Hit zones
        createTimeline();

        // Start loop
        animate();

        window.addEventListener('resize', onWindowResize);
        window.addEventListener('click', onClick);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // Touch events
        window.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onMouseUp);
    }

    // Phase 5: Overlay State
    const selectedExperience = ref<Experience | null>(null);
    const overlayPos = ref({ x: 0, y: 0 });
    const showIntro = ref(true);
    const isBackgroundMoving = ref(true);
    const isTimelineView = ref(false);
    let timelineGroup: THREE.Group;

    // Navigation State
    const activeCluster = ref<ClusterType | null>(null);

    function navigateToCluster(clusterId: ClusterType | null) {
        activeCluster.value = clusterId;
        if (clusterId === null) {
            selectedExperience.value = null; // Clear selection on zoom out
            selectedStar = null;
        }
    }

    // Helper to select a node by ID (for labels)
    function selectNode(id: number) {
        // Find the mesh corresponding to this ID
        const mesh = foregroundGroup.children.find(c => c instanceof THREE.Mesh && c.userData.id === id);
        if (mesh) {
            selectedStar = mesh;
            // @ts-ignore
            selectedExperience.value = mesh.userData;
        }
    }

    function getClusterLabel(clusterId: ClusterType): string {
        return CLUSTER_CONFIG[clusterId]?.label || '';
    }

    // Cluster Labels
    interface ClusterLabel {
        id: ClusterType;
        text: string;
        x: number;
        y: number;
        visible: boolean;
        scale: number;
    }
    const clusterLabels = ref<ClusterLabel[]>([]);

    // Watch mode switch
    watch(isTimelineView, (newVal) => {
        if (newVal) {
            if (simulation) simulation.stop();
            if (timelineGroup) timelineGroup.visible = true;
            const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
            if (lineLayer) lineLayer.visible = false;
            navigateToCluster('experience');
        } else {
            nodes.forEach(node => {
                node.vx = (Math.random() - 0.5) * 5;
                node.vy = (Math.random() - 0.5) * 5;
                node.vz = (Math.random() - 0.5) * 5;
            });
            if (simulation) simulation.alpha(1).restart();
            if (timelineGroup) timelineGroup.visible = false;
            const lineLayer = foregroundGroup.children.find(c => c.userData.isLineLayer) as THREE.LineSegments;
            if (lineLayer) lineLayer.visible = true;
            navigateToCluster(null);
        }
    });

    // Hit Zones & Visual Bloom
    let hitZoneGroup: THREE.Group;

    function createClusterHitZones() {
        hitZoneGroup = new THREE.Group();
        scene.add(hitZoneGroup);

        (Object.keys(CLUSTER_CONFIG) as ClusterType[]).forEach(type => {
            const config = CLUSTER_CONFIG[type];

            const radius = type === 'experience' ? 60 : 45;

            // 1. Invisible Hit Sphere (Physics/Raycast)
            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0,
                side: THREE.BackSide
            });
            material.depthWrite = false;

            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(config.position);
            // @ts-ignore
            sphere.userData = { isHitZone: true, cluster: type };

            hitZoneGroup.add(sphere);

            // 2. Visible Bloom Sprite
            const bloomTexture = createSoftBloomTexture(config.color, 128, 0.15);
            const bloomMaterial = new THREE.SpriteMaterial({
                map: bloomTexture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const bloomSprite = new THREE.Sprite(bloomMaterial);
            bloomSprite.position.copy(config.position);

            const scale = radius * 1.5;
            bloomSprite.scale.set(scale, scale, 1);

            // IMPORTANT: Ensure the sprite also has userData so it can be clicked
            // @ts-ignore
            bloomSprite.userData = { isHitZone: true, cluster: type };

            hitZoneGroup.add(bloomSprite);
        });
    }

    // Interaction Variables
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const targetFocus = new THREE.Vector3(0, 0, 0); // Where the camera looks AT
    const currentFocus = new THREE.Vector3(0, 0, 0); // Smoothed focus point
    // targetRadius is now separate from orbitState.radius to allow smooth zooming
    const targetRadius = ref(100);

    let selectedStar: THREE.Object3D | null = null;
    const tempVec = new THREE.Vector3();

    // --- Orbit Controls ---

    function onMouseDown(event: MouseEvent) {
        if (isTimelineView.value) return;
        interactionState.isDragging = true;
        interactionState.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
        instructionMinimized.value = true;
    }

    function onMouseMove(event: MouseEvent) {
        if (!interactionState.isDragging || isTimelineView.value) return;

        const deltaMove = {
            x: event.clientX - interactionState.previousMousePosition.x,
            y: event.clientY - interactionState.previousMousePosition.y
        };

        const rotateSpeed = 0.005;

        // Rotation disabled for now per user request
        // orbitState.value.theta -= deltaMove.x * rotateSpeed;
        // orbitState.value.phi -= deltaMove.y * rotateSpeed;

        // Clamp phi to avoid gimbal lock or going under the floor too much
        // orbitState.value.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.value.phi));

        interactionState.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    function onMouseUp() {
        interactionState.isDragging = false;
    }

    function onTouchStart(event: TouchEvent) {
        if (isTimelineView.value || event.touches.length !== 1) return;
        interactionState.isDragging = true;
        interactionState.previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        instructionMinimized.value = true;
    }

    function onTouchMove(event: TouchEvent) {
        if (!interactionState.isDragging || isTimelineView.value || event.touches.length !== 1) return;
        // event.preventDefault(); // Create passive error if not careful, handled in listener options

        const deltaMove = {
            x: event.touches[0].clientX - interactionState.previousMousePosition.x,
            y: event.touches[0].clientY - interactionState.previousMousePosition.y
        };

        const rotateSpeed = 0.005;

        // Rotation disabled for now per user request
        // orbitState.value.theta -= deltaMove.x * rotateSpeed;
        // orbitState.value.phi -= deltaMove.y * rotateSpeed;

        // orbitState.value.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.value.phi));

        interactionState.previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }

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
            const shouldShow = activeCluster.value !== null && node.cluster === activeCluster.value;

            if (!shouldShow) {
                if (nodeLabels.value[i]) nodeLabels.value[i].visible = false;
                return;
            }

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
                    label.y = y - 30;
                    label.visible = true;
                }
            } else {
                if (nodeLabels.value[i]) nodeLabels.value[i].visible = false;
            }
        });

        // Update Cluster Labels
        clusterLabels.value = (Object.keys(CLUSTER_CONFIG) as ClusterType[]).map(type => {
            const config = CLUSTER_CONFIG[type];

            // Determine Position: Config (Default)
            tempVec.copy(config.position);



            tempVec.project(camera);
            const isVisible = tempVec.z < 1 && tempVec.z > -1;

            if (isVisible) {
                const x = (tempVec.x * .5 + .5) * width;
                const y = (-(tempVec.y * .5) + .5) * height;

                // Scale label based on distance/context?
                let scale = Math.max(0.5, 1 - (tempVec.z * 0.5));


                return { id: type, text: config.label, x, y, visible: true, scale };
            } else {
                return { id: type, text: config.label, x: 0, y: 0, visible: false, scale: 1 };
            }
        });

        // Update Timeline Labels
        if (isTimelineView.value) {
            timelineLabels.value.forEach(label => {
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

        // If we were dragging, don't register as a click
        if (interactionState.isDragging) return;

        instructionMinimized.value = true;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 1. Check Stars (Foreground) - Highest Priority
        // Recursive = true to catch child hitboxes
        const intersects = raycaster.intersectObjects(foregroundGroup.children, true);

        if (intersects.length > 0) {
            // Traverse up to find the main mesh if we hit a child (halo/hitbox)
            let clickedObject = intersects[0].object;
            while (clickedObject.parent && clickedObject.parent !== foregroundGroup) {
                clickedObject = clickedObject.parent;
            }

            const clickedStar = clickedObject;
            // @ts-ignore
            const clickedData = clickedStar.userData;

            // Ensure it's actually a node
            if (!clickedData || clickedData.id === undefined) return;

            if (activeCluster.value === null || activeCluster.value !== clickedData.cluster) {
                navigateToCluster(clickedData.cluster);
            } else {
                selectedStar = clickedStar;
                // @ts-ignore
                selectedExperience.value = clickedData;
            }
        } else {
            // 2. Check Hit Zones (Background Areas)
            // Also check the Bloom Sprites, as they are large and might be what the user is trying to click
            const hitZones = hitZoneGroup.children;
            const zoneIntersects = raycaster.intersectObjects(hitZones);

            if (zoneIntersects.length > 0) {
                const hit = zoneIntersects[0].object;
                // @ts-ignore
                const targetCluster = hit.userData.cluster;

                if (activeCluster.value !== targetCluster) {
                    navigateToCluster(targetCluster);
                } else {
                    selectedExperience.value = null;
                    selectedStar = null;
                }
            } else {
                if (activeCluster.value !== null) {
                    navigateToCluster(null);
                } else {
                    selectedExperience.value = null;
                    selectedStar = null;
                }
            }
        }
    }

    function createBackground() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        // Spherical Shell Distribution
        // Min Radius: 250 (Closer to content for more parallax, but still behind)
        // Max Radius: 1000 (Deep background)
        const minRadius = 250;
        const maxRadius = 1000;

        for (let i = 0; i < BG_STAR_COUNT; i++) {
            // Random point on sphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            // Random radius within shell
            const radius = minRadius + Math.random() * (maxRadius - minRadius);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            vertices.push(x, y, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2.0, // Increased from 1.0 (User requested larger)
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
                links.push({ source: clusterNodes[i].id, target: clusterNodes[i + 1].id });
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
            .force('x', forceX((d: any) => CLUSTER_CONFIG[d.cluster as ClusterType]?.position.x || 0).strength(0.1))
            .force('y', forceY((d: any) => CLUSTER_CONFIG[d.cluster as ClusterType]?.position.y || 0).strength(0.1))
            .force('z', forceZ((d: any) => CLUSTER_CONFIG[d.cluster as ClusterType]?.position.z || 0).strength(0.1));

        // Create Meshes
        nodes.forEach((node) => {
            const geometry = new THREE.SphereGeometry(2.25, 16, 16); // Increased from 1.5 (+50%)
            // @ts-ignore
            const color = CLUSTER_CONFIG[node.cluster].color;

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



            // NEW: Add Invisible Hitbox
            const hitGeo = new THREE.SphereGeometry(9, 8, 8); // Increased from 6 (+50%)
            const hitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.BackSide });
            const hitBox = new THREE.Mesh(hitGeo, hitMat);
            // @ts-ignore
            hitBox.userData = { isHitBox: true };
            star.add(hitBox);

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
            // TIMELINE VIEW - Classic Panning Logic
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

            // Simple Lerp for Timeline (no orbit)
            const currentCamPos = camera.position;
            const desiredCamPos = new THREE.Vector3(targetPos.x, targetPos.y, maxZreq);

            const alpha = 0.05;
            currentCamPos.lerp(desiredCamPos, alpha);
            currentFocus.lerp(targetPos, alpha);
            camera.lookAt(currentFocus);

        } else {
            // GRAPH VIEW - Orbit Logic
            if (activeCluster.value) {
                // Focus on active cluster center
                const clusterPos = CLUSTER_CONFIG[activeCluster.value].position;
                targetPos.copy(clusterPos);

                if (selectedStar) {
                    // If a star is selected, maybe we want to zoom in closer?
                    // For now, keep rotation around cluster center but maybe reduce radius?
                    // Or rotate around the star itself? 
                    // User said: "rotate the camera around the center point of the cluster that is currently in view"
                    targetRadius.value = 80;
                } else {
                    targetRadius.value = 120;
                }

            } else {
                // Overview: Rotate around center
                targetPos.set(0, 0, 0);
                targetRadius.value = 250;
            }

            const alpha = 0.05;

            // 1. Smoothly interpolate the LookAt point
            currentFocus.lerp(targetPos, alpha);

            // 2. Smoothly interpolate the Radius
            orbitState.value.radius += (targetRadius.value - orbitState.value.radius) * alpha;

            // 3. Calculate Camera Position from Orbit State (Spherical -> Cartesian)
            // x = r * sin(phi) * cos(theta)
            // y = r * cos(phi)
            // z = r * sin(phi) * sin(theta)
            // adjusted for Three.js coordinate system where Y is up

            const r = orbitState.value.radius;
            const t = orbitState.value.theta;
            const p = orbitState.value.phi;

            const x = currentFocus.x + r * Math.sin(p) * Math.sin(t);
            const y = currentFocus.y + r * Math.cos(p);
            const z = currentFocus.z + r * Math.sin(p) * Math.cos(t);

            camera.position.set(x, y, z);
            camera.lookAt(currentFocus);

            // --- HUD Logic REMOVED per user request ---
            // Ensure all clusters stay at config positions even if activeCluster is set
            (Object.keys(CLUSTER_CONFIG) as ClusterType[]).forEach(clusterId => {
                const config = CLUSTER_CONFIG[clusterId];
                const hitZone = hitZoneGroup.children.find(c => c.userData.cluster === clusterId && c instanceof THREE.Mesh);
                const bloom = hitZoneGroup.children.find(c => c.userData.cluster === clusterId && c instanceof THREE.Sprite);

                if (hitZone) hitZone.position.lerp(config.position, 0.05);
                if (bloom) {
                    bloom.position.lerp(config.position, 0.05);
                    const radius = clusterId === 'experience' ? 60 : 45;
                    const scale = radius * 1.5;
                    bloom.scale.lerp(new THREE.Vector3(scale, scale, 1), 0.05);
                }
            });
        }

        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();

        updateNodeLabels();
        if (selectedStar) updateOverlayPosition();

        // Sync Quaternion for Gizmo
        cameraQuaternion.value.copy(camera.quaternion);
        // Sync Position for Gizmo (Relative Direction)
        gizmoCameraPos.value.copy(camera.position).sub(currentFocus).normalize().multiplyScalar(5);

        renderer.render(scene, camera);


    }

    onMounted(() => {
        initThree();

        setTimeout(() => {
            showIntro.value = false;
        }, 2000);

        return () => {
            // Cleanup listeners if needed
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('click', onClick);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    });

    onUnmounted(() => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onWindowResize);

        // Remove other listeners
        window.removeEventListener('click', onClick);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onMouseUp); // Using same handler

        if (simulation) simulation.stop();

        if (renderer) {
            renderer.dispose();
            if (renderer.domElement && container.value) {
                container.value.removeChild(renderer.domElement);
            }
        }
    });

    return {
        container,
        activeCluster,
        navigateToCluster,
        isBackgroundMoving,
        isTimelineView,
        clusterLabels,
        nodeLabels,
        timelineLabels,
        showIntro,
        selectedExperience,
        overlayPos,
        selectNode,
        getClusterLabel,
        instructionMinimized, // Exported
        cameraQuaternion, // Exported
        gizmoCameraPos // Exported
    };


}
