import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mountLoginShowcase(host: HTMLElement, onReadyChange: (ready: boolean) => void) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 60);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.17;
  scene.add(new T.HemisphereLight(0xe1efff, 0x263753, 2.5));
  const key = new T.DirectionalLight(0xffffff, 2.6);
  key.position.set(-4, 7, 6);
  const rim = new T.DirectionalLight(0x74aeff, 3.0);
  rim.position.set(5, 4, -5);
  scene.add(key, rim);

  const rig = new T.Group();
  scene.add(rig);
  const chassis = new T.MeshStandardMaterial({ color: 0xc9dcef, metalness: .32, roughness: .29 });
  const graphite = new T.MeshStandardMaterial({ color: 0x142339, metalness: .36, roughness: .35 });
  const cobalt = new T.MeshStandardMaterial({ color: 0x276ac3, metalness: .23, roughness: .31 });
  const optic = new T.MeshStandardMaterial({ color: 0x71dbff, emissive: 0x4fbcff, emissiveIntensity: .95 });
  const indicator = new T.MeshStandardMaterial({ color: 0xfcbd65, emissive: 0xe09124, emissiveIntensity: .55 });

  function shell(parent: T.Group, width: number, height: number, depth: number, radius: number, material: T.Material) {
    const part = new T.Mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material);
    parent.add(part);
    return part;
  }

  const console = new T.Group();
  console.position.set(-1.05, 1.6, .38);
  console.rotation.y = .19;
  console.rotation.x = -.055;
  rig.add(console);
  shell(console, 5.90, 2.99, .25, .14, chassis);
  shell(console, 5.75, 2.83, .14, .08, graphite).position.z = .13;
  const screen = new T.Mesh(
    new T.PlaneGeometry(5.59, 5.59 * 489 / 1024),
    new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
  );
  screen.position.z = .21;
  console.add(screen);

  const robot = new T.Group();
  robot.position.set(2.85, 1.0, -.02);
  rig.add(robot);
  shell(robot, 1.66, 1.29, 1.08, .26, graphite).position.y = -.25;
  shell(robot, 1.38, 1.18, 1.13, .29, chassis).position.y = -.13;
  shell(robot, .68, .32, .14, .08, graphite).position.set(0, -.11, .56);
  shell(robot, .41, .056, .12, .025, optic).position.set(0, -.11, .65);
  for (const side of [-1, 1]) {
    shell(robot, .31, .72, .49, .13, cobalt).position.set(side * .85, -.16, .03);
    shell(robot, .53, .29, .77, .12, graphite).position.set(side * .42, -.86, .11);
  }

  const head = new T.Group();
  head.position.set(0, 1.23, .11);
  robot.add(head);
  shell(head, 2.00, 1.20, .99, .30, chassis);
  shell(head, 1.69, .79, .24, .21, graphite).position.set(0, -.02, .44);
  for (const side of [-1, 1]) {
    shell(head, .22, .59, .50, .10, cobalt).position.set(side * .97, -.03, -.01);
    shell(head, .28, .18, .09, .064, optic).position.set(side * .37, .06, .57);
  }
  shell(head, .40, .045, .08, .02, optic).position.set(0, -.19, .57);
  shell(head, .083, .29, .08, .03, graphite).position.set(.56, .66, -.03);
  shell(head, .20, .12, .18, .065, indicator).position.set(.56, .83, -.03);

  const base = new T.Mesh(new T.CylinderGeometry(1.44, 1.52, .11, 48), graphite);
  base.position.set(2.83, -.08, .05);
  rig.add(base);
  const ring = new T.Mesh(new T.TorusGeometry(1.34, .016, 6, 72), optic);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(2.83, -.018, .05);
  rig.add(ring);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const loader = new T.TextureLoader();
  const textures = new Map<string, T.Texture>();
  let request = 0;
  let disposed = false;
  let visible = true;
  let lost = false;
  let ready = false;
  let paused = false;
  let pointerX = 0;
  let pointerY = 0;
  let enteredAt = -Infinity;
  let consoleRestingY = 1.57;

  const render = (now: number) => {
    if (disposed || lost) return;
    const animated = !motion.matches && !paused;
    const elapsed = Math.max(0, now - enteredAt);
    const entrance = animated ? (1 - Math.min(1, elapsed / 520)) ** 3 : 0;
    rig.rotation.set(animated ? pointerY * .035 : 0, animated ? pointerX * .11 : 0, 0);
    console.position.y = consoleRestingY + (animated ? .06 * Math.sin(now / 1800) : 0) - entrance * .20;
    head.rotation.y = animated ? -.22 + pointerX * .24 + .14 * Math.sin(now / 2100) : -.22;
    head.rotation.z = animated ? .035 * Math.sin(now / 1300) : 0;
    renderer.render(scene, camera);
  };
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height || lost) return;
    camera.aspect = width / height;
    const compact = camera.aspect < 1.52;
    // On tall stages the robot rises behind the monitor, keeping the scene
    // centred and visible without shrinking both objects to fit a wide row.
    consoleRestingY = compact ? 1.23 : 1.57;
    console.position.x = compact ? -.42 : -1.05;
    robot.position.set(compact ? 1.75 : 2.85, compact ? 2.04 : 1.0, compact ? -.48 : -.02);
    base.position.set(robot.position.x, robot.position.y - 1.08, robot.position.z);
    ring.position.set(robot.position.x, base.position.y + .062, robot.position.z);
    const centerY = compact ? 2.04 : 1.53;
    const distance = Math.max(compact ? 5.25 : 5.45, (compact ? 7.8 : 9.6) / camera.aspect)
      / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0, centerY + .29 + distance * .12, distance);
    camera.lookAt(0, centerY, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render(performance.now());
  };
  const sync = () => {
    renderer.setAnimationLoop(ready && !lost && visible && !document.hidden && !motion.matches && !paused ? render : null);
  };
  const pointer = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
  };
  const resetPointer = () => { pointerX = pointerY = 0; };
  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    sync();
    onReadyChange(false);
  };
  const contextRestored = () => {
    lost = false;
    resize();
    sync();
    onReadyChange(ready);
  };
  const changeMotion = () => { render(performance.now()); sync(); };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  host.append(renderer.domElement);
  host.addEventListener('pointermove', pointer);
  host.addEventListener('pointerleave', resetPointer);
  resizeObserver.observe(host);
  visibilityObserver.observe(host);
  motion.addEventListener('change', changeMotion);
  document.addEventListener('visibilitychange', sync);
  resize();

  return {
    async show(url: string) {
      const id = ++request;
      onReadyChange(false);
      try {
        let texture = textures.get(url);
        if (!texture) {
          texture = await loader.loadAsync(url);
          if (disposed || request !== id) {
            texture.dispose();
            return;
          }
          texture.colorSpace = T.SRGBColorSpace;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          textures.set(url, texture);
        }
        const image = texture.image;
        if (!(image instanceof HTMLImageElement) || image.height === 0) return;
        const aspect = image.width / image.height;
        const width = Math.min(5.59, 2.67 * aspect);
        screen.scale.set(width / 5.59, (width / aspect) / (5.59 * 489 / 1024), 1);
        screen.material.map = texture;
        screen.material.needsUpdate = true;
        ready = true;
        enteredAt = performance.now();
        render(enteredAt);
        sync();
        onReadyChange(!lost);
      } catch {
        if (!disposed && id === request) {
          ready = false;
          sync();
          onReadyChange(false);
        }
      }
    },
    setPaused(next: boolean) {
      paused = next;
      render(performance.now());
      sync();
    },
    dispose() {
      disposed = true;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      motion.removeEventListener('change', changeMotion);
      document.removeEventListener('visibilitychange', sync);
      host.removeEventListener('pointermove', pointer);
      host.removeEventListener('pointerleave', resetPointer);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      renderer.setAnimationLoop(null);
      scene.traverse(object => {
        if (object instanceof T.Mesh) {
          object.geometry.dispose();
        }
      });
      for (const material of [chassis, graphite, cobalt, optic, indicator, screen.material]) material.dispose();
      for (const texture of textures.values()) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
