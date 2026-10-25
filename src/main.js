import * as THREE from 'three';
import { Nostalgist } from 'nostalgist';
import './style.css';

const app = document.querySelector('#app');
const data = [
  ['neon', 'Neon Rush', '🏎️', 'Racing', 'A/D or arrows · Shift nitro'],
  ['target', 'Target Ops', '🎯', 'Shooter', 'Mouse click · hit drones'],
  ['sky', 'Sky Jumper', '☁️', 'Platformer', 'A/D · Space jump'],
  ['shadow', 'Shadow Protocol', '🔐', 'Escape', 'A/D · E interact'],
  ['dash', 'Cyber Dash', '⚡', 'Runner', 'Arrows · Space jump'],
  ['retro', 'Retro Vault', '👾', 'Classic', 'GBA & NES · D-Pad + Z/X/Enter']
];

const store = {
  get: (k, d) => {
    try {
      return JSON.parse(localStorage.getItem('nexus-' + k)) ?? d;
    } catch {
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem('nexus-' + k, JSON.stringify(v));
    } catch {}
  }
};

let progress = store.get('progress', { played: {}, coins: 0, best: {}, ach: [] });
let active = null;

const save = () => store.set('progress', progress);
const unlock = x => {
  if (!progress.ach.includes(x)) {
    progress.ach.push(x);
    save();
  }
};

const beep = (f = 480) => {
  try {
    const c = new AudioContext();
    const o = c.createOscillator();
    const g = c.createGain();
    g.gain.setValueAtTime(0.04, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
    o.frequency.value = f;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.07);
  } catch {}
};

function home() {
  if (active) {
    active.destroy();
    active = null;
  }
  const n = Object.values(progress.played).reduce((a, b) => a + b, 0);
  app.innerHTML = `
    <div class="shell">
      <header>
        <button class="brand">ARCADE <b>NEXUS</b></button>
        <span class="pill">✦ 3D & RETRO GAME HUB</span>
      </header>
      <main>
        <section class="hero">
          <div>
            <small>PLAY / CREATE / REPEAT</small>
            <h1>Small worlds.<br>Big momentum.</h1>
            <p>Six handcrafted arcade experiences — from procedural Three.js worlds to classic GBA & NES retro legends.</p>
            <button class="action" data-go="retro">👾 Open Retro Vault</button>
          </div>
          <div>🎮</div>
        </section>

        <h2>Choose your challenge</h2>
        <section class="cards">
          ${data.map(g => `
            <article>
              <div class="art">${g[2]}<em>${g[3]}</em></div>
              <div class="body">
                <small>${g[3].toUpperCase()}</small>
                <h3>${g[1]}</h3>
                <p>${g[4]}</p>
                <button class="action" data-go="${g[0]}">Play now →</button>
              </div>
            </article>
          `).join('')}
        </section>

        <section class="stats">
          <div><small>GAMES PLAYED</small><b>${n}</b></div>
          <div><small>COINS</small><b>${progress.coins}</b></div>
          <div><small>BEST SCORE</small><b>${Math.max(0, ...Object.values(progress.best))}</b></div>
          <div><small>ACHIEVEMENTS</small><b>${progress.ach.length}/7</b></div>
        </section>

        <section class="ach">
          <h2>Achievement shelf</h2>
          ${[
            'First Drive',
            'Sharpshooter',
            'Sky Explorer',
            'Escape Artist',
            'Marathon Runner',
            'Retro Gamer',
            'Arcade Master'
          ].map(x => `
            <span class="${progress.ach.includes(x) ? 'got' : ''}">
              ${progress.ach.includes(x) ? '✦' : '○'} ${x}
            </span>
          `).join('')}
        </section>
      </main>
      <footer>Built with Three.js · Libretro WebAssembly · Vite · Free & Instant Deploy</footer>
    </div>
  `;

  document.querySelectorAll('[data-go]').forEach(x => {
    x.onclick = () => launch(x.dataset.go);
  });
}

function launch(id) {
  const d = data.find(x => x[0] === id);
  progress.played[id] = (progress.played[id] || 0) + 1;
  if (Object.keys(progress.played).length >= 6) {
    unlock('Arcade Master');
  }
  save();

  app.innerHTML = `
    <div class="shell">
      <header>
        <button class="brand" id="back">ARCADE <b>NEXUS</b></button>
        <span class="pill">${d[1].toUpperCase()}</span>
      </header>
      <main>
        <div class="gamehead">
          <div>
            <button class="back" id="hub">← Back to hub</button>
            <h1>${d[2]} ${d[1]}</h1>
          </div>
          <div id="hud"></div>
        </div>
        <div class="stage" id="stage">
          <div class="overlay" id="overlay">
            <h1>${d[1]}</h1>
            <p id="instruction"></p>
            <button class="action" id="start">Start game →</button>
          </div>
        </div>
        <p class="help" id="help"></p>
      </main>
    </div>
  `;

  document.querySelector('#back').onclick = home;
  document.querySelector('#hub').onclick = home;

  const registry = {
    neon: Neon,
    target: Target,
    sky: Sky,
    shadow: Shadow,
    dash: Dash,
    retro: Retro
  };

  active = new registry[id](document.querySelector('#stage'));
  active.intro();
}

