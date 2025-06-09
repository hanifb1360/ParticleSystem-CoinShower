// ----- Start of the assigment ----- //

const CANVAS_WIDTH = 800; // Based on Game class renderer
const CANVAS_HEIGHT = 450; // Based on Game class renderer
const DEFAULT_CENTER_X = CANVAS_WIDTH / 2;
const DEFAULT_CENTER_Y = CANVAS_HEIGHT / 2;

const PARTICLE_COUNT = 50; // Total number of particles to spawn in the effect
const MAX_HORIZONTAL_VELOCITY_SPREAD_FACTOR = 1600; // Maximum horizontal velocity spread factor for particles
const MIN_INITIAL_UPWARD_VELOCITY = 600; // Minimum initial upward velocity for particles
const RANDOM_INITIAL_UPWARD_VELOCITY_RANGE = 400; // Range for random initial upward velocity of particles
const BASE_GRAVITY_FACTOR = 500; // Base gravity factor to apply to particles
const RANDOM_GRAVITY_FACTOR_RANGE = 200; // Range for random gravity factor to add variability to the effect
const GRAVITY_MULTIPLIER = 6; // Gravity multiplier to adjust the effect's gravity strength
const BASE_INITIAL_SCALE = 0.2; // Base scale for particles
const RANDOM_INITIAL_SCALE_RANGE = 0.1; // Range for random initial scale of particles
const MAX_ROTATION_SPEED_FACTOR = Math.PI * 16; // 16 full rotations per particle lifetime

const NUM_COIN_FRAMES = 9; // Number of frames in the coin animation (CoinsGold000 to CoinsGold008)
const COIN_SPIN_CYCLES = 10; // Number of full spin cycles for the coin animation during its lifetime
const SCALE_RAMP_UP_FACTOR = 16; // Scale up factor for particles, so they reach full size in ~6% of their lifetime

class ParticleSystem extends PIXI.Container { 
  constructor() {
    super(); 

    // Set start and duration for this effect in milliseconds
    this.start = 0;
    this.spawnDuration = 1000; // Duration over which new particles are spawned
    this.particleLifespan = 2000; // Lifespan of each individual particle in ms
    // The total duration of this effect, for the Game class,
    // is when all particles have been spawned and the last one has completed its lifespan.

    // The duration was updated to represent when all particles have completed
    // their lifespans, matching the new effect logic, while still respecting
    // the start (0) and end (total duration) points for the effect.
    this.duration = this.spawnDuration + this.particleLifespan;

    // Use defined constants for center, store as class properties
    this.centerX = DEFAULT_CENTER_X;
    this.centerY = DEFAULT_CENTER_Y;

    // Calculate interval between particle spawns to spread them over spawnDuration
    this.spawnInterval = this.spawnDuration / PARTICLE_COUNT;


    this.particles = []; // Array to hold all particle sprites

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Start with the first frame of the coin animation, it will be updated in animTick
      let sp = game.sprite("CoinsGold000");
      // Set pivot to center of said sprite
      sp.pivot.x = sp.width / 2;
      sp.pivot.y = sp.height / 2;

      // Store pre-calculated random animation properties for each particle
      // These will be used when the particle is alive.
      sp.config_vx = (Math.random() - 0.5) * MAX_HORIZONTAL_VELOCITY_SPREAD_FACTOR;
      sp.config_vy = -(Math.random() * RANDOM_INITIAL_UPWARD_VELOCITY_RANGE + MIN_INITIAL_UPWARD_VELOCITY);
      sp.config_gravityFactor = (BASE_GRAVITY_FACTOR + Math.random() * RANDOM_GRAVITY_FACTOR_RANGE) * GRAVITY_MULTIPLIER;
      sp.config_initialScale = BASE_INITIAL_SCALE + Math.random() * RANDOM_INITIAL_SCALE_RANGE;
      sp.config_baseRotation = Math.random() * Math.PI * 2; // Random initial physical rotation
      sp.config_rotationSpeed = (Math.random() - 0.5) * MAX_ROTATION_SPEED_FACTOR; // Physical rotation speed (radians per 'particle_nt')

      // Particle state
      sp.isActive = false; // Becomes true when spawned
      sp.visible = false; // Start invisible until spawned
      sp.birthTime = 0; // Will be set to the effect's local time (lt) when spawned

      // Set initial position (will be re-applied at actual spawn time)
      sp.x = this.centerX;
      sp.y = this.centerY;

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

    // centerX and centerY are now this.centerX and this.centerY

    for (let i = 0; i < this.particles.length; i++) {
      let sp = this.particles[i];
      let scheduledBirthTime = i * this.spawnInterval; // Time when this particle is supposed to spawn

      // Spawn particle if it's its time and it's not already active
      if (!sp.isActive && lt >= scheduledBirthTime) {
        sp.isActive = true;
        sp.visible = true;
        sp.birthTime = scheduledBirthTime; // Record its birth time based on the schedule

        // Initialize position at actual spawn using class properties
        sp.x = this.centerX;
        sp.y = this.centerY;
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
      // Uses all coin images (CoinsGold000 to CoinsGold008)
      let currentFrameIndex =
        Math.floor(particle_nt * NUM_COIN_FRAMES * COIN_SPIN_CYCLES) %
        NUM_COIN_FRAMES;
      let textureNumStr = ("000" + currentFrameIndex).substr(-3);
      game.setTexture(sp, "CoinsGold" + textureNumStr);

      // 2. Position Animation (Coin Shower) based on particle_nt
      // Coins start at center, spread out, and fall downwards with gravity.
      // particle_nt is used as the time variable in kinematic equations.
      // Use class properties for centerX and centerY
      sp.x = this.centerX + sp.config_vx * particle_nt;
      sp.y =
        this.centerY +
        sp.config_vy * particle_nt +
        0.5 * sp.config_gravityFactor * particle_nt * particle_nt;

      // 3. Scale Animation based on particle_nt
      // Particles quickly scale up to their initialScale.
      sp.scale.x = sp.scale.y =
        sp.config_initialScale * Math.min(1, particle_nt * SCALE_RAMP_UP_FACTOR); // Ramps up in first ~6% of its life

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
      (eff.duration + eff.start) || 0
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
