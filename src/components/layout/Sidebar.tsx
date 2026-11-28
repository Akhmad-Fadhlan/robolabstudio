import React, { useEffect, useRef, useState } from 'react';
import { Home, BookOpen, Monitor, FolderOpen, PlayCircle, Settings, HelpCircle } from 'lucide-react';
import type { LangCode } from '../../i18n';
import { t } from '../../i18n';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: 'home' | 'ide' | 'learning' | 'packages' | 'settings' | 'simulator') => void;
  workspaceMode: string;
  setWorkspaceMode: (mode: 'split' | 'code' | 'blockly') => void;
  level: number;
  showExplorer?: boolean;
  setShowExplorer?: React.Dispatch<React.SetStateAction<boolean>>;
  language?: LangCode;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  themeMode?: 'light' | 'dark';
  themeColor?: 'red' | 'sky' | 'cyan' | 'emerald' | 'pink' | 'purple' | 'amber';
}

const THEME_PALETTES: Record<
  NonNullable<SidebarProps['themeColor']>,
  { primary: number; secondary: number; glow: string; lightBg: string }
> = {
  red: { primary: 0xef4444, secondary: 0xf97316, glow: 'rgba(239,68,68,0.45)', lightBg: '#fee2e2' },
  sky: { primary: 0x0ea5e9, secondary: 0x38bdf8, glow: 'rgba(14,165,233,0.45)', lightBg: '#e0f2fe' },
  cyan: { primary: 0x06b6d4, secondary: 0x22d3ee, glow: 'rgba(6,182,212,0.45)', lightBg: '#cffafe' },
  emerald: { primary: 0x10b981, secondary: 0x34d399, glow: 'rgba(16,185,129,0.45)', lightBg: '#d1fae5' },
  pink: { primary: 0xec4899, secondary: 0xf472b6, glow: 'rgba(236,72,153,0.45)', lightBg: '#fce7f3' },
  purple: { primary: 0x8b5cf6, secondary: 0xa855f7, glow: 'rgba(139,92,246,0.45)', lightBg: '#ede9fe' },
  amber: { primary: 0xf59e0b, secondary: 0xfbbf24, glow: 'rgba(245,158,11,0.45)', lightBg: '#fef3c7' },
};

/**
 * Interactive Three.js 3D Holographic Core & Orbital Ring Emblem for the Sidebar Header
 */