class Base {
  constructor(stage) {
    this.stage = stage;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9bd8e5);
    this.scene.fog = new THREE.Fog(0x9bd8e5, 25, 100);
    this.cam = new THREE.PerspectiveCamera(60, 1, 0.1, 150);
    this.r = new THREE.WebGLRenderer({ antialias: true });
    this.r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    stage.prepend(this.r.domElement);
    this.clock = new THREE.Clock();
    this.run = false;
    this.clean = [];
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x44615b, 2.7));
    const l = new THREE.DirectionalLight(0xffffff, 1.8);
    l.position.set(4, 10, 6);
    this.scene.add(l);
    this.on(window, 'keydown', e => this.key(e));
    this.resize = () => {
      this.cam.aspect = stage.clientWidth / stage.clientHeight;
      this.cam.updateProjectionMatrix();
      this.r.setSize(stage.clientWidth, stage.clientHeight, false);
    };
    new ResizeObserver(this.resize).observe(stage);
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  on(x, n, f) {
    x.addEventListener(n, f);
    this.clean.push(() => x.removeEventListener(n, f));
  }

  mat(c) {
    return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  }

  box(w, h, d, c, x = 0, y = 0, z = 0) {
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(c));
    q.position.set(x, y, z);
    return q;
  }

  sphere(r, c) {
    return new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), this.mat(c));
  }

  intro() {
    const instruction = document.querySelector('#instruction');
    const help = document.querySelector('#help');
    const start = document.querySelector('#start');
    const overlay = document.querySelector('#overlay');
    if (instruction) instruction.textContent = this.instructions;
    if (help) help.textContent = this.help;
    if (start) {
      start.onclick = () => {
        this.run = true;
        if (overlay) overlay.hidden = true;
        beep();
      };
    }
  }

  key(e) {
    const instruction = document.querySelector('#instruction');
    const start = document.querySelector('#start');
    const overlay = document.querySelector('#overlay');
    if (e.code === 'KeyP' && this.run) {
      this.run = false;
      if (overlay) overlay.hidden = false;
      if (instruction) instruction.textContent = 'Paused. Press Resume when ready.';
      if (start) {
        start.textContent = 'Resume →';
        start.onclick = () => {
          this.run = true;
          if (overlay) overlay.hidden = true;
        };
      }
    }
    if (e.code === 'KeyR') this.restart();
  }

  hud(a) {
    const h = document.querySelector('#hud');
    if (h) h.innerHTML = a.map(x => `<span>${x}</span>`).join('');
  }

  finish(a, b) {
    this.run = false;
    const overlay = document.querySelector('#overlay');
    const instruction = document.querySelector('#instruction');
    const start = document.querySelector('#start');
    if (overlay) {
      overlay.hidden = false;
      const h1 = overlay.querySelector('h1');
      if (h1) h1.textContent = a;
    }
    if (instruction) instruction.textContent = b;
    if (start) {
      start.textContent = 'Play again →';
      start.onclick = () => this.restart();
    }
  }

  loop() {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.run) this.update(dt);
    this.r.render(this.scene, this.cam);
  }

  restart() {
    const id = this.id;
    this.destroy();
    launch(id);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.clean.forEach(x => x());
    this.scene.traverse(x => {
      x.geometry?.dispose();
      const m = Array.isArray(x.material) ? x.material : [x.material];
      m.forEach(y => y?.dispose());
    });
    this.r.dispose();
    this.r.domElement.remove();
  }

  update() {}
}

