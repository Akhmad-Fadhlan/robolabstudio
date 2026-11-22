import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Blocks, BookOpen, FolderOpen, LoaderCircle, Pause, Play, Terminal, Zap } from 'lucide-react';
import robolabLogo from '../assets/robolab-logo-only.png';
import circuitImage from '../assets/showcase-circuit.png';
import blocksImage from '../assets/showcase-blocks.png';
import projectsImage from '../assets/showcase-projects.webp';
import learningImage from '../assets/showcase-learning.webp';
import workspaceImage from '../assets/showcase-workspace.webp';
import './LoginPage.css';

const previews = [
  { image: learningImage, label: 'Belajar', title: 'Materi interaktif', description: 'Pelajari Python dan MicroPython dengan contoh yang bisa langsung dicoba.', alt: 'Portal pembelajaran Python dan MicroPython', icon: BookOpen },
  { image: projectsImage, label: 'Proyek', title: 'Katalog proyek', description: 'Buka proyek siap pakai, dari kontrol LED hingga pemindai rintangan.', alt: 'Katalog proyek di RoboLab Studio', icon: FolderOpen },
  { image: blocksImage, label: 'Blockly', title: 'Editor blok dan kode', description: 'Susun blok dan lihat kode yang dihasilkan di panel editor.', alt: 'Editor Blockly dan panel kode di RoboLab Studio', icon: Blocks },
  { image: circuitImage, label: 'Simulator', title: 'Simulasi rangkaian', description: 'Rakit dan uji rangkaian ESP32 secara virtual sebelum mencoba perangkat fisik.', alt: 'Simulator rangkaian dan board ESP32 di RoboLab Studio', icon: Zap },
  { image: workspaceImage, label: 'Workspace', title: 'Workspace proyek', description: 'Buat berkas atau lanjutkan proyek dari editor.', alt: 'Workspace untuk membuat atau membuka proyek', icon: Terminal },
] as const;

interface LoginPageProps {
  onSignIn: () => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function LoginPage({ onSignIn, error, loading }: LoginPageProps) {
  const scene = useRef<HTMLDivElement>(null);
  const showcase = useRef<ReturnType<typeof import('./loginShowcaseScene').mountLoginShowcase> | null>(null);
  const [selected, setSelected] = useState(0);
  const motionPaused = useRef(false);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const current = previews[selected];
  useEffect(() => {
    motionPaused.current = paused;
    showcase.current?.setPaused(paused);
  }, [paused]);
  const selectedImage = useRef(current.image);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !document.querySelector('.rl-login__tabs:focus-within')) {
        setSelected(index => (index + 1) % previews.length);
      }
    }, 7200);
    return () => window.clearInterval(timer);
  }, [paused, selected]);

  useEffect(() => {
    selectedImage.current = current.image;
    void showcase.current?.show(current.image);
  }, [current.image]);

  useEffect(() => {
    const host = scene.current;
    if (!host) return;
    let active = true;

    void import('./loginShowcaseScene').then(({ mountLoginShowcase }) => {
      if (!active) return;
      showcase.current = mountLoginShowcase(host, setReady);
      showcase.current.setPaused(motionPaused.current);
      void showcase.current.show(selectedImage.current);
    }).catch(() => {
      if (active) setReady(false);
    });

    return () => {
      active = false;
      showcase.current?.dispose();
      showcase.current = null;
    };
  }, []);

  return (
    <main className="rl-login">
      <div className="rl-login__layout">
        <section className="rl-login__auth" aria-labelledby="rl-login-title">
          <header className="rl-login__brand">
            <img src={robolabLogo} alt="" width="48" height="48" />
            <div><strong>RoboLab Studio</strong><span>PyMasterclass Indonesia</span></div>
          </header>

          <div className="rl-login__content">
            <h1 id="rl-login-title">Ruang kerja<br />{' '}untuk <em>robotika.</em></h1>
            <p>Tulis kode, susun blok, dan uji rangkaian di satu tempat.</p>
            <button id="btn-google-signin" className="rl-login__signin" type="button"
              disabled={loading} aria-busy={!!loading} onClick={() => void onSignIn()}>
              {loading ? <LoaderCircle className="rl-login__spinner" size={21} aria-hidden="true" /> : <GoogleIcon size={21} />}
              <span>{loading ? 'Menghubungkan ke Google…' : 'Lanjutkan dengan Google'}</span>
              {!loading && <ArrowRight size={18} aria-hidden="true" />}
            </button>
            {error && <p className="rl-login__error" role="alert">{error}</p>}
            <p className="rl-login__account">Masuk dengan akun belajar.id atau Google pribadi.</p>
          </div>
        </section>

        <section className="rl-login__lab" aria-labelledby="rl-login-preview-title">
          <div className="rl-login__showcase">
            <div className="rl-login__chapter">
              <h2 id="rl-login-preview-title">{current.title}</h2>
              <p>{current.description}</p>
            </div>
            <div className="rl-login__stage">
              <img className={ready ? 'rl-login__preview-image is-textured' : 'rl-login__preview-image'}
                src={current.image} alt={current.alt} width="1024" height="489" />
              <div className="rl-login__scene" ref={scene} aria-hidden="true" data-ready={ready} />
            </div>
            <div className="rl-login__controls">
              <nav className="rl-login__tabs" aria-label="Pratinjau fitur">
                {previews.map((item, i) => {
                  const Icon = item.icon;
                  return <button key={item.label} type="button" aria-pressed={i === selected}
                    onClick={() => { setPaused(true); setSelected(i); }}>
                    <Icon size={15} aria-hidden="true" /><span>{item.label}</span>
                  </button>;
                })}
              </nav>
              <button type="button" className="rl-login__motion" aria-label={paused ? 'Putar pratinjau otomatis' : 'Jeda pratinjau otomatis'}
                onClick={() => setPaused(value => !value)}>
                {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