function SidebarThreeEmblem({
  themeColor = 'sky',
  isDark = false,
  activeIndex = 0,
}: {
  themeColor: NonNullable<SidebarProps['themeColor']>;
  isDark: boolean;
  activeIndex: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const materialsRef = useRef<{
    coreMat?: any;
    ringMatA?: any;
    ringMatB?: any;
    keyLight?: any;
  }>({});
  const targetSpinRef = useRef(0);

  // Boost spin impulse whenever active tab changes
  useEffect(() => {
    targetSpinRef.current += 1.6;
  }, [activeIndex]);

  // Update Three.js materials dynamically when themeColor or themeMode changes
  useEffect(() => {
    const palette = THEME_PALETTES[themeColor] || THEME_PALETTES.sky;
    const mats = materialsRef.current;
    if (mats.coreMat) {
      mats.coreMat.color.setHex(palette.primary);
      mats.coreMat.emissive.setHex(palette.primary);
      mats.coreMat.emissiveIntensity = isDark ? 0.55 : 0.35;
    }
    if (mats.ringMatA) {
      mats.ringMatA.color.setHex(palette.secondary);
      mats.ringMatA.emissive.setHex(palette.secondary);
    }
    if (mats.ringMatB) {
      mats.ringMatB.color.setHex(isDark ? 0xe2e8f0 : 0x334155);
    }
    if (mats.keyLight) {
      mats.keyLight.color.setHex(palette.secondary);
    }
  }, [themeColor, isDark, ready]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let disposeFn: (() => void) | undefined;

    void import('three')
      .then((THREE) => {
        if (cancelled || !host) return;
        const palette = THEME_PALETTES[themeColor] || THEME_PALETTES.sky;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.setSize(48, 48, false);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20);
        camera.position.set(0, 0, 4.4);

        const ambient = new THREE.AmbientLight(0xffffff, 1.6);
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
        dirLight.position.set(3, 4, 5);
        const keyLight = new THREE.PointLight(palette.secondary, 3.2, 12);
        keyLight.position.set(-2.5, -2, 3);
        scene.add(ambient, dirLight, keyLight);

        const group = new THREE.Group();
        scene.add(group);

        // 1. Faceted Holographic Icosahedron Core
        const coreGeo = new THREE.IcosahedronGeometry(0.78, 0);
        const coreMat = new THREE.MeshStandardMaterial({
          color: palette.primary,
          emissive: palette.primary,
          emissiveIntensity: isDark ? 0.55 : 0.35,
          roughness: 0.18,
          metalness: 0.72,
          flatShading: true,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // 2. Wireframe Outer Energy Cage
        const cageGeo = new THREE.IcosahedronGeometry(0.96, 0);
        const cageMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: isDark ? 0.28 : 0.38,
        });
        const cageMesh = new THREE.Mesh(cageGeo, cageMat);
        group.add(cageMesh);

        // 3. Outer Gyroscopic Orbital Ring A
        const ringGeoA = new THREE.TorusGeometry(1.24, 0.055, 12, 42);
        const ringMatA = new THREE.MeshStandardMaterial({
          color: palette.secondary,
          emissive: palette.secondary,
          emissiveIntensity: 0.45,
          roughness: 0.22,
          metalness: 0.85,
        });
        const ringMeshA = new THREE.Mesh(ringGeoA, ringMatA);
        ringMeshA.rotation.x = Math.PI * 0.35;
        group.add(ringMeshA);

        // 4. Inner Tilted Metallic Ring B
        const ringGeoB = new THREE.TorusGeometry(1.08, 0.038, 10, 36);
        const ringMatB = new THREE.MeshStandardMaterial({
          color: isDark ? 0xe2e8f0 : 0x334155,
          roughness: 0.25,
          metalness: 0.9,
        });
        const ringMeshB = new THREE.Mesh(ringGeoB, ringMatB);
        ringMeshB.rotation.y = Math.PI * 0.35;
        group.add(ringMeshB);

        materialsRef.current = { coreMat, ringMatA, ringMatB, keyLight };

        let pointerX = 0;
        let pointerY = 0;
        const onPointerMove = (e: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          pointerX = ((e.clientX - (rect.left + rect.width / 2)) / 120);
          pointerY = ((e.clientY - (rect.top + rect.height / 2)) / 120);
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });

        let raf = 0;
        let spinBoost = 0;
        const animate = (time: number) => {
          const tSec = time * 0.001;
          spinBoost += (targetSpinRef.current - spinBoost) * 0.08;

          coreMesh.rotation.y = tSec * 0.9 + spinBoost;
          coreMesh.rotation.x = tSec * 0.55 + pointerY * 0.25;
          cageMesh.rotation.y = -tSec * 0.45 - spinBoost * 0.5;
          cageMesh.rotation.z = tSec * 0.35;

          ringMeshA.rotation.z = tSec * 1.1 + spinBoost * 0.7;
          ringMeshA.rotation.x = Math.PI * 0.34 + Math.sin(tSec * 1.3) * 0.22 + pointerY * 0.2;

          ringMeshB.rotation.x = -tSec * 0.85;
          ringMeshB.rotation.y = Math.PI * 0.34 + Math.cos(tSec * 1.1) * 0.25 + pointerX * 0.2;

          group.position.y = Math.sin(tSec * 2.1) * 0.08;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(animate);
        };

        host.innerHTML = '';
        host.appendChild(renderer.domElement);
        setReady(true);
        raf = requestAnimationFrame(animate);

        disposeFn = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('pointermove', onPointerMove);
          coreGeo.dispose();
          coreMat.dispose();
          cageGeo.dispose();
          cageMat.dispose();
          ringGeoA.dispose();
          ringMatA.dispose();
          ringGeoB.dispose();
          ringMatB.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      disposeFn?.();
    };
  }, []);

  return (
    <div
      className="relative w-11 h-11 2xl:w-12 2xl:h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-110 cursor-pointer group"
      style={{
        background: isDark
          ? 'radial-gradient(circle at 30% 25%, rgba(var(--accent-rgb), 0.35), rgba(15, 23, 42, 0.92))'
          : 'radial-gradient(circle at 30% 25%, rgba(var(--accent-rgb), 0.26), rgba(255, 255, 255, 0.96))',
        border: '1.5px solid rgba(var(--accent-rgb), 0.5)',
        boxShadow: isDark
          ? '0 8px 22px -4px rgba(var(--accent-rgb), 0.45), inset 0 1px 2px rgba(255,255,255,0.25)'
          : '0 8px 20px -4px rgba(var(--accent-rgb), 0.32), inset 0 1px 2px rgba(255,255,255,0.9)',
      }}
      title="RoboLab 3D Core Engine"
    >
      {!ready && (
        <img src="./icon-only.png" alt="RoboLab" className="w-6 h-6 object-contain" />
      )}
      <div
        ref={hostRef}
        className="absolute inset-0 flex items-center justify-center [&_canvas]:w-full [&_canvas]:h-full"
      />
      {/* Subtle 3D specular top rim reflection */}
      <div
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-2 rounded-full opacity-50"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.65), transparent)',
        }}
      />
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  workspaceMode: _workspaceMode,
  setWorkspaceMode: _setWorkspaceMode,
  level: _level,
  showExplorer = true,
  setShowExplorer,
  language = 'id',
  onOpenSettings,
  onOpenHelp,
  themeMode = 'light',
  themeColor = 'sky',
}) => {
  const isDark = themeMode === 'dark';
  const sb = (key: string) => t(language, 'sidebar', key);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const navItems: Array<{
    id: string;
    label: string;
    title: string;
    isActive: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: 'home',
      label: 'Home',
      title: sb('dashboardHome'),
      isActive: currentTab === 'home',
      icon: <Home className="w-[19px] h-[19px]" />,
      onClick: () => setCurrentTab('home'),
    },
    {
      id: 'packages',
      label: 'Library',
      title: sb('packageManager'),
      isActive: currentTab === 'packages',
      icon: <BookOpen className="w-[19px] h-[19px]" />,
      onClick: () => setCurrentTab('packages'),
    },
    {
      id: 'ide',
      label: 'Project',
      title: sb('fileExplorer'),
      isActive: currentTab === 'ide' && showExplorer,
      icon: <FolderOpen className="w-[19px] h-[19px]" />,
      onClick: () => {
        if (currentTab !== 'ide') {
          setCurrentTab('ide');
          if (setShowExplorer) setShowExplorer(true);
        } else if (setShowExplorer) {
          setShowExplorer((prev) => !prev);
        }
      },
    },
    {
      id: 'simulator',
      label: 'Arena',
      title: sb('hardwareSimulator'),
      isActive: currentTab === 'simulator',
      icon: <Monitor className="w-[19px] h-[19px]" />,
      onClick: () => setCurrentTab('simulator'),
    },
    {
      id: 'learning',
      label: 'Tutorial',
      title: sb('learningPortal'),
      isActive: currentTab === 'learning',
      icon: <PlayCircle className="w-[19px] h-[19px]" />,
      onClick: () => setCurrentTab('learning'),
    },
  ];

  const activeNavIndex = Math.max(
    0,
    navItems.findIndex((item) => item.isActive)
  );

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="lab-surface relative z-40 flex w-full shrink-0 select-none flex-col justify-between overflow-hidden rounded-2xl border px-1.5 py-1 md:w-[70px] 2xl:w-[82px] md:rounded-[1.35rem] md:px-2 2xl:px-2.5 md:py-2.5 2xl:py-3.5 transition-all duration-300"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, rgba(13, 17, 28, 0.94) 0%, rgba(7, 10, 18, 0.97) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.94) 100%)',
        borderColor: isDark
          ? 'rgba(var(--accent-rgb), 0.28)'
          : 'var(--theme-border, rgba(186, 230, 253, 0.9))',
        boxShadow: isDark
          ? '0 16px 40px -10px rgba(0, 0, 0, 0.75), 0 0 24px -6px rgba(var(--accent-rgb), 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 14px 34px -10px rgba(var(--accent-rgb), 0.18), 0 4px 12px -4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      }}
    >
      {/* Ambient Theme-Synced 3D Top & Bottom Light Halos */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full blur-2xl opacity-45 hidden md:block"
        style={{ background: 'var(--accent-primary)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-14 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-25 hidden md:block"
        style={{ background: 'var(--accent-primary)' }}
      />

      {/* ── Top Navigation Links + Live Three.js 3D Emblem ── */}
      <div className="lab-nav-links relative z-10 flex w-full items-center gap-1 overflow-x-auto md:flex-col md:gap-2 md:overflow-visible">
        {/* Live Interactive Three.js 3D Core Emblem */}
        <div
          onClick={() => setCurrentTab('home')}
          className="mb-1 hidden md:flex flex-col items-center"
        >
          <SidebarThreeEmblem
            themeColor={themeColor}
            isDark={isDark}
            activeIndex={activeNavIndex}
          />
        </div>

        {/* Main 5 Navigation Buttons with 3D Tactile Depth & Glowing Active Pill */}
        {navItems.map((item) => {
          const isHovered = hoveredId === item.id;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={item.title}
              className={`relative w-full flex flex-col items-center justify-center py-1.5 2xl:py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'text-white scale-[1.03]'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              style={
                isActive
                  ? {
                      background: 'var(--accent-gradient)',
                      boxShadow: isDark
                        ? '0 8px 20px -4px rgba(var(--accent-rgb), 0.55), inset 0 1.5px 1px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.25)'
                        : '0 8px 18px -4px rgba(var(--accent-rgb), 0.42), inset 0 1.5px 1px rgba(255, 255, 255, 0.45), inset 0 -2px 3px rgba(0, 0, 0, 0.15)',
                      transform: 'perspective(320px) translateZ(6px)',
                    }
                  : isHovered
                  ? {
                      background: isDark
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(var(--accent-rgb), 0.14))'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(var(--accent-rgb), 0.12))',
                      boxShadow: isDark
                        ? '0 6px 14px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
                        : '0 6px 14px -4px rgba(var(--accent-rgb), 0.18), inset 0 1px 0 rgba(255,255,255,1)',
                      borderColor: 'rgba(var(--accent-rgb), 0.3)',
                    }
                  : undefined
              }
            >
              {/* Left Glowing 3D Indicator Bar on Desktop */}
              {isActive && (
                <span
                  className="hidden md:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_10px_#ffffff]"
                />
              )}

              {/* 3D Specular Top Sheen on Active Button */}
              {isActive && (
                <span
                  className="pointer-events-none absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl opacity-35"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.8), transparent)',
                  }}
                />
              )}

              <div
                className={`p-1 rounded-xl transition-transform duration-200 ${
                  isActive
                    ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]'
                    : 'group-hover:scale-110 group-hover:-translate-y-0.5'
                }`}
                style={
                  !isActive && isHovered
                    ? { color: 'var(--accent-primary)' }
                    : undefined
                }
              >
                {item.icon}
              </div>
              <span
                className={`text-[10px] font-extrabold mt-0.5 tracking-tight leading-tight ${
                  isActive ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Glowing Divider */}
        <div
          className="my-1 hidden h-px w-10 md:block"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.45), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.35), transparent)',
          }}
        />

        {/* 6. Settings */}
        <button
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
            else setCurrentTab('settings');
          }}
          onMouseEnter={() => setHoveredId('settings')}
          onMouseLeave={() => setHoveredId(null)}
          className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer group ${
            isDark
              ? 'hover:bg-white/[0.07] text-slate-400 hover:text-white'
              : 'hover:bg-slate-100/90 text-slate-500 hover:text-slate-900'
          }`}
          style={
            hoveredId === 'settings'
              ? {
                  boxShadow: isDark
                    ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 4px 10px rgba(var(--accent-rgb), 0.14)',
                }
              : undefined
          }
          title={sb('settings')}
        >
          <div
            className="p-1 rounded-xl transition-transform duration-300 group-hover:rotate-90"
            style={hoveredId === 'settings' ? { color: 'var(--accent-primary)' } : undefined}
          >
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-bold mt-0.5 leading-tight">
            Setting
          </span>
        </button>

        {/* 7. Help */}
        <button
          onClick={() => {
            if (onOpenHelp) onOpenHelp();
          }}
          onMouseEnter={() => setHoveredId('help')}
          onMouseLeave={() => setHoveredId(null)}
          className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer group ${
            isDark
              ? 'hover:bg-white/[0.07] text-slate-400 hover:text-white'
              : 'hover:bg-slate-100/90 text-slate-500 hover:text-slate-900'
          }`}
          style={
            hoveredId === 'help'
              ? {
                  boxShadow: isDark
                    ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 4px 10px rgba(var(--accent-rgb), 0.14)',
                }
              : undefined
          }
          title={sb('documentation')}
        >
          <div
            className="p-1 rounded-xl transition-transform duration-200 group-hover:scale-110"
            style={hoveredId === 'help' ? { color: 'var(--accent-primary)' } : undefined}
          >
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-bold mt-0.5 leading-tight">
            Help
          </span>
        </button>
      </div>

      {/* ── Bottom 3D Glassmorphic RoboBuddy Badge ── */}
      <div className="relative z-10 hidden w-full flex-col items-center justify-center pt-2 md:flex">
        <div
          onClick={() => setCurrentTab('learning')}
          className="relative w-10 h-10 2xl:w-11 2xl:h-11 rounded-2xl border flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 cursor-pointer group"
          style={{
            background: isDark
              ? 'linear-gradient(145deg, rgba(var(--accent-rgb), 0.22), rgba(15, 23, 42, 0.9))'
              : 'var(--theme-pill-bg, #e0f2fe)',
            borderColor: isDark
              ? 'rgba(var(--accent-rgb), 0.45)'
              : 'var(--theme-pill-border, #bae6fd)',
            boxShadow: isDark
              ? '0 6px 16px -3px rgba(var(--accent-rgb), 0.35), inset 0 1px 1px rgba(255,255,255,0.2)'
              : '0 6px 14px -3px rgba(var(--accent-rgb), 0.22), inset 0 1px 1px rgba(255,255,255,0.9)',
          }}
          title="RoboBuddy - Klik untuk Buka Portal Belajar Robotika"
        >
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="4" r="1.5" fill="#f59e0b" />
            <line x1="12" y1="5.5" x2="12" y2="7.5" stroke="var(--accent-primary, #0284c7)" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="5" y="7.5" width="14" height="11" rx="3" fill="#ffffff" stroke="var(--accent-primary, #0284c7)" strokeWidth="1.5" />
            <rect x="7.5" y="9.5" width="9" height="5" rx="1.5" fill="#0f172a" />
            <circle cx="9.5" cy="12" r="1.1" fill="var(--accent-primary, #38bdf8)" />
            <circle cx="14.5" cy="12" r="1.1" fill="var(--accent-primary, #38bdf8)" />
            <path d="M10 16 Q12 17.5 14 16" stroke="var(--accent-primary, #0284c7)" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="8" y="19" width="2.5" height="2" rx="0.5" fill="var(--accent-primary, #0284c7)" />
            <rect x="13.5" y="19" width="2.5" height="2" rx="0.5" fill="var(--accent-primary, #0284c7)" />
          </svg>
        </div>
      </div>
    </aside>
  );
};