class Neon extends Base {
  constructor(s) {
    super(s);
    this.id = 'neon';
    this.instructions = 'Dodge traffic and collect gold coins. A/D or arrows to switch lanes; hold Shift for nitro!';
    this.help = 'A/D or ←/→ steer · Shift nitro · P pause · R restart';
    this.lanes = [-3.4, 0, 3.4];
    this.lane = 1;
    this.items = [];
    this.stripes = [];
    this.pillars = [];
    this.wheels = [];
    this.nitro = 100;
    this.runCoins = 0;
    this.score = 0;
    this.st = 0;
    this.boost = false;

    // Atmospheric dusk sky
    this.scene.background = new THREE.Color(0x111625);
    this.scene.fog = new THREE.FogExp2(0x111625, 0.015);
    this.cam.position.set(0, 6.5, 13);
    this.cam.lookAt(0, 1.2, -18);

    // Ground terrain & asphalt road
    this.scene.add(this.box(120, 0.1, 240, 0x0a0e17, 0, -0.2, -50));
    this.scene.add(this.box(13.2, 0.15, 240, 0x1f2733, 0, -0.05, -50));
    // Neon curbs
    this.scene.add(this.box(0.5, 0.25, 240, 0xff5252, -6.6, 0.05, -50));
    this.scene.add(this.box(0.5, 0.25, 240, 0xff5252, 6.6, 0.05, -50));

    // Animated dashed road lane stripes
    for (let i = 0; i < 20; i++) {
      const z = -90 + i * 10;
      for (const lx of [-1.7, 1.7]) {
        const stripe = this.box(0.25, 0.18, 4, 0xffffff, lx, 0, z);
        this.scene.add(stripe);
        this.stripes.push(stripe);
      }
    }

    // Roadside neon light pillars
    for (let i = 0; i < 14; i++) {
      const z = -80 + i * 16;
      for (const side of [-8.5, 8.5]) {
        const pillar = this.box(0.3, 5, 0.3, 0x00f2fe, side, 2.5, z);
        this.scene.add(pillar);
        this.pillars.push(pillar);
      }
    }

    // Player sports car
    this.car = this.createCar(0xffa834);
    this.car.position.set(0, 0, 6.5);
    this.scene.add(this.car);

    // Controls
    this.on(window, 'keydown', e => {
      if (['KeyA', 'ArrowLeft'].includes(e.code)) {
        if (this.lane > 0) {
          this.lane--;
          beep(440);
        }
      }
      if (['KeyD', 'ArrowRight'].includes(e.code)) {
        if (this.lane < 2) {
          this.lane++;
          beep(440);
        }
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.boost = true;
      }
    });
    this.on(window, 'keyup', e => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.boost = false;
      }
    });
  }

  createCar(color) {
    const g = new THREE.Group();
    // Body chassis
    g.add(this.box(2.2, 0.6, 3.8, color, 0, 0.55));
    // Cabin & tinted windshield
    g.add(this.box(1.7, 0.65, 1.9, 0x0f1823, 0, 1.1, -0.1));
    // Spoiler
    g.add(this.box(2.1, 0.1, 0.5, color, 0, 1.05, 1.6));
    g.add(this.box(0.15, 0.4, 0.15, 0x222, -0.8, 0.85, 1.6));
    g.add(this.box(0.15, 0.4, 0.15, 0x222, 0.8, 0.85, 1.6));
    // Headlights
    g.add(this.box(0.4, 0.15, 0.1, 0xffff77, -0.7, 0.6, -1.92));
    g.add(this.box(0.4, 0.15, 0.1, 0xffff77, 0.7, 0.6, -1.92));
    // Taillights
    g.add(this.box(0.5, 0.15, 0.1, 0xff2244, -0.7, 0.65, 1.92));
    g.add(this.box(0.5, 0.15, 0.1, 0xff2244, 0.7, 0.65, 1.92));

    // Wheels
    for (const x of [-1.15, 1.15]) {
      for (const z of [-1.1, 1.1]) {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12),
          this.mat(0x181c24)
        );
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.38, z);
        g.add(w);
        this.wheels.push(w);
      }
    }
    return g;
  }

  spawn() {
    const coin = Math.random() < 0.4;
    const laneIdx = Math.floor(Math.random() * 3);
    const targetX = this.lanes[laneIdx];

    if (coin) {
      const c = this.sphere(0.38, 0xffd24d);
      c.position.set(targetX, 0.9, -80);
      this.scene.add(c);
      this.items.push({ m: c, isCoin: true, x: targetX });
    } else {
      const trafficColors = [0xff4757, 0x2ed573, 0x1e90ff, 0x9b59b6];
      const col = trafficColors[Math.floor(Math.random() * trafficColors.length)];
      const car = this.createCar(col);
      car.position.set(targetX, 0, -80);
      this.scene.add(car);
      this.items.push({ m: car, isCoin: false, x: targetX });
    }
  }

  update(dt) {
    const isBoosting = this.boost && this.nitro > 5;
    const speed = isBoosting ? 44 : 24;

    if (isBoosting) {
      this.nitro = Math.max(0, this.nitro - dt * 32);
    } else {
      this.nitro = Math.min(100, this.nitro + dt * 16);
    }

    this.score += dt * (isBoosting ? 20 : 10);
    this.st += dt;
    if (this.st > (isBoosting ? 0.65 : 0.95)) {
      this.st = 0;
      this.spawn();
    }

    // Scroll road stripes
    this.stripes.forEach(s => {
      s.position.z += speed * dt;
      if (s.position.z > 15) s.position.z -= 160;
    });

    // Scroll light pillars
    this.pillars.forEach(p => {
      p.position.z += speed * dt;
      if (p.position.z > 15) p.position.z -= 160;
    });

    // Rotate wheels
    this.wheels.forEach(w => {
      w.rotation.x += speed * dt * 0.3;
    });

    // Smooth car lateral damping & roll tilt
    const targetX = this.lanes[this.lane];
    const dx = targetX - this.car.position.x;
    this.car.position.x = THREE.MathUtils.damp(this.car.position.x, targetX, 12, dt);
    this.car.rotation.z = THREE.MathUtils.damp(this.car.rotation.z, -dx * 0.15, 10, dt);

    // Dynamic camera FOV
    const targetFov = isBoosting ? 68 : 60;
    this.cam.fov = THREE.MathUtils.damp(this.cam.fov, targetFov, 6, dt);
    this.cam.updateProjectionMatrix();

    // Check traffic & collectibles
    for (let i = this.items.length - 1; i >= 0; i--) {
      const a = this.items[i];
      const itemSpeed = a.isCoin ? speed : speed - 9;
      a.m.position.z += itemSpeed * dt;

      if (a.isCoin) {
        a.m.rotation.y += dt * 4;
        a.m.position.y = 0.9 + Math.sin(this.score * 0.2) * 0.15;
      }

      const dz = Math.abs(a.m.position.z - 6.5);
      const distLateral = Math.abs(a.m.position.x - this.car.position.x);

      if (dz < 1.7 && distLateral < 1.4) {
        if (a.isCoin) {
          this.score += 50;
          this.runCoins++;
          progress.coins++;
          beep(780);
          this.scene.remove(a.m);
          this.items.splice(i, 1);
        } else {
          beep(130);
          this.finish('Traffic Crash!', `Traveled ${this.score | 0}m · Coins: ${this.runCoins}`);
          return;
        }
      } else if (a.m.position.z > 16) {
        this.scene.remove(a.m);
        this.items.splice(i, 1);
      }
    }

    progress.best.neon = Math.max(progress.best.neon || 0, this.score | 0);
    unlock('First Drive');
    save();

    this.hud([
      `🏎️ ${(speed * 3.6) | 0} km/h`,
      `<span class="hud-pill">⚡ <span class="hud-bar"><span class="hud-fill" style="width:${this.nitro | 0}%"></span></span></span>`,
      `🪙 ${this.runCoins}`,
      `Score: ${this.score | 0}`,
      `Best: ${progress.best.neon}`
    ]);
  }
}

