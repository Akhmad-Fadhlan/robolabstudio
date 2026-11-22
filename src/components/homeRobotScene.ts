import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mountHomeRobot(host: HTMLElement, onReady: (ready: boolean) => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, .12, 5.9);
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(-3, 4, 4);
  scene.add(light, new THREE.HemisphereLight(0xe8f7ff, 0x316893, 2.2));
  const robot = new THREE.Group();
  scene.add(robot);
  const part = (size: [number, number, number], position: [number, number, number], color: number, radius: number) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 3, radius),
      new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .08 }));
    mesh.position.set(...position);
    robot.add(mesh);
  };
  part([2, 1.25, .8], [0, .05, 0], 0xd6efff, .23);
  part([1.7, .85, .24], [0, .05, .39], 0x142e4a, .22);
  for (const side of [-1, 1]) {
    part([.27, .5, .46], [side * 1, .04, 0], 0x2485bc, .09);
    part([.22, .28, .11], [side * .42, .16, .53], 0x66e9ff, .06);
  }
  part([.32, .06, .08], [0, -.17, .54], 0x66e9ff, .02);
  part([.11, .29, .11], [.56, .72, 0], 0x2485bc, .03);
  part([.24, .24, .22], [.56, .88, 0], 0xfbbf54, .09);
  robot.rotation.x = .1;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let contextLost = false;
  const draw = (time: number) => {
    robot.rotation.y = reducedMotion.matches ? -.18 : -.18 + Math.sin(time / 1500) * .25;
    renderer.render(scene, camera);
  };
  const resize = () => {
    const { clientWidth, clientHeight } = host;
    if (!clientWidth || !clientHeight || contextLost) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    draw(performance.now());
  };
  const sync = () => {
    renderer.setAnimationLoop(visible && !document.hidden && !reducedMotion.matches && !contextLost ? draw : null);
    if (!contextLost) draw(performance.now());
  };
  const resized = new ResizeObserver(resize);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; sync(); onReady(false); };
  const restored = () => { contextLost = false; resize(); sync(); onReady(true); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);
  host.append(renderer.domElement);
  resized.observe(host);
  visibility.observe(host);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  resize();
  sync();
  onReady(true);
  return () => {
    renderer.setAnimationLoop(null);
    resized.disconnect();
    visibility.disconnect();
    document.removeEventListener('visibilitychange', sync);
    reducedMotion.removeEventListener('change', sync);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    renderer.domElement.removeEventListener('webglcontextrestored', restored);
    robot.children.forEach(child => { if (child instanceof THREE.Mesh) { child.geometry.dispose(); child.material.dispose(); } });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
