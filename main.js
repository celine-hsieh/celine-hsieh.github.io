// ===== THREE.JS POINT CLOUD HERO =====
(function () {
  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 28);

  // --- Point Cloud ---
  const NUM_POINTS = 2200;
  const positions = new Float32Array(NUM_POINTS * 3);
  const colors = new Float32Array(NUM_POINTS * 3);
  const sizes = new Float32Array(NUM_POINTS);

  const colorA = new THREE.Color('#00D4FF'); // cyan
  const colorB = new THREE.Color('#7B61FF'); // purple
  const colorC = new THREE.Color('#E8F4FD'); // white

  for (let i = 0; i < NUM_POINTS; i++) {
    const i3 = i * 3;
    // Spread points in a spatial cloud shape
    const r = 12 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i3 + 2] = r * Math.cos(phi) * 0.8;

    // Color distribution
    const t = Math.random();
    let col;
    if (t < 0.5)       col = colorA.clone().lerp(colorB, t * 2);
    else if (t < 0.85) col = colorB.clone().lerp(colorC, (t - 0.5) * 2.86);
    else               col = colorC;

    colors[i3]     = col.r;
    colors[i3 + 1] = col.g;
    colors[i3 + 2] = col.b;

    sizes[i] = 0.8 + Math.random() * 2.5;
  }

  // Dense cluster in center (like a 3D scene)
  for (let i = 0; i < 300; i++) {
    const i3 = (NUM_POINTS - 300 + i) * 3;
    positions[i3]     = (Math.random() - 0.5) * 8;
    positions[i3 + 1] = (Math.random() - 0.5) * 4;
    positions[i3 + 2] = (Math.random() - 0.5) * 6;

    const t = Math.random();
    const col = colorA.clone().lerp(colorC, t);
    colors[i3]     = col.r;
    colors[i3 + 1] = col.g;
    colors[i3 + 2] = col.b;
    sizes[NUM_POINTS - 300 + i] = 1.5 + Math.random() * 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // --- Connecting Lines (sparse) ---
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00D4FF, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending,
  });
  const lineGeo = new THREE.BufferGeometry();
  const lineVerts = [];
  for (let i = 0; i < 80; i++) {
    const a = Math.floor(Math.random() * (NUM_POINTS - 300));
    const b = Math.floor(Math.random() * (NUM_POINTS - 300));
    const a3 = a * 3, b3 = b * 3;
    const dx = positions[a3] - positions[b3];
    const dy = positions[a3+1] - positions[b3+1];
    const dz = positions[a3+2] - positions[b3+2];
    if (Math.sqrt(dx*dx+dy*dy+dz*dz) < 10) {
      lineVerts.push(positions[a3], positions[a3+1], positions[a3+2]);
      lineVerts.push(positions[b3], positions[b3+1], positions[b3+2]);
    }
  }
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  // --- Bounding Boxes (3D objects) ---
  function makeBBox(w, h, d, color, x, y, z) {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending });
    const mesh = new THREE.LineSegments(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  const box1 = makeBBox(4, 3, 3, 0x00D4FF,  3, -1,  0);
  const box2 = makeBBox(2.5, 4, 2.5, 0x7B61FF, -4,  1, -2);
  const box3 = makeBBox(3, 2, 2, 0x00D4FF, -1, -2,  3);

  // --- Mouse parallax ---
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // --- Scroll fade ---
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  // --- Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Animate ---
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.12;
    targetY += (mouseY - targetY) * 0.12;

    points.rotation.y = t * 0.04 + targetX * 0.3;
    points.rotation.x = targetY * 0.15;

    box1.rotation.y = t * 0.3;
    box2.rotation.y = -t * 0.2;
    box2.rotation.x = t * 0.15;
    box3.rotation.z = t * 0.25;

    // Scroll fade
    const fade = Math.max(0, 1 - scrollY / 500);
    renderer.domElement.style.opacity = fade;

    // Particle opacity: brighter in light mode
    material.opacity = document.body.classList.contains('light-mode') ? 0.75 : 0.45;

    renderer.render(scene, camera);
  }
  animate();
})();

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll(
  '.research-card, .pub-item, .project-card, .award-item, .stat-card, .contact-card'
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = entry.target.style.transform
        ? entry.target.style.transform.replace('translateY(30px)', 'translateY(0)')
        : 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.07}s, transform 0.6s ease ${i * 0.07}s`;
  observer.observe(el);
});

// ===== ABOUT TABS =====
const atabs = document.querySelectorAll('.atab');
const atabContents = document.querySelectorAll('.atab-content');
atabs.forEach(tab => {
  tab.addEventListener('click', () => {
    atabs.forEach(t => t.classList.remove('active'));
    atabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ===== PUBLICATION FILTER =====
const filterBtns = document.querySelectorAll('.pf-btn');
const pubItems = document.querySelectorAll('.pub-item[data-cat]');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    pubItems.forEach(item => {
      if (filter === 'all' || item.dataset.cat === filter) {
        item.classList.remove('pub-hidden');
      } else {
        item.classList.add('pub-hidden');
      }
    });
  });
});

// ===== CARD CLICK → DETAIL PAGE =====
document.querySelectorAll('[data-href]').forEach(el => {
  el.style.cursor = 'pointer';
  el.addEventListener('click', (e) => {
    // Don't navigate if clicking an <a> inside the card
    if (e.target.closest('a')) return;
    window.location.href = el.dataset.href;
  });
});

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? 'var(--accent)' : '';
  });
});

// ===== MOBILE MENU =====
const hamburger = document.getElementById('navHamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileClose = document.getElementById('mobileMenuClose');

if (hamburger && mobileMenu && mobileOverlay && mobileClose) {
  function openMenu() {
    mobileMenu.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);
  mobileOverlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-link').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
}

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');

function applyTheme(light) {
  document.body.classList.toggle('light-mode', light);
  if (themeToggle) {
    const iconMoon = themeToggle.querySelector('.icon-moon');
    const iconSun = themeToggle.querySelector('.icon-sun');
    if (iconMoon) iconMoon.style.display = light ? 'none' : '';
    if (iconSun) iconSun.style.display = light ? '' : 'none';
  }
  const themeMeta = document.getElementById('themeColorMeta');
  if (themeMeta) themeMeta.content = light ? '#EBF0F6' : '#050A14';
  localStorage.setItem('theme', light ? 'light' : 'dark');
}

// Load saved preference
applyTheme(localStorage.getItem('theme') === 'light');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    applyTheme(!document.body.classList.contains('light-mode'));
  });
}