class Target extends Base {
  constructor(s) {
    super(s);
    this.id = 'target';
    this.instructions = 'Aim with your mouse and click to blast floating cyber drones before the timer expires!';
    this.help = 'Mouse Aim · Left Click Shoot · P Pause';
    this.targets = [];
    this.ray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mousePixel = { x: 0, y: 0 };
    this.shots = 0;
    this.hits = 0;
    this.combo = 0;
    this.score = 0;
    this.left = 45;

    // Arena visual
    this.scene.background = new THREE.Color(0x0e1b24);
    this.scene.fog = new THREE.Fog(0x0e1b24, 15, 60);
    this.cam.position.set(0, 2.5, 9);
    this.cam.lookAt(0, 2.2, -10);

    // Grid floor
    this.scene.add(this.box(40, 0.2, 50, 0x162936, 0, 0, -10));
    const grid = new THREE.GridHelper(40, 20, 0x00f2fe, 0x1d3a4d);
    grid.position.set(0, 0.15, -10);
    this.scene.add(grid);

    // Crosshair DOM element
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'target-crosshair';
    this.stage.appendChild(this.crosshair);

    // Mouse tracking directly on canvas
    this.on(s, 'mousemove', e => {
      const rect = this.stage.getBoundingClientRect();
      this.mousePixel.x = e.clientX - rect.left;
      this.mousePixel.y = e.clientY - rect.top;
      this.mouse.x = (this.mousePixel.x / rect.width) * 2 - 1;
      this.mouse.y = -(this.mousePixel.y / rect.height) * 2 + 1;

      this.crosshair.style.display = 'block';
      this.crosshair.style.left = `${this.mousePixel.x}px`;
      this.crosshair.style.top = `${this.mousePixel.y}px`;

      // Check lock hover
      this.ray.setFromCamera(this.mouse, this.cam);
      const meshes = this.targets.map(t => t.m);
      const intersects = this.ray.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        this.crosshair.classList.add('lock');
      } else {
        this.crosshair.classList.remove('lock');
      }
    });

    this.on(s, 'mouseleave', () => {
      this.crosshair.style.display = 'none';
    });

    this.on(s, 'mousedown', () => this.shoot());
  }

  intro() {
    super.intro();
    const start = document.querySelector('#start');
    const overlay = document.querySelector('#overlay');
    if (start) {
      start.onclick = () => {
        this.run = true;
        if (overlay) overlay.hidden = true;
        this.left = 45;
        this.shots = 0;
        this.hits = 0;
        this.combo = 0;
        this.score = 0;
        for (let i = 0; i < 7; i++) this.spawn();
      };
    }
  }

  spawn() {
    const drone = new THREE.Group();
    const core = this.sphere(0.55, 0xff4757);
    drone.add(core);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.08, 8, 20),
      this.mat(0x00f2fe)
    );
    drone.add(ring);

    drone.position.set(
      (Math.random() - 0.5) * 18,
      1.2 + Math.random() * 4.5,
      -6 - Math.random() * 16
    );
    this.scene.add(drone);
    this.targets.push({
      m: drone,
      ring,
      core,
      p: Math.random() * Math.PI * 2,
      speedX: 0.8 + Math.random() * 1.5,
      amplitude: 1.5 + Math.random() * 2
    });
  }

  shoot() {
    if (!this.run) return;
    this.shots++;

    this.crosshair.classList.add('shot');
    setTimeout(() => this.crosshair.classList.remove('shot'), 80);

    this.ray.setFromCamera(this.mouse, this.cam);
    const meshes = this.targets.map(t => t.m);
    const intersects = this.ray.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let hitObj = intersects[0].object;
      while (hitObj.parent && hitObj.parent !== this.scene) {
        hitObj = hitObj.parent;
      }

      const idx = this.targets.findIndex(t => t.m === hitObj);
      if (idx !== -1) {
        this.hits++;
        this.combo++;
        const multiplier = Math.min(4, Math.floor(this.combo / 2) + 1);
        const pts = 100 * multiplier;
        this.score += pts;
        beep(820 + Math.min(300, this.combo * 40));

        this.showPopup(`+${pts}${multiplier > 1 ? ` (x${multiplier})` : ''}`, this.mousePixel.x, this.mousePixel.y);

        this.scene.remove(this.targets[idx].m);
        this.targets.splice(idx, 1);
        this.spawn();
      }
    } else {
      beep(150);
      this.combo = 0;
    }
  }

  showPopup(text, x, y) {
    const pop = document.createElement('div');
    pop.className = 'floating-popup';
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    this.stage.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
  }

  update(dt) {
    this.left -= dt;

    this.targets.forEach(t => {
      t.p += dt * t.speedX;
      t.m.position.x += Math.sin(t.p) * dt * t.amplitude;
      t.m.position.y += Math.cos(t.p * 1.3) * dt * 0.6;
      t.ring.rotation.z += dt * 3;
      t.ring.rotation.x += dt * 1.5;
    });

    this.cam.rotation.y = THREE.MathUtils.damp(this.cam.rotation.y, -this.mouse.x * 0.18, 8, dt);
    this.cam.rotation.x = THREE.MathUtils.damp(this.cam.rotation.x, this.mouse.y * 0.14, 8, dt);

    const acc = this.shots ? Math.round((this.hits / this.shots) * 100) : 0;

    if (this.left <= 0) {
      if (acc >= 60 && this.hits >= 15) unlock('Sharpshooter');
      this.crosshair.style.display = 'none';
      this.finish(
        'Training Complete!',
        `Final Score: ${this.score} pts · Hits: ${this.hits}/${this.shots} (${acc}% accuracy)`
      );
    }

    this.hud([
      `🎯 Score: ${this.score}`,
      `⏱️ ${Math.ceil(Math.max(0, this.left))}s`,
      `🔥 Combo: ${this.combo > 1 ? `x${Math.min(4, Math.floor(this.combo / 2) + 1)}` : '—'}`,
      `📊 Accuracy: ${acc}%`
    ]);
  }

  destroy() {
    this.crosshair?.remove();
    super.destroy();
  }
}

