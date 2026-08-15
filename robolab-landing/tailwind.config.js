/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'robolab-blue': '#1557B0',
        'deep-blue': '#12345B',
        'robolab-cyan': '#16B8D4',
        'robolab-purple': '#7C3AED',
        'robolab-orange': '#F59E0B',
        'robolab-green': '#10B981',
        'bg-base': '#F8FAFC',
        'bg-muted': '#F1F5F9',
        'text-heading': '#0F172A',
        'text-body': '#334155',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
      },
      maxWidth: {
        'content': '1440px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)',
        'window': '0 20px 60px -10px rgba(21,87,176,0.15), 0 8px 25px -5px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
