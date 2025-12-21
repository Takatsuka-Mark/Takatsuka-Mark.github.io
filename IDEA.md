# Experimental Space Page Idea

## Concept: "The Cosmos of Experience"
A visually immersive, interactive representation of professional experience (jobs, internships, education) visualized as a star system in deep space.

### Core Philosophy
- **Dynamic & Alive**: The portfolio should feel like a living universe, not a static list.
- **Exploration**: Users "explore" the career path by navigating through 3D space.
- **Premium Aesthetics**: High-end visuals using Three.js, glassmorphism, and smooth animations.

## Requirements

### Visuals
1.  **Environment**: 
    - A deep space background with a static field of distant stars (particles).
    - Subtle rotation of the universe to create a sense of depth and scale.
2.  **Nodes (Stars)**:
    - Each professional experience is represented as a glowing 3D sphere (Star) in the foreground cluster.
    - Nodes are positioned randomly within a bounded volume but form a cohesive cluster.
3.  **Connections**:
    - Subtle lines connecting nearest-neighbor stars to visualize the "network" of skills and roles.
4.  **Intro**:
    - "Experimental V2" large, glowing text centered on screen that pulses and fades out after 2 seconds.

### Interactivity
1.  **Navigation**:
    - **Click-to-Focus**: Clicking a star smoothly animates the camera to focus on it.
    - **Smart Tracking**: The camera tracks the moving star but "clamps" the viewing angle (e.g., 80% of distance) to ensure the rest of the cluster remains visible in the background.
    - **Selection**: Selecting a star triggers a detail view.
2.  **Detail Overlay**:
    - A "glassmorphism" card appears near the selected star (projected from 3D to 2D screen coordinates).
    - Displays: Company, Title, Date, Description (bullet points), and Link.
    - Clicking empty space deselects and hides the card.

### Technical & Layout
1.  **Full Screen**: 
    - The page must occupy `100vw` and `100vh` with **no scrollbars**.
    - Standard site navigation (Header) is hidden or minimized to avoid distraction.
2.  **Performance**:
    - Efficient resource disposal (cleanup Three.js scenes on unmount).
    - Optimized particle counts for smooth frame rates.
3.  **Integration**:
    - **Data-Driven**: Powered by a shared `experiences.ts` data source (Single Source of Truth).
    - **Route**: `/experimental`
    - **Pre-loader Bypass**: The standard site SVG tracing pre-loader is disabled for this route to ensure immediate immersion.

## Future Potential
- **Filter by Skill**: Highlight stars based on tech stack (e.g., "Show Vue.js work").
- **Timeline View**: Arrange stars chronologically along a curve.
- **Physics**: Add subtle mouse-interaction physics (repulsion/attraction).