class Sky extends Base {
  constructor(s) {
    super(s);
    this.id = 'sky';
    this.instructions = 'Jump across the floating islands to reach the celestial portal! Supports full 4-way movement and double-jump.';
    this.help = 'WASD or Arrows move · Space Jump / Double-Jump · P Pause';
    this.keys = {};
    this.platforms = [];
    this.crystals = [];
    this.crystalsFound = 0;
    this.lives = 3;
    this.vy = 0;
    this.ground = false;
    this.jumpsLeft = 2;
    this.respawnPoint = new THREE.Vector3(0, 1.2, 5);

    this.scene.background = new THREE.Color(0x8ecae6);
    this.scene.fog = new THREE.Fog(0x8ecae6, 20, 85);
    this.cam.position.set(0, 7, 13);

    // Player character sphere
    this.p = this.sphere(0.55, 0xffa040);
    this.p.position.copy(this.respawnPoint);
    this.scene.add(this.p);

    // Island chain
    const islandConfigs = [
      { x: 0, y: 0, z: 5, w: 5, d: 5, moving: false },
      { x: -2.5, y: 0.5, z: -1, w: 4, d: 3.5, moving: false },
      { x: 2.5, y: 1.0, z: -7, w: 4, d: 3.5, moving: true, range: 2.2 },
      { x: -1.5, y: 1.8, z: -14, w: 4, d: 4, moving: false },
      { x: 2.8, y: 2.3, z: -21, w: 3.8, d: 3.5, moving: false },
      { x: -2.5, y: 2.7, z: -28, w: 4, d: 3.5, moving: true, range: 2.5 },
      { x: 0, y: 3.2, z: -35, w: 4.2, d: 4, moving: false },
      { x: 2.2, y: 3.8, z: -42, w: 4, d: 3.5, moving: false },
      { x: 0, y: 4.2, z: -50, w: 6.5, d: 6.5, moving: false, goal: true }
    ];

    islandConfigs.forEach((cfg, i) => {
      const top = this.box(cfg.w, 0.7, cfg.d, 0x48bb78, cfg.x, cfg.y, cfg.z);
      const base = this.box(cfg.w * 0.85, 1.2, cfg.d * 0.85, 0x4a5568, cfg.x, cfg.y - 0.8, cfg.z);
      const group = new THREE.Group();
      group.add(top);
      group.add(base);
      this.scene.add(group);

      this.platforms.push({
        group,
        top,
        x: cfg.x,
        baseX: cfg.x,
        y: cfg.y,
        z: cfg.z,
        w: cfg.w,
        d: cfg.d,
        moving: cfg.moving,
        range: cfg.range || 0,
        goal: cfg.goal
      });

      if (i > 0 && !cfg.goal) {
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.38, 0),
          this.mat(0x00f2fe)
        );
        crystal.position.set(cfg.x, cfg.y + 1.2, cfg.z);
        this.scene.add(crystal);
        this.crystals.push(crystal);
      }
    });

    // Cosmic Goal Portal
    this.portal = new THREE.Group();
    const portalRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.16, 12, 30),
      this.mat(0xb388ff)
    );
    const portalCore = this.sphere(0.9, 0x7c4dff);
    this.portal.add(portalRing);
    this.portal.add(portalCore);
    this.portal.position.set(0, 5.6, -50);
    this.scene.add(this.portal);

    // Key listeners (WASD + Arrows)
    this.on(window, 'keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.jump();
      }
    });
    this.on(window, 'keyup', e => {
      this.keys[e.code] = false;
    });
  }

  jump() {
    if (!this.run) return;
    if (this.ground || this.jumpsLeft > 0) {
      this.vy = 8.8;
      this.ground = false;
      this.jumpsLeft--;
      beep(this.jumpsLeft === 1 ? 520 : 710);
    }
  }

  update(dt) {
    const speed = 7.5;
    let mx = 0;
    let mz = 0;

    if (this.keys.KeyA || this.keys.ArrowLeft) mx -= speed * dt;
    if (this.keys.KeyD || this.keys.ArrowRight) mx += speed * dt;
    if (this.keys.KeyW || this.keys.ArrowUp) mz -= speed * dt;
    if (this.keys.KeyS || this.keys.ArrowDown) mz += speed * dt;

    this.p.position.x += mx;
    this.p.position.z += mz;

    this.vy -= 22 * dt;
    this.p.position.y += this.vy * dt;
    this.ground = false;

    const time = Date.now() * 0.002;
    this.platforms.forEach(plat => {
      if (plat.moving) {
        plat.group.position.x = Math.sin(time) * plat.range;
        plat.x = plat.baseX + plat.group.position.x;
      }

      const onPlatformX = Math.abs(this.p.position.x - plat.x) <= plat.w * 0.5 + 0.15;
      const onPlatformZ = Math.abs(this.p.position.z - plat.z) <= plat.d * 0.5 + 0.15;
      const targetTopY = plat.y + 0.35 + 0.55;

      if (
        onPlatformX &&
        onPlatformZ &&
        this.vy <= 0 &&
        this.p.position.y >= targetTopY - 0.4 &&
        this.p.position.y <= targetTopY + 0.45
      ) {
        this.p.position.y = targetTopY;
        this.vy = 0;
        this.ground = true;
        this.jumpsLeft = 2;
        this.respawnPoint.set(plat.x, targetTopY, plat.z);
      }
    });

    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      c.rotation.y += dt * 3.5;
      c.rotation.x += dt * 2;
      if (this.p.position.distanceTo(c.position) < 0.95) {
        this.scene.remove(c);
        this.crystals.splice(i, 1);
        this.crystalsFound++;
        progress.coins++;
        beep(780);
      }
    }

    this.portal.rotation.z += dt * 2;
    this.portal.rotation.y += dt * 1.5;
    if (this.p.position.distanceTo(this.portal.position) < 1.6) {
      unlock('Sky Explorer');
      beep(880);
      this.finish(
        'Celestial Victory!',
        `Course Cleared! Collected ${this.crystalsFound}/7 Sky Crystals.`
      );
      return;
    }

    if (this.p.position.y < -7) {
      this.lives--;
      beep(180);
      if (this.lives <= 0) {
        this.finish('Fell Into The Abyss!', `Out of lives. Crystals found: ${this.crystalsFound}`);
        return;
      } else {
        this.p.position.copy(this.respawnPoint);
        this.vy = 0;
        this.jumpsLeft = 2;
      }
    }

    const camTarget = new THREE.Vector3(
      THREE.MathUtils.damp(this.cam.position.x, this.p.position.x, 8, dt),
      THREE.MathUtils.damp(this.cam.position.y, this.p.position.y + 5.5, 6, dt),
      THREE.MathUtils.damp(this.cam.position.z, this.p.position.z + 10, 8, dt)
    );
    this.cam.position.copy(camTarget);
    this.cam.lookAt(this.p.position.x, this.p.position.y + 1, this.p.position.z - 4);

    const distToPortal = Math.max(0, Math.round(this.p.position.z - (-50)));
    save();

    this.hud([
      `<span class="hud-hearts">${'❤️'.repeat(Math.max(0, this.lives))}</span>`,
      `💎 Crystals: ${this.crystalsFound}/7`,
      `📍 Goal: ${distToPortal}m`,
      `Jumps: ${this.jumpsLeft}`
    ]);
  }
}

