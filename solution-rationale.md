## Coin Shower Effect: Solution Rationale

In my modified version, I implemented a coin shower effect by spawning multiple particles over time. Here are the key changes and reasoning:

- **Spawn Duration:** Coins are spawned over **1000ms** (`this.spawnDuration = 1000`).
- **Particle Lifespan:** Each coin lives for **2000ms** (`this.particleLifespan = 2000`).
- **Total Effect Duration:** The effect lasts **3000ms** (`1000 + 2000`).

> This ensures that the last coin spawned has its full lifespan to animate.  
> If the duration were only 500ms, most coins wouldn’t appear or finish animating.


### Role of `lt` (Local Time for the Effect)

The `lt` parameter in `animTick(nt, lt, gt)` is crucial for managing the overall progression of the particle effect and the lifecycle of individual particles. It represents the time elapsed in milliseconds since the `ParticleSystem` effect instance began, ranging from `0` to `this.duration`.

1.  **Driving Particle Spawning**:
    *   `lt` is directly compared against a `scheduledBirthTime` for each particle. This `scheduledBirthTime` is calculated based on the particle's index and the `this.spawnInterval`.
    *   When `lt` reaches or exceeds a particle's `scheduledBirthTime`, that particle is activated (spawned). This allows for a staggered introduction of particles over the `this.spawnDuration`, rather than all at once.

2.  **Calculating Individual Particle Age**:
    *   Once a particle is spawned, its `birthTime` (which is its `scheduledBirthTime` relative to the effect's start) is recorded.
    *   In subsequent ticks, the `particleAge` is determined by `lt - sp.birthTime`. This `particleAge` is the actual time that specific particle has been alive.
    *   This `particleAge` is then used to calculate `particle_nt` (the normalized lifetime for that individual particle), which drives its specific animations (movement, rotation, texture, alpha, scale).

In short, `lt` is the effect's master clock, controlling particle spawning and serving as the basis for each particle's age and animation progression. It's vital for coordinating the staggered spawning and independent lifecycles of multiple particles.