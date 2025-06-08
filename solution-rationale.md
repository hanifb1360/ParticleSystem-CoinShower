## Coin Shower Effect: Solution Rationale

In my modified version, I implemented a coin shower effect by spawning multiple particles over time. Here are the key changes and reasoning:

- **Spawn Duration:** Coins are spawned over **1000ms** (`this.spawnDuration = 1000`).
- **Particle Lifespan:** Each coin lives for **2000ms** (`this.particleLifespan = 2000`).
- **Total Effect Duration:** The effect lasts **3000ms** (`1000 + 2000`).

> This ensures that the last coin spawned has its full lifespan to animate.  
> If the duration were only 500ms, most coins wouldn’t appear or finish animating.

### Why Use Normalized Time (`nt`) Instead of Local Time (`lt`)?

- **Time-Scale Invariance:** Animations behave consistently, regardless of duration.
- **Simplified Math:** Interpolation for properties like position, scale, alpha, and texture frame is easier.
- **Smooth Animation:** All particles animate smoothly across their lifespans, no matter when they spawn.

#### Individual Particle Normalized Time (`particle_nt`)
Each particle calculates its own normalized time (`particle_nt = particleAge / particleLifespan`). This `particle_nt` (ranging from 0.0 at its birth to 1.0 at the end of its life) is then used to drive all its individual animations (texture, position, scale, alpha, rotation). Coins spawn gradually creating a continuous, rich shower instead of a flat, synchronized animation.

