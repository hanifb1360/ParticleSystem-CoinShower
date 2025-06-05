// ----- Start of the assigment ----- //

class ParticleSystem extends PIXI.Container {
	constructor() {
		super();
		// Set start and duration for this effect in milliseconds
		this.start    = 0;
		this.duration = 1500; // Duration of the effect in milliseconds
		this.particles = [];
		const numParticles = 30; // Number of coin particles

		const centerX = 400; // Center X of the 800x450 canvas
		const centerY = 225; // Center Y of the 800x450 canvas

		for (let i = 0; i < numParticles; i++) {
			// Start with the first frame of the coin animation, it will be updated in animTick
			let sp = game.sprite("CoinsGold000");
			// Set pivot to center of said sprite
			sp.pivot.x    = sp.width/2;
			sp.pivot.y    = sp.height/2;

			// Initial position at the center of the screen
			sp.x = centerX;
			sp.y = centerY;

			// Store custom properties for each particle's animation
			// Trajectory properties (velocities and gravity are in units per normalized time 'nt')
			sp.vx = (Math.random() - 0.5) * 600; // Horizontal velocity component for spread
			sp.vy = -(Math.random() * 150 + 50);  // Initial upward velocity component (negative for up)
			sp.gravityFactor = 500 + Math.random() * 200; // Gravity effect component, positive for down

			// Appearance and rotation properties
			sp.initialScale = 0.2 + Math.random() * 0.3; // Random base scale (0.2 to 0.5)
			sp.baseRotation = Math.random() * Math.PI * 2; // Random initial physical rotation
			sp.rotationSpeed = (Math.random() - 0.5) * Math.PI * 6; // Physical rotation speed (radians per 'nt')

			this.addChild(sp); // Add the sprite particle to this container
			this.particles.push(sp); // Save a reference to the particle
		}
	}

	animTick(nt,lt,gt) {
		// Every update we get three different time variables: nt, lt and gt.
		//   nt: Normalized time in procentage (0.0 to 1.0) and is calculated by
		//       just dividing local time with duration of this effect.
		//   lt: Local time in milliseconds, from 0 to this.duration.
		//   gt: Global time in milliseconds.

		const centerX = 400; // Re-define for clarity or access via this if set in constructor
		const centerY = 225;

		for (let i = 0; i < this.particles.length; i++) {
			let sp = this.particles[i];

			// 1. Texture Animation (Spinning Coin Effect)
			// Uses all 9 coin images (CoinsGold000 to CoinsGold008)
			const numFramesForSpin = 9;
			const spinCycles = 3; // How many times the coin texture animates (spins) during its lifetime
			let currentFrameIndex = Math.floor(nt * numFramesForSpin * spinCycles) % numFramesForSpin;
			let textureNumStr = ("000" + currentFrameIndex).substr(-3);
			game.setTexture(sp, "CoinsGold" + textureNumStr);

			// 2. Position Animation (Coin Shower)
			// Coins start at center, spread out, and fall downwards with gravity.
			// nt (normalized time) is used as the time variable in kinematic equations.
			sp.x = centerX + sp.vx * nt;
			sp.y = centerY + sp.vy * nt + 0.5 * sp.gravityFactor * nt * nt;

			// 3. Scale Animation
			// Particles quickly scale up to their initialScale.
			sp.scale.x = sp.scale.y = sp.initialScale * Math.min(1, nt * 5); // Ramps up in first 20% of life

			// 4. Alpha Animation (Fade in, then fade out smoothly over the particle's lifetime)
			sp.alpha = Math.sin(nt * Math.PI);

			// 5. Physical Rotation Animation (Individual rotation of the sprite itself)
			sp.rotation = sp.baseRotation + sp.rotationSpeed * nt;
		}
	}
}

// ----- End of the assigment ----- //

class Game {
	constructor(props) {
		this.totalDuration = 0;
		this.effects = [];
		this.renderer = new PIXI.WebGLRenderer(800,450);
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();
		this.loadAssets(props&&props.onload);
	}
	loadAssets(cb) {
		let textureNames = [];
		// Load coin assets
		for (let i=0; i<=8; i++) {
			let num  = ("000"+i).substr(-3);
			let name = "CoinsGold"+num;
			let url  = "gfx/CoinsGold/"+num+".png";
			textureNames.push(name);
			PIXI.loader.add(name,url);
		}
		PIXI.loader.load(function(loader,res){
			// Access assets by name, not url
			let keys = Object.keys(res);
			for (let i=0; i<keys.length; i++) {
				var texture = res[keys[i]].texture;
				if ( ! texture) continue;
				PIXI.utils.TextureCache[keys[i]] = texture;
			}
			// Assets are loaded and ready!
			this.start();
			cb && cb();
		}.bind(this));
	}
	start() {	
		this.isRunning = true;
		this.t0 = Date.now();
		update.bind(this)();
		function update(){
			if ( ! this.isRunning) return;
			this.tick();
			this.render();
			requestAnimationFrame(update.bind(this));
		}
	}
	addEffect(eff) {
		this.totalDuration = Math.max(this.totalDuration,(eff.duration+eff.start)||0);
		this.effects.push(eff);
		this.stage.addChild(eff);
	}
	render() {
		this.renderer.render(this.stage);
	}
	tick() {
		let gt = Date.now();
		let lt = (gt-this.t0) % this.totalDuration;
		for (let i=0; i<this.effects.length; i++) {
			let eff = this.effects[i];
			if (lt>eff.start+eff.duration || lt<eff.start) continue;
			let elt = lt - eff.start;
			let ent = elt / eff.duration;
			eff.animTick(ent,elt,gt);
		}
	}
	sprite(name) {
		return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
	}
	setTexture(sp,name) {
		sp.texture = PIXI.utils.TextureCache[name];
		if ( ! sp.texture) console.warn("Texture '"+name+"' don't exist!")
	}
}

window.onload = function(){
	window.game = new Game({onload:function(){
		game.addEffect(new ParticleSystem());
	}});
}
