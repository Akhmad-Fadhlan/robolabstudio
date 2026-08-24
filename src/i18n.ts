// RoboLab Studio — i18n Translation System
// 4 languages: Arabic (ar), Malay (ms), Indonesian (id), English (en)

export type LangCode = 'ar' | 'ms' | 'id' | 'en';

export interface LangMeta {
  code: LangCode;
  label: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LangMeta[] = [
  { code: 'en', label: 'English',          flag: '🇬🇧', dir: 'ltr' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'ms', label: 'Bahasa Melayu',   flag: '🇲🇾', dir: 'ltr' },
  { code: 'ar', label: 'العربية',          flag: '🇸🇦', dir: 'rtl' },
];

export interface Translations {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: {
    dashboardHome:       string;
    fileExplorer:        string;
    workspace:           string;
    hardwareSimulator:   string;
    learningPortal:      string;
    packageManager:      string;
    robomakerLevel:      string;
    levelMaster:         string;
  };

  // ── TopMenuBar ───────────────────────────────────────────────────────────
  topBar: {
    open:           string;
    save:           string;
    verify:         string;
    upload:         string;
    installCore:    string;
    runPython:      string;
    more:           string;
    search:         string;
    boardLabel:     string;
    portLabel:      string;
    connected:      string;
    disconnected:   string;
    student:        string;
    pro:            string;
    block:          string;
    code:           string;
    boardManager:   string;
    libraryManager: string;
    extensions:     string;
    settings:       string;
    documentation:  string;
    about:          string;
    feedback:       string;
    changeLanguage: string;
  };

  // ── Home Tab — Carousel ──────────────────────────────────────────────────
  home: {
    carouselTitle:    string;
    carouselSubtitle: string;
    allProjects:      string;
    searchPlaceholder:string;
    allBoards:        string;
    openProject:      string;
    noResults:        string;
  };

  // ── Hardware Simulator Tab ────────────────────────────────────────────────
  simulator: {
    title:          string;
    description:    string;
    backToWorkspace:string;
  };

