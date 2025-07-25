// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("webgl-canvas"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0x00aaff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
const pointLight = new THREE.PointLight(0xff00ff, 1, 100);
pointLight.position.set(-5, -5, -5);
scene.add(pointLight);

// --- MANAGER & LOADER ---
const loadingManager = new THREE.LoadingManager();
const loaderElement = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progress = itemsLoaded / itemsTotal;
  loaderBar.style.width = `${progress * 100}%`;
};
loadingManager.onLoad = () => {
  gsap.to(loaderElement, {
    opacity: 0,
    duration: 1,
    onComplete: () => (loaderElement.style.display = "none"),
  });
  gsap.from(camera.position, { z: 20, duration: 2.5, ease: "power3.out" });
  gsap.from(".header", {
    y: -100,
    opacity: 0,
    duration: 1.5,
    delay: 1,
    ease: "power3.out",
  });
  gsap.from(".social-links", {
    y: 100,
    opacity: 0,
    duration: 1.5,
    delay: 1,
    ease: "power3.out",
  });
};

// --- OBJECTS ---
const objects = [];
const targets = {};

// Central Core
const coreGeometry = new THREE.IcosahedronGeometry(1, 1);
const coreMaterial = new THREE.MeshStandardMaterial({
  color: 0x00aaff,
  metalness: 0.7,
  roughness: 0.2,
  wireframe: true,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
scene.add(core);

const textureLoader = new THREE.TextureLoader(loadingManager);

// Function to create section objects
function createSectionObject(name, position, geometry, color) {
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.5,
    roughness: 0.5,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.name = name;
  scene.add(mesh);
  objects.push(mesh);
  targets[name] = {
    position: new THREE.Vector3(position.x, position.y, position.z + 2),
    object: mesh,
  };
}

// Define section objects
createSectionObject(
  "summary",
  new THREE.Vector3(-5, 3, 0),
  new THREE.SphereGeometry(0.5, 32, 32),
  0xffffff
);
createSectionObject(
  "experience",
  new THREE.Vector3(5, 3, 0),
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  0x00ff00
);
createSectionObject(
  "technologies",
  new THREE.Vector3(-5, -3, 0),
  new THREE.ConeGeometry(0.5, 1, 32),
  0xff00ff
);
createSectionObject(
  "education",
  new THREE.Vector3(5, -3, 0),
  new THREE.TorusGeometry(0.5, 0.2, 16, 100),
  0xffff00
);
createSectionObject(
  "certificates",
  new THREE.Vector3(0, 0, -5),
  new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32),
  0xffa500
);

// --- PARTICLES ---
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 25;
}
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(posArray, 3)
);
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.01,
  color: 0x555555,
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- CAMERA & CONTROLS ---
camera.position.z = 10;
let currentTarget = null;
let isFocused = false;
const initialCameraPosition = new THREE.Vector3(0, 0, 10);
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Animate objects
  core.rotation.y += 0.005;
  core.rotation.x += 0.002;
  objects.forEach((obj) => {
    obj.rotation.y += 0.01;
  });

  // Mouse parallax effect when not focused
  if (!isFocused) {
    gsap.to(camera.position, {
      x: mouse.x * 2,
      y: mouse.y * 2,
      duration: 2,
      ease: "power2.out",
    });
    camera.lookAt(scene.position);
  }

  particlesMesh.rotation.y = elapsedTime * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// --- EVENT LISTENERS ---
window.addEventListener("resize", onWindowResize);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onClick);
document
  .querySelectorAll(".nav-item")
  .forEach((item) => item.addEventListener("click", onNavClick));
document
  .querySelectorAll(".close-btn")
  .forEach((btn) => btn.addEventListener("click", goBackToOverview));

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onNavClick(event) {
  const targetName = event.currentTarget.dataset.target;
  focusOnObject(targets[targetName]);
}

function onClick(event) {
  // Don't trigger if clicking on UI
  if (
    event.target.closest(".ui-container") ||
    event.target.closest(".content-panel")
  )
    return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const targetName = intersects[0].object.name;
    focusOnObject(targets[targetName]);
  }
}

function focusOnObject(target) {
  if (isFocused && currentTarget === target.object.name) return;

  isFocused = true;
  currentTarget = target.object.name;

  // Animate camera
  gsap.to(camera.position, {
    x: target.position.x,
    y: target.position.y,
    z: target.position.z,
    duration: 1.5,
    ease: "power3.inOut",
  });

  gsap.to(camera.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: "power3.inOut",
    onUpdate: () => camera.lookAt(target.object.position),
  });

  // Show content panel
  hideAllPanels();
  const panel = document.getElementById(`${target.object.name}-panel`);
  setTimeout(() => panel.classList.add("visible"), 750);

  // Update nav active state
  updateActiveNav(target.object.name);
}

function goBackToOverview() {
  if (!isFocused) return;
  isFocused = false;
  currentTarget = null;

  gsap.to(camera.position, {
    x: initialCameraPosition.x,
    y: initialCameraPosition.y,
    z: initialCameraPosition.z,
    duration: 1.5,
    ease: "power3.inOut",
  });

  gsap.to(camera.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: "power3.inOut",
    onUpdate: () => camera.lookAt(scene.position),
  });

  hideAllPanels();
  updateActiveNav(null);
}

function hideAllPanels() {
  document
    .querySelectorAll(".content-panel")
    .forEach((p) => p.classList.remove("visible"));
}

function updateActiveNav(targetName) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    if (item.dataset.target === targetName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}
