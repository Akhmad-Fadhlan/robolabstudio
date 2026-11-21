import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mountLoginShowcase(host: HTMLElement, onReadyChange: (ready: boolean) => void) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 60);
  scene.add(new T.HemisphereLight(0xf7efff, 0x4d2479, 2.5));
  const light = new T.DirectionalLight(0xffffff, 2.3);
  light.position.set(-3, 5, 4);
  scene.add(light);

  const display = new T.Group();
  scene.add(display);
  const frame = new T.Mesh(
    new RoundedBoxGeometry(6.12, 3.12, .23, 4, .10),
    new T.MeshStandardMaterial({ color: 0xb397f5, roughness: .42 }),
  );
  display.add(frame);
  const screen = new T.Mesh(
    new T.PlaneGeometry(5.88, 5.88 * 489 / 1024),
    new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
  );
  screen.position.z = .118;
  display.add(screen);

  const pieces = [
    new T.Mesh(new RoundedBoxGeometry(.49, .49, .49, 3, .10), new T.MeshStandardMaterial({ color: 0xffc757 })),
    new T.Mesh(new T.TorusGeometry(.27, .089, 10, 30), new T.MeshStandardMaterial({ color: 0xff82bf })),
    new T.Mesh(new T.OctahedronGeometry(.26), new T.MeshStandardMaterial({ color: 0x73f1d4 })),
  ];
  const positions = [[-2.44, 1.95, .28], [2.59, -1.91, .45], [2.55, 1.96, -.25]];
  pieces.forEach((piece, i) => {
    piece.position.set(positions[i][0], positions[i][1], positions[i][2]);
    scene.add(piece);
  });

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

  const render = (now: number) => {
    if (disposed || lost) return;
    const t = motion.matches ? 0 : now / 1000;
    display.rotation.set(.025 + (motion.matches ? 0 : pointerY * .09), -.065 + (motion.matches ? 0 : pointerX * .16), -.035);
    display.position.y = Math.sin(t * 1.7) * .08;
    for (const [i, piece] of pieces.entries()) {
      piece.rotation.set(.4 + t * .35, .7 + t * .44, .15 + i * .45);
      piece.position.y = positions[i][1] + Math.sin(t * 1.8 + i) * .12;
    }
    renderer.render(scene, camera);
  };
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height || lost) return;
    camera.aspect = width / height;
    camera.position.set(0, 0, Math.max(4.55, 6.75 / camera.aspect) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))));
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
        const aspect = texture.image.width / texture.image.height;
        const width = Math.min(5.88, 2.81 * aspect);
        screen.scale.set(width / 5.88, (width / aspect) / (5.88 * 489 / 1024), 1);
        screen.material.map = texture;
        screen.material.needsUpdate = true;
        ready = true;
        render(performance.now());
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