class Shadow extends Base {
  constructor(s) {
    super(s);
    this.id = 'shadow';
    this.instructions = 'Find the keycard, then press E near the terminal and type the shown hack sequence.';
    this.help = 'WASD or Arrows move · E interact · Q E R F hack · P pause';
    this.scene.background = new THREE.Color(0x203044);
    this.cam.position.set(0, 6, 11);
    this.p = this.sphere(0.5, 0x91d6d3);
    this.p.position.set(0, 0.7, 5);
    this.scene.add(this.p);
    this.card = this.box(0.7, 0.12, 1, 0xffc657, -3, 0.8, -3);
    this.term = this.box(1.5, 2, 1, 0x6599ce, 3, 1, -6);
    this.door = this.box(5, 4, 0.4, 0x6b768c, 0, 2, -15);
    this.scene.add(this.card, this.term, this.door);
    this.phase = 'FIND KEYCARD';
    this.keys = {};
    this.on(window, 'keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interact();
      if (this.phase === 'HACK' && ['Q', 'E', 'R', 'F'].includes(e.key.toUpperCase())) {
        this.hack(e.key.toUpperCase());
      }
    });
    this.on(window, 'keyup', e => {
      this.keys[e.code] = false;
    });
  }

  interact() {
    if (!this.run) return;
    const overlay = document.querySelector('#overlay');
    const instruction = document.querySelector('#instruction');
    const start = document.querySelector('#start');
    if (this.phase === 'FIND KEYCARD' && this.p.position.distanceTo(this.card.position) < 2) {
      this.scene.remove(this.card);
      this.phase = 'HACK TERMINAL';
      beep(720);
    } else if (this.phase === 'HACK TERMINAL' && this.p.position.distanceTo(this.term.position) < 2) {
      this.phase = 'HACK';
      this.seq = ['Q', 'E', 'R', 'F'];
      this.i = 0;
      if (overlay) overlay.hidden = false;
      if (overlay?.querySelector('h1')) overlay.querySelector('h1').textContent = 'Security hack';
      if (instruction) instruction.textContent = 'Enter: Q → E → R → F';
      if (start) {
        start.textContent = 'Hack in progress';
        start.onclick = () => {};
      }
    }
  }

  hack(k) {
    const overlay = document.querySelector('#overlay');
    if (k === this.seq[this.i]) {
      this.i++;
      beep(710);
      if (this.i === 4) {
        this.phase = 'ESCAPE';
        if (overlay) overlay.hidden = true;
        this.door.userData.open = 1;
      }
    } else {
      this.i = 0;
      beep(160);
    }
  }

  update(dt) {
    if (this.keys.KeyA || this.keys.ArrowLeft) this.p.position.x -= 4 * dt;
    if (this.keys.KeyD || this.keys.ArrowRight) this.p.position.x += 4 * dt;
    if (this.keys.KeyW || this.keys.ArrowUp) this.p.position.z -= 4 * dt;
    if (this.keys.KeyS || this.keys.ArrowDown) this.p.position.z += 4 * dt;
    if (this.door.userData.open) this.door.position.y += dt * 3;
    this.cam.position.lerp(new THREE.Vector3(this.p.position.x, 6, this.p.position.z + 9), dt * 3);
    this.cam.lookAt(this.p.position);
    if (this.phase === 'ESCAPE' && this.p.position.z < -17) {
      unlock('Escape Artist');
      this.finish('Escape successful', 'The facility seals behind you.');
    }
    this.hud([`Objective: ${this.phase}`, `Keycard ${this.phase === 'FIND KEYCARD' ? '—' : '✓'}`]);
  }
}