  // ── Learning Portal Tab ──────────────────────────────────────────────────
  learning: {
    title:          string;
    subtitle:       string;
    pythonBasic:    string;
    microPython:    string;
    moduleDetail:   string;
    loadToEditor:   string;
    codeExample:    string;
    copy:           string;
    copied:         string;
  };
}

const translations: Record<LangCode, Translations> = {
  // ══════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ══════════════════════════════════════════════════════════════════════════
  en: {
    sidebar: {
      dashboardHome:     'Dashboard Home',
      fileExplorer:      'File Explorer',
      workspace:         'Workspace',
      hardwareSimulator: 'Hardware Simulator',
      learningPortal:    'Learning Portal',
      packageManager:    'Package Manager',
      robomakerLevel:    'RoboMaker Level',
      levelMaster:       'Level {level} Master',
    },
    topBar: {
      open:           'Open',
      save:           'Save',
      verify:         'Verify',
      upload:         'Upload',
      installCore:    'Install Core',
      runPython:      'Run Python',
      more:           'More',
      search:         'Search',
      boardLabel:     'Board:',
      portLabel:      'Port:',
      connected:      'Connected',
      disconnected:   'Disconnected',
      student:        '🎓 Student',
      pro:            '⚡ Pro',
      block:          'Block',
      code:           'Code',
      boardManager:   'Board Manager',
      libraryManager: 'Library Manager',
      extensions:     'Extensions',
      settings:       'Settings',
      documentation:  'Documentation',
      about:          'About',
      feedback:       'Feedback',
      changeLanguage: 'Change Language',
    },
    home: {
      carouselTitle:     'RoboLab Studio Project Suite',
      carouselSubtitle:  'Choose from 20 interactive project templates. Click a card to load it into the IDE workspace.',
      allProjects:       'All Projects',
      searchPlaceholder: 'Search projects...',
      allBoards:         'All Boards',
      openProject:       'Open Project',
      noResults:         'No projects match your search.',
    },
    simulator: {
      title:           'Virtual Hardware Simulator',
      description:     'Simulate circuits, microcontrollers ({board}), and IoT components in real-time interactively.',
      backToWorkspace: '← Back to Workspace',
    },
    learning: {
      title:        'Python & MicroPython Learning Portal',
      subtitle:     'Master Python programming from basic syntax to MicroPython implementation on IoT and robotics devices interactively.',
      pythonBasic:  '🐍 Python Basic',
      microPython:  '🔌 MicroPython',
      moduleDetail: 'Module Detail',
      loadToEditor: 'Load Code to Editor ↗',
      codeExample:  'Code Example:',
      copy:         'Copy',
      copied:       'Copied!',
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAHASA INDONESIA
  // ══════════════════════════════════════════════════════════════════════════
  id: {
    sidebar: {
      dashboardHome:     'Dashboard Home',
      fileExplorer:      'File Explorer',
      workspace:         'Workspace',
      hardwareSimulator: 'Hardware Simulator',
      learningPortal:    'Portal Pembelajaran',
      packageManager:    'Package Manager',
      robomakerLevel:    'RoboMaker Level',
      levelMaster:       'Level {level} Master',
    },
    topBar: {
      open:           'Open',
      save:           'Save',
      verify:         'Verify',
      upload:         'Upload',
      installCore:    'Install Core',
      runPython:      'Run Python',
      more:           'More',
      search:         'Search',
      boardLabel:     'Board:',
      portLabel:      'Port:',
      connected:      'Connected',
      disconnected:   'Disconnected',
      student:        '🎓 Student',
      pro:            '⚡ Pro',
      block:          'Block',
      code:           'Code',
      boardManager:   'Board Manager',
      libraryManager: 'Library Manager',
      extensions:     'Extensions',
      settings:       'Pengaturan',
      documentation:  'Dokumentasi',
      about:          'Tentang',
      feedback:       'Masukan',
      changeLanguage: 'Ganti Bahasa',
    },
    home: {
      carouselTitle:     'RoboLab Studio Project Suite',
      carouselSubtitle:  'Pilih dari 20 template proyek interaktif kami. Klik kartu untuk memuat ke ruang kerja IDE.',
      allProjects:       'Semua Proyek',
      searchPlaceholder: 'Cari proyek...',
      allBoards:         'Semua Board',
      openProject:       'Buka Proyek',
      noResults:         'Tidak ada proyek yang cocok dengan pencarian Anda.',
    },
    simulator: {
      title:           'Virtual Hardware Simulator',
      description:     'Simulasikan sirkuit, mikrokontroler ({board}), dan komponen IoT secara real-time interaktif.',
      backToWorkspace: '← Kembali ke Workspace',
    },
    learning: {
      title:        'Portal Pembelajaran Python & MicroPython',
      subtitle:     'Kuasai pemrograman Python dari dasar sintaksis hingga implementasi MicroPython pada perangkat IoT dan robotika secara interaktif.',
      pythonBasic:  '🐍 Python Dasar',
      microPython:  '🔌 MicroPython',
      moduleDetail: 'Detail Modul',
      loadToEditor: 'Muat Kode ke Editor ↗',
      codeExample:  'Contoh Kode Program:',
      copy:         'Copy',
      copied:       'Copied!',
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAHASA MELAYU (Malaysia)
  // ══════════════════════════════════════════════════════════════════════════
  ms: {
    sidebar: {
      dashboardHome:     'Papan Pemuka',
      fileExplorer:      'Penjelajah Fail',
      workspace:         'Ruang Kerja',
      hardwareSimulator: 'Simulasi Perkakasan',
      learningPortal:    'Portal Pembelajaran',
      packageManager:    'Pengurus Pakej',
      robomakerLevel:    'Tahap RoboMaker',
      levelMaster:       'Tahap {level} Master',
    },
    topBar: {
      open:           'Buka',
      save:           'Simpan',
      verify:         'Sahkan',
      upload:         'Muat Naik',
      installCore:    'Pasang Teras',
      runPython:      'Jalankan Python',
      more:           'Lagi',
      search:         'Carian',
      boardLabel:     'Papan:',
      portLabel:      'Port:',
      connected:      'Disambungkan',
      disconnected:   'Tidak Disambung',
      student:        '🎓 Pelajar',
      pro:            '⚡ Pro',
      block:          'Blok',
      code:           'Kod',
      boardManager:   'Pengurus Papan',
      libraryManager: 'Pengurus Perpustakaan',
      extensions:     'Sambungan',
      settings:       'Tetapan',
      documentation:  'Dokumentasi',
      about:          'Perihal',
      feedback:       'Maklum Balas',
      changeLanguage: 'Tukar Bahasa',
    },
    home: {
      carouselTitle:     'Suite Projek RoboLab Studio',
      carouselSubtitle:  'Pilih daripada 20 templat projek interaktif kami. Klik kad untuk memuatkan ke ruang kerja IDE.',
      allProjects:       'Semua Projek',
      searchPlaceholder: 'Cari projek...',
      allBoards:         'Semua Papan',
      openProject:       'Buka Projek',
      noResults:         'Tiada projek yang sepadan dengan carian anda.',
    },
    simulator: {
      title:           'Simulator Perkakasan Maya',
      description:     'Simulasikan litar, mikropengawal ({board}), dan komponen IoT secara masa nyata interaktif.',
      backToWorkspace: '← Kembali ke Ruang Kerja',
    },
    learning: {
      title:        'Portal Pembelajaran Python & MicroPython',
      subtitle:     'Kuasai pengaturcaraan Python dari sintaks asas hingga pelaksanaan MicroPython pada peranti IoT dan robotik secara interaktif.',
      pythonBasic:  '🐍 Python Asas',
      microPython:  '🔌 MicroPython',
      moduleDetail: 'Butiran Modul',
      loadToEditor: 'Muatkan Kod ke Editor ↗',
      codeExample:  'Contoh Kod Program:',
      copy:         'Salin',
      copied:       'Disalin!',
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARABIC (RTL)
  // ══════════════════════════════════════════════════════════════════════════
  ar: {
    sidebar: {
      dashboardHome:     'لوحة التحكم',
      fileExplorer:      'مستعرض الملفات',
      workspace:         'مساحة العمل',
      hardwareSimulator: 'محاكي الأجهزة',
      learningPortal:    'بوابة التعلم',
      packageManager:    'مدير الحزم',
      robomakerLevel:    'مستوى روبوميكر',
      levelMaster:       'المستوى {level} ماستر',
    },
    topBar: {
      open:           'فتح',
      save:           'حفظ',
      verify:         'تحقق',
      upload:         'رفع',
      installCore:    'تثبيت النواة',
      runPython:      'تشغيل بايثون',
      more:           'المزيد',
      search:         'بحث',
      boardLabel:     'اللوحة:',
      portLabel:      'المنفذ:',
      connected:      'متصل',
      disconnected:   'غير متصل',
      student:        '🎓 طالب',
      pro:            '⚡ محترف',
      block:          'كتل',
      code:           'كود',
      boardManager:   'مدير اللوحات',
      libraryManager: 'مدير المكتبات',
      extensions:     'الامتدادات',
      settings:       'الإعدادات',
      documentation:  'التوثيق',
      about:          'حول',
      feedback:       'ملاحظات',
      changeLanguage: 'تغيير اللغة',
    },
    home: {
      carouselTitle:     'مجموعة مشاريع RoboLab Studio',
      carouselSubtitle:  'اختر من 20 قالب مشروع تفاعلي. انقر على البطاقة لتحميلها إلى بيئة العمل.',
      allProjects:       'جميع المشاريع',
      searchPlaceholder: 'البحث عن مشاريع...',
      allBoards:         'جميع اللوحات',
      openProject:       'فتح المشروع',
      noResults:         'لا توجد مشاريع تطابق بحثك.',
    },
    simulator: {
      title:           'محاكي الأجهزة الافتراضي',
      description:     'محاكاة الدوائر والمتحكمات الدقيقة ({board}) ومكونات إنترنت الأشياء في الوقت الفعلي.',
      backToWorkspace: 'العودة إلى مساحة العمل ←',
    },
    learning: {
      title:        'بوابة تعلم Python و MicroPython',
      subtitle:     'أتقن برمجة Python من الأساسيات حتى تطبيق MicroPython على أجهزة إنترنت الأشياء والروبوتات.',
      pythonBasic:  '🐍 Python الأساسية',
      microPython:  '🔌 MicroPython',
      moduleDetail: 'تفاصيل الوحدة',
      loadToEditor: 'تحميل الكود إلى المحرر ↗',
      codeExample:  'مثال على الكود:',
      copy:         'نسخ',
      copied:       'تم النسخ!',
    },
  },
};

export function t(lang: LangCode, section: keyof Translations, key: string, vars?: Record<string, string>): string {
  const sectionObj = translations[lang]?.[section] as Record<string, string> | undefined;
  let text = sectionObj?.[key] ?? (translations['en']?.[section] as Record<string, string>)?.[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

export default translations;
