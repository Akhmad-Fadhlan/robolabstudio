import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mountLoginShowcase(host: HTMLElement, onReadyChange: (ready: boolean) => void) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 60);
  scene.add(new T.HemisphereLight(0xf2faff, 0x105389, 2.5));
  const light = new T.DirectionalLight(0xffffff, 2.3);
  light.position.set(-3, 5, 4);
  scene.add(light);

  const display = new T.Group();
  scene.add(display);
  const frame = new T.Mesh(
    new RoundedBoxGeometry(6.12, 3.12, .23, 4, .10),
    new T.MeshStandardMaterial({ color: 0x6cc8ff, roughness: .42 }),
  );
  display.add(frame);
  const screen = new T.Mesh(
    new T.PlaneGeometry(5.88, 5.88 * 489 / 1024),
    new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
  );
  screen.position.z = .118;
  display.add(screen);

  const head = new T.Group();
  head.position.set(0, 2.15, -.42);
  display.add(head);

  function part(parent: T.Group, size: [number, number, number], position: [number, number, number], color: number, radius: number) {
    const mesh = new T.Mesh(
      new RoundedBoxGeometry(...size, 4, radius),
      new T.MeshStandardMaterial({ color, roughness: .34 }),
    );
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  const porcelain = 0xe5f5ff;
  const ocean = 0x167bbb;
  const visor = 0x102c46;
  part(head, [2.38, 1.26, .76], [0, 0, 0], porcelain, .32);
  part(head, [1.98, .85, .23], [0, .01, .35], visor, .25);
  part(head, [.36, .08, .08], [0, -.18, .48], 0x63e6ff, .035);
  part(head, [.1, .29, .1], [.66, .69, 0], ocean, .04);
  part(head, [.23, .23, .23], [.66, .87, 0], 0xffbe49, .11);
  part(display, [3.25, 1.65, .68], [0, 1.06, -.85], ocean, .4);
  for (const side of [-1, 1]) {
    part(head, [.23, .3, .11], [side * .49, .09, .46], 0x96edff, .1);
    part(head, [.24, .55, .48], [side * 1.16, 0, -.04], ocean, .1);
    const arm = part(display, [2.05, .46, .46], [side * 2.37, 1.09, -.53], porcelain, .2);
    arm.rotation.z = -side * .3;
    part(display, [.48, .71, .62], [side * 3.18, .82, -.02], ocean, .18);
    for (const y of [.67, .91]) {
      part(display, [.32, .19, .28], [side * 3.17, y, .21], porcelain, .08);
    }
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const loader = new T.TextureLoader();
  const textures = new Map<string, T.Texture>();
  let request = 0;
  let disposed = false;
  let visible = true;
  let lost = false;
  let ready = false;
  let pointerX = 0;
  let pointerY = 0;
  let enteredAt = -Infinity;

  const render = (now: number) => {
    if (disposed || lost) return;
    const animated = !motion.matches;
    const elapsed = Math.max(0, now - enteredAt);
    const entrance = animated ? (1 - Math.min(1, elapsed / 420)) ** 3 : 0;
    display.rotation.set(
      animated ? pointerY * .045 : 0,
      animated ? pointerX * .07 + entrance * .12 : 0,
      0,
    );
    display.position.z = -entrance * .6;
    head.rotation.z = animated ? .035 * Math.sin(now / 1300) : 0;
    renderer.render(scene, camera);
  };
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height || lost) return;
    camera.aspect = width / height;
    camera.position.set(0, .73, Math.max(5.18, 7.4 / camera.aspect) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render(performance.now());
  };
  const sync = () => {
    renderer.setAnimationLoop(ready && !lost && visible && !document.hidden && !motion.matches ? render : null);
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
        const width = Math.min(6.04, 3.03 * aspect);
        screen.scale.set(width / 5.88, (width / aspect) / (5.88 * 489 / 1024), 1);
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
          object.material.dispose();
        }
      });
      for (const texture of textures.values()) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