class Dash extends Neon {
  constructor(s) {
    super(s);
    this.id = 'dash';
    this.instructions = 'An endless future-city sprint. Arrows switch lanes, Space jumps; collect coins and avoid blockers.';
    this.help = '←/→ or A/D lanes · Space jump · P pause';
    this.scene.background = new THREE.Color(0x8fcce4);
    this.items.forEach(x => this.scene.remove(x.m));
    this.items = [];
    this.on(window, 'keydown', e => {
      if (e.code === 'Space' && this.ground) {
        this.vy = 8;
        beep(590);
      }
    });
  }

  update(dt) {
    const v = 20 + ((this.time = (this.time || 0) + dt) * 0.4);
    this.vy = (this.vy || 0) - 18 * dt;
    this.car.position.y += this.vy * dt;
    if (this.car.position.y <= 0) {
      this.car.position.y = 0;
      this.vy = 0;
      this.ground = true;
    } else {
      this.ground = false;
    }
    this.score = (this.score || 0) + dt * 10;
    this.st = (this.st || 0) + dt;
    if (this.st > 0.8) {
      this.st = 0;
      this.spawn();
    }
    this.car.position.x = THREE.MathUtils.damp(this.car.position.x, this.lanes[this.lane], 10, dt);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const a = this.items[i];
      a.m.position.z += v * dt;
      if (a.m.position.distanceTo(this.car.position) < 1.3) {
        if (a.isCoin) {
          this.score += 30;
          progress.coins++;
          beep(760);
          this.scene.remove(a.m);
          this.items.splice(i, 1);
        } else {
          this.finish('Run over!', `Distance ${(this.time * 10) | 0}m`);
          return;
        }
      } else if (a.m.position.z > 15) {
        this.scene.remove(a.m);
        this.items.splice(i, 1);
      }
    }
    if (this.time > 30) unlock('Marathon Runner');
    progress.best.dash = Math.max(progress.best.dash || 0, this.score | 0);
    save();
    this.hud([`Distance ${(this.time * 10) | 0}m`, `Score ${this.score | 0}`, `Speed ${v | 0}`]);
  }
}


const RETRO_CATALOG = [
  {
    id: 'anguna',
    name: 'Anguna: Warriors of Faith',
    system: 'Game Boy Advance',
    badge: 'GBA',
    core: 'mgba',
    file: '/games/anguna.gba',
    icon: '🗡️',
    desc: 'Top-down action RPG adventure with dungeons, swords & magic.'
  },
  {
    id: 'sushi',
    name: 'Sushi The Cat',
    system: 'Game Boy Advance',
    badge: 'GBA',
    core: 'mgba',
    file: '/games/sushi.gba',
    icon: '🐱',
    desc: 'Charming, fast-paced arcade platformer catching fish and treats.'
  },
  {
    id: 'alwa',
    name: "Alwa's Awakening (Demo)",
    system: 'Nintendo Entertainment System',
    badge: 'NES',
    core: 'fceumm',
    file: '/games/alwa.nes',
    icon: '🛡️',
    desc: 'Challenging 8-bit retro platformer with magic staff puzzles.'
  }
];

class Retro {
  constructor(stage) {
    this.stage = stage;
    this.id = 'retro';
    this.instructions = 'Play legendary GBA and NES retro games directly in your browser. Choose an included title or load your custom ROM!';
    this.help = 'D-Pad: Arrows · A: X · B: Z · Start: Enter · Select: Shift · L/R: Q/W';
    this.nostalgist = null;
    this.savedState = null;
    this.activeGame = null;
    this.container = document.createElement('div');
    this.container.className = 'retro-screen';
    this.stage.prepend(this.container);
  }

  intro() {
    const overlay = document.querySelector('#overlay');
    if (overlay) overlay.hidden = true; // Retro mode manages its own rich interactive shelf
    this.renderMenu();
    this.hud(['👾 Retro Vault', 'Select a Game', '3 Built-in + Custom ROMs']);
  }

