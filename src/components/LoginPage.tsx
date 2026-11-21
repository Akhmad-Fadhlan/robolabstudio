import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Blocks, BookOpen, ChevronLeft, ChevronRight, Cpu, FolderOpen, LoaderCircle, Maximize2, Terminal, X, Zap } from 'lucide-react';
import robolabLogo from '../assets/robolab-logo-only.png';
import circuitImage from '../assets/showcase-circuit.png';
import blocksImage from '../assets/showcase-blocks.png';
import projectsImage from '../assets/showcase-projects.webp';
import learningImage from '../assets/showcase-learning.webp';
import workspaceImage from '../assets/showcase-workspace.webp';
import './LoginPage.css';

const previews = [
  { image: circuitImage, label: 'Simulator', title: 'Coba rangkaianmu', description: 'Pasang komponen dan amati hasil simulasi ESP32.', alt: 'Simulator rangkaian dan board ESP32 di RoboLab Studio', icon: Zap },
  { image: blocksImage, label: 'Blockly', title: 'Susun blok kodenya', description: 'Rangkai blok visual dan lihat kode yang dihasilkan.', alt: 'Editor Blockly dan panel kode di RoboLab Studio', icon: Blocks },
  { image: projectsImage, label: 'Proyek', title: 'Pilih proyek pertamamu', description: 'Jelajahi contoh proyek, dari dimmer LED hingga pemindai rintangan.', alt: 'Katalog proyek di RoboLab Studio', icon: FolderOpen },
  { image: learningImage, label: 'Belajar', title: 'Belajar langkah demi langkah', description: 'Ikuti materi Python dan MicroPython dengan contoh kode.', alt: 'Portal pembelajaran Python dan MicroPython', icon: BookOpen },
  { image: workspaceImage, label: 'Workspace', title: 'Mulai proyek sendiri', description: 'Buat file baru atau buka proyek untuk melanjutkan eksperimen.', alt: 'Workspace untuk membuat atau membuka proyek', icon: Terminal },
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
  const current = previews[selected];
  const selectedImage = useRef(current.image);
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const startTouch = useRef<{ x: number; y: number } | null>(null);

  function selectPreview(index: number) {
    const next = (index + previews.length) % previews.length;
    if (next === selected) return;
    selectedImage.current = previews[next].image;
    setSelected(next);
    void showcase.current?.show(selectedImage.current);
  }

  useEffect(() => {
    const host = scene.current;
    if (!host) return;
    let active = true;

    void import('./loginShowcaseScene').then(({ mountLoginShowcase }) => {
      if (!active) return;
      showcase.current = mountLoginShowcase(host, setReady);
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
          <div className="rl-login__brand">
            <img src={robolabLogo} alt="" width="50" height="50" />
            <div><strong>RoboLab Studio</strong><span>PyMasterclass Indonesia</span></div>
          </div>

          <div className="rl-login__content">
            <h1 id="rl-login-title">Ayo bikin<br /><em>robotmu!</em></h1>
            <p>Susun blok, coba rangkaian, dan lihat robotmu beraksi.</p>
            <button id="btn-google-signin" className="rl-login__signin" type="button"
              disabled={loading} aria-busy={!!loading} onClick={() => void onSignIn()}>
              {loading ? <LoaderCircle className="rl-login__spinner" size={22} aria-hidden="true" /> : <GoogleIcon size={22} />}
              <span>{loading ? 'Menghubungkan ke Google…' : 'Lanjutkan dengan Google'}</span>
              {!loading && <ArrowRight size={19} aria-hidden="true" />}
            </button>
            {error && <p className="rl-login__error" role="alert">{error}</p>}
            <p className="rl-login__account">Gunakan akun belajar.id atau akun Google pribadi.</p>
          </div>

          <ul className="rl-login__features" aria-label="Aktivitas di RoboLab Studio">
            <li><Blocks size={17} aria-hidden="true" /> Coding blok</li>
            <li><Zap size={17} aria-hidden="true" /> Simulasi sirkuit</li>
            <li><Cpu size={17} aria-hidden="true" /> Arduino &amp; ESP32</li>
          </ul>
        </section>

        <section className="rl-login__lab" aria-label="Pratinjau RoboLab Studio">
          <div className="rl-login__grid" aria-hidden="true" />
          <div className="rl-login__orbit" aria-hidden="true" />
          <div className="rl-login__orbit rl-login__orbit--outer" aria-hidden="true" />
          <h2 className="rl-login__preview-title">{current.title}</h2>
          <div className="rl-login__stage"
            onTouchStart={event => {
              const touch = event.touches[0];
              startTouch.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={event => {
              const start = startTouch.current;
              startTouch.current = null;
              if (!start) return;
              const touch = event.changedTouches[0];
              const dx = touch.clientX - start.x;
              if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(touch.clientY - start.y)) {
                selectPreview(selected + (dx < 0 ? 1 : -1));
              }
            }}
            onTouchCancel={() => { startTouch.current = null; }}>
            <img className={ready ? 'rl-login__preview-image is-textured' : 'rl-login__preview-image'}
              src={current.image} alt={current.alt} width="1024" height="489" />
            <div className="rl-login__scene" ref={scene} aria-hidden="true" data-ready={ready} />
          </div>
          <div className="rl-login__browse" onKeyDown={event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            selectPreview(selected + (event.key === 'ArrowLeft' ? -1 : 1));
          }}>
            <p className="rl-login__preview-description" aria-live="polite">{current.description}</p>
            <div className="rl-login__tools">
              <button type="button" aria-label="Fitur sebelumnya" onClick={() => selectPreview(selected - 1)}><ChevronLeft size={19} /></button>
              <span aria-label={`Fitur ${selected + 1} dari ${previews.length}`}>{selected + 1} / {previews.length}</span>
              <button type="button" aria-label="Fitur berikutnya" onClick={() => selectPreview(selected + 1)}><ChevronRight size={19} /></button>
              <button type="button" onClick={() => dialog.current?.showModal()}><Maximize2 size={15} aria-hidden="true" /> Perbesar</button>
            </div>
            <div className="rl-login__switcher" role="group" aria-label="Pilih halaman pratinjau">
              {previews.map(({ label, icon: Icon }, index) => (
                <button key={label} type="button" aria-pressed={selected === index} onClick={() => selectPreview(index)}>
                  <Icon size={16} aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </div>
          <dialog ref={dialog} className="rl-login__zoom" aria-label={current.label}>
            <header><strong>{current.label}</strong><button type="button" aria-label="Tutup pratinjau" onClick={() => dialog.current?.close()}><X size={21} /></button></header>
            <img src={current.image} alt={current.alt} />
          </dialog>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
