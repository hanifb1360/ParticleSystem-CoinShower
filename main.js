// ----- Start of the assigment ----- //

class ParticleSystem extends PIXI.Container {
  constructor() {
    super();
    // Set start and duration for this effect in milliseconds
    this.start = 0;
    this.spawnDuration = 1500; // Duration over which new particles are spawned
    this.particleLifespan = 2500; // Lifespan of each individual particle in ms
    // The total duration of this effect, for the Game class,
    // is when all particles have been spawned and the last one has completed its lifespan.

	// The duration was updated to represent when all particles have completed 
	// their lifespans, matching the new effect logic, while still respecting 
	// the start (0) and end (total duration) points for the effect.
    this.duration = this.spawnDuration + this.particleLifespan;

    const numParticles = 30; // Number of coin particles
    // Calculate interval between particle spawns to spread them over spawnDuration
    this.spawnInterval = this.spawnDuration / numParticles;

    this.particles = [];
    const centerX = 400; // Center X of the 800x450 canvas
    const centerY = 225; // Center Y of the 800x450 canvas

    for (let i = 0; i < numParticles; i++) {
      // Start with the first frame of the coin animation, it will be updated in animTick
      let sp = game.sprite("CoinsGold000");
      // Set pivot to center of said sprite
      sp.pivot.x = sp.width / 2;
      sp.pivot.y = sp.height / 2;

      // Store pre-calculated random animation properties for each particle
      // These will be used when the particle is alive.
      sp.config_vx = (Math.random() - 0.5) * 1600; // Horizontal velocity component for spread
      sp.config_vy = -(Math.random() * 400 + 600); // Initial upward velocity component (negative for up)
      sp.config_gravityFactor = (500 + Math.random() * 200) * 6; // Gravity effect component, positive for down
      sp.config_initialScale = 0.2 + Math.random() * 0.1; // Random base scale
      sp.config_baseRotation = Math.random() * Math.PI * 2; // Random initial physical rotation
      sp.config_rotationSpeed = (Math.random() - 0.5) * Math.PI * 16; // Physical rotation speed (radians per 'particle_nt')

      // Particle state
      sp.isActive = false; // Becomes true when spawned
      sp.visible = false; // Start invisible until spawned
      sp.birthTime = 0; // Will be set to the effect's local time (lt) when spawned

      // Set initial position (will be re-applied at actual spawn time)
      sp.x = centerX;
      sp.y = centerY;

      this.addChild(sp); // Add the sprite particle to this container
      this.particles.push(sp); // Save a reference to the particle
    }
  }