  hud(a) {
    const h = document.querySelector('#hud');
    if (h) h.innerHTML = a.map(x => `<span>${x}</span>`).join('');
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="retro-menu">
        <h2>Retro Game Vault</h2>
        <p>Zero servers, zero latency. High-performance Libretro WebAssembly emulation running locally in your browser.</p>

        <div class="retro-grid">
          ${RETRO_CATALOG.map(g => `
            <div class="retro-card" data-retro-id="${g.id}">
              <div class="icon">${g.icon}</div>
              <h4>${g.name}</h4>
              <span class="tag">${g.badge}</span>
              <small style="color:#7f97a2;font-size:11px;">${g.desc}</small>
            </div>
          `).join('')}
        </div>

        <label class="retro-upload">
          📁 <span><b>Load Custom ROM</b> (.gba, .nes, .sfc, .gbc, .zip)</span>
          <input type="file" id="retro-file-input" accept=".gba,.nes,.sfc,.smc,.gb,.gbc,.zip,.bin" />
        </label>

        <div class="retro-controls-hint">
          <span>🎮 D-Pad: Arrows</span>
          <span>🅰️ A Button: X</span>
          <span>🅱️ B Button: Z</span>
          <span>▶️ Start: Enter</span>
          <span>⏸️ Select: Shift</span>
        </div>
      </div>
    `;

    this.container.querySelectorAll('[data-retro-id]').forEach(card => {
      card.onclick = () => {
        const item = RETRO_CATALOG.find(x => x.id === card.dataset.retroId);
        if (item) this.bootGame(item);
      };
    });

    const fileInput = this.container.querySelector('#retro-file-input');
    if (fileInput) {
      fileInput.onchange = e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const name = file.name.toLowerCase();
        let core = 'mgba';
        let badge = 'GBA';
        if (name.endsWith('.nes')) {
          core = 'fceumm';
          badge = 'NES';
        } else if (name.endsWith('.sfc') || name.endsWith('.smc')) {
          core = 'snes9x';
          badge = 'SNES';
        } else if (name.endsWith('.md') || name.endsWith('.gen')) {
          core = 'genesis_plus_gx';
          badge = 'SEGA';
        }

        this.bootGame({
          name: file.name.replace(/\.[^/.]+$/, ''),
          badge,
          core,
          file,
          icon: '💾'
        });
      };
    }
  }

  async bootGame(game) {
    this.activeGame = game;
    this.container.innerHTML = `
      <div class="retro-loading">
        <div>⚡ Loading ${game.name}...</div>
        <small style="font-size:12px;color:#859da5;font-family:DM Sans,sans-serif;">Initializing WebAssembly Core (${game.core})...</small>
      </div>
    `;

    try {
      if (this.nostalgist) {
        await this.nostalgist.exit({ removeCanvas: true });
        this.nostalgist = null;
      }

      this.container.innerHTML = `
        <div class="retro-viewport" id="retro-viewport">
          <div class="retro-toolbar">
            <button class="retro-btn" id="btn-save" title="Save game state">💾 Save</button>
            <button class="retro-btn" id="btn-load" title="Load game state">📂 Load</button>
            <button class="retro-btn" id="btn-restart" title="Restart game">🔄 Reset</button>
            <button class="retro-btn" id="btn-switch" title="Choose another game">🕹️ Library</button>
            <button class="retro-btn" id="btn-fullscreen" title="Toggle Fullscreen">⛶ Fullscreen</button>
          </div>
        </div>
      `;

      const viewport = this.container.querySelector('#retro-viewport');

      let romData = game.file;
      if (typeof game.file === 'string') {
        const fullUrl = new URL(game.file, window.location.href).href;
        const res = await fetch(fullUrl);
        if (!res.ok) {
          throw new Error(`Failed to load ${game.name} (${res.status} ${res.statusText})`);
        }
        romData = await res.blob();
      }

      this.nostalgist = await Nostalgist.launch({
        core: game.core,
        rom: romData,
        resolveRom: file => (typeof file === 'string' ? new URL(file, window.location.href).href : file)
      });

      const canvas = this.nostalgist.getCanvas();
      if (canvas && viewport) {
        viewport.prepend(canvas);
      }

      unlock('Retro Gamer');
      progress.coins += 10;
      save();

      this.hud([
        `${game.icon} ${game.name}`,
        `Core: ${game.badge}`,
        'Controls: Arrows + Z/X/Enter'
      ]);

      const btnSave = this.container.querySelector('#btn-save');
      const btnLoad = this.container.querySelector('#btn-load');
      const btnRestart = this.container.querySelector('#btn-restart');
      const btnSwitch = this.container.querySelector('#btn-switch');
      const btnFs = this.container.querySelector('#btn-fullscreen');

      if (btnSave) {
        btnSave.onclick = async () => {
          if (!this.nostalgist) return;
          try {
            this.savedState = await this.nostalgist.saveState();
            btnSave.textContent = '✓ Saved!';
            beep(740);
            setTimeout(() => (btnSave.textContent = '💾 Save'), 1500);
          } catch (err) {
            console.error('Save state failed:', err);
          }
        };
      }

      if (btnLoad) {
        btnLoad.onclick = async () => {
          if (!this.nostalgist || !this.savedState) {
            btnLoad.textContent = '⚠️ No Save';
            setTimeout(() => (btnLoad.textContent = '📂 Load'), 1500);
            return;
          }
          try {
            await this.nostalgist.loadState(this.savedState.state);
            btnLoad.textContent = '✓ Loaded!';
            beep(680);
            setTimeout(() => (btnLoad.textContent = '📂 Load'), 1500);
          } catch (err) {
            console.error('Load state failed:', err);
          }
        };
      }

      if (btnRestart) {
        btnRestart.onclick = async () => {
          if (this.nostalgist) {
            await this.nostalgist.restart();
          }
        };
      }

      if (btnSwitch) {
        btnSwitch.onclick = async () => {
          if (this.nostalgist) {
            await this.nostalgist.exit({ removeCanvas: true });
            this.nostalgist = null;
          }
          this.renderMenu();
          this.hud(['👾 Retro Vault', 'Select a Game', '3 Built-in + Custom ROMs']);
        };
      }

      if (btnFs) {
        btnFs.onclick = () => {
          if (!document.fullscreenElement) {
            viewport?.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
          }
        };
      }
    } catch (err) {
      console.error('Failed to boot retro game:', err);
      this.container.innerHTML = `
        <div class="retro-loading" style="color:#ff6d70;padding:20px;">
          <div>⚠️ Could not boot emulator</div>
          <p style="font-size:13px;color:#9cb3ba;max-width:440px;line-height:1.5;">${err.message || 'Check browser WebAssembly permissions and network connection.'}</p>
          <button class="action" id="retro-retry-btn">Back to Library →</button>
        </div>
      `;
      const retry = this.container.querySelector('#retro-retry-btn');
      if (retry) {
        retry.onclick = () => this.renderMenu();
      }
    }
  }

  async destroy() {
    if (this.nostalgist) {
      try {
        await this.nostalgist.exit({ removeCanvas: true });
      } catch (err) {
        console.warn('Error during nostalgist exit:', err);
      }
      this.nostalgist = null;
    }
    this.container.remove();
  }
}

home();