  animTick(nt, lt, gt) {
    // Every update we get three different time variables: nt, lt and gt.
    //   nt: Normalized time for the WHOLE EFFECT (0.0 to 1.0), calculated by (lt / this.duration).
    //   lt: Local time for the WHOLE EFFECT (milliseconds), from 0 to this.duration.
    //   gt: Global time in milliseconds.
    // Individual particles will now use their own normalized time 'particle_nt'.

    const centerX = 400;
    const centerY = 225;

    for (let i = 0; i < this.particles.length; i++) {
      let sp = this.particles[i];
      let scheduledBirthTime = i * this.spawnInterval; // Time when this particle is supposed to spawn

      // Spawn particle if it's its time and it's not already active
      if (!sp.isActive && lt >= scheduledBirthTime) {
        sp.isActive = true;
        sp.visible = true;
        sp.birthTime = scheduledBirthTime; // Record its birth time based on the schedule

        // Initialize position at actual spawn
        sp.x = centerX;
        sp.y = centerY;
        // Other properties like alpha, scale, rotation will be set based on its age.
      }

      if (!sp.isActive) {
        continue; // Skip if not yet spawned or already died
      }

      let particleAge = lt - sp.birthTime;

      // If effect time 'lt' has looped, particleAge might become negative.
      // This can happen if totalDuration of the game is greater than this.duration + this.particleLifespan
      // and the effect is set to loop. For this assignment, we assume a single play-through or
      // that particles simply restart if lt loops.

      if (particleAge > this.particleLifespan) {
        sp.isActive = false; // Particle has lived its full life
        sp.visible = false;
        continue;
      }

      // Calculate particle's own normalized lifetime (0.0 to 1.0)
      let particle_nt = particleAge / this.particleLifespan;
      // Clamp particle_nt to [0, 1] range
      particle_nt = Math.max(0, Math.min(1, particle_nt));

      // 1. Texture Animation (Spinning Coin Effect) based on particle_nt
      // Uses all 9 coin images (CoinsGold000 to CoinsGold008)
      const numFramesForSpin = 9;
      const spinCycles = 10; // How many times the coin texture animates (spins) during its lifetime (increased)
      let currentFrameIndex =
        Math.floor(particle_nt * numFramesForSpin * spinCycles) %
        numFramesForSpin;
      let textureNumStr = ("000" + currentFrameIndex).substr(-3);
      game.setTexture(sp, "CoinsGold" + textureNumStr);

      // 2. Position Animation (Coin Shower) based on particle_nt
      // Coins start at center, spread out, and fall downwards with gravity.
      // particle_nt is used as the time variable in kinematic equations.
      sp.x = centerX + sp.config_vx * particle_nt;
      sp.y =
        centerY +
        sp.config_vy * particle_nt +
        0.5 * sp.config_gravityFactor * particle_nt * particle_nt;

      // 3. Scale Animation based on particle_nt
      // Particles quickly scale up to their initialScale.
      sp.scale.x = sp.scale.y =
        sp.config_initialScale * Math.min(1, particle_nt * 16); // Ramps up in first ~6% of its life (factor increased)

      // 4. Alpha Animation (Fade in, then fade out smoothly over the particle's lifetime) based on particle_nt
      sp.alpha = Math.sin(particle_nt * Math.PI);

      // 5. Physical Rotation Animation (Individual rotation of the sprite itself) based on particle_nt
      sp.rotation =
        sp.config_baseRotation + sp.config_rotationSpeed * particle_nt;
    }
  }
}

// ----- End of the assigment ----- //

class Game {
  constructor(props) {
    this.totalDuration = 0;
    this.effects = [];
    this.renderer = new PIXI.WebGLRenderer(800, 450);
    document.body.appendChild(this.renderer.view);
    this.stage = new PIXI.Container();
    this.loadAssets(props && props.onload);
  }
  loadAssets(cb) {
    let textureNames = [];
    // Load coin assets
    for (let i = 0; i <= 8; i++) {
      let num = ("000" + i).substr(-3);
      let name = "CoinsGold" + num;
      let url = "gfx/CoinsGold/" + num + ".png";
      textureNames.push(name);
      PIXI.loader.add(name, url);
    }
    PIXI.loader.load(
      function (loader, res) {
        // Access assets by name, not url
        let keys = Object.keys(res);
        for (let i = 0; i < keys.length; i++) {
          var texture = res[keys[i]].texture;
          if (!texture) continue;
          PIXI.utils.TextureCache[keys[i]] = texture;
        }
        // Assets are loaded and ready!
        this.start();
        cb && cb();
      }.bind(this)
    );
  }
  start() {
    this.isRunning = true;
    this.t0 = Date.now();
    update.bind(this)();
    function update() {
      if (!this.isRunning) return;
      this.tick();
      this.render();
      requestAnimationFrame(update.bind(this));
    }
  }
  addEffect(eff) {
    this.totalDuration = Math.max(
      this.totalDuration,
      (eff.duration + eff.start) || 0 // Ensure duration is at least 0
    );
    this.effects.push(eff);
    this.stage.addChild(eff);
  }
  render() {
    this.renderer.render(this.stage);
  }
  tick() {
    let gt = Date.now();
    let lt = (gt - this.t0) % this.totalDuration;
    for (let i = 0; i < this.effects.length; i++) {
      let eff = this.effects[i];
      if (lt > eff.start + eff.duration || lt < eff.start) continue;
      let elt = lt - eff.start;
      let ent = elt / eff.duration;
      eff.animTick(ent, elt, gt);
    }
  }
  sprite(name) {
    return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
  }
  setTexture(sp, name) {
    sp.texture = PIXI.utils.TextureCache[name];
    if (!sp.texture) console.warn("Texture '" + name + "' doesn't exist!");
  }
}

window.onload = function () {
  window.game = new Game({
    onload: function () {
      game.addEffect(new ParticleSystem());
    },
  });
};
