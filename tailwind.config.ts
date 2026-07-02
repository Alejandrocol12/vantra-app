import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:       '#07070f',
        surface:  '#0e0e1c',
        surface2: '#141428',
        ink:      '#eeeef8',
        muted:    '#72728a',
        subtle:   '#2a2a48',
        sidebar:  '#040409',
        brand: {
          DEFAULT: '#22d3ee',
          dark:    '#06b6d4',
          soft:    'rgba(34,211,238,0.13)',
        },
        accent: {
          DEFAULT: '#d946ef',
          dark:    '#c026d3',
          soft:    'rgba(217,70,239,0.13)',
        },
        success: {
          DEFAULT: '#4ade80',
          bg:      'rgba(74,222,128,0.12)',
        },
        warn: {
          DEFAULT: '#fbbf24',
          bg:      'rgba(251,191,36,0.12)',
        },
        danger: {
          DEFAULT: '#f87171',
          bg:      'rgba(248,113,113,0.12)',
        },
        info: {
          DEFAULT: '#818cf8',
          bg:      'rgba(129,140,248,0.12)',
          text:    '#a5b4fc',
        },
      },
      borderColor: {
        DEFAULT: 'rgba(139,92,246,0.15)',
        strong:  'rgba(139,92,246,0.30)',
      },
      boxShadow: {
        'neon-brand': '0 0 20px rgba(34,211,238,0.25)',
        'neon-accent': '0 0 20px rgba(217,70,239,0.25)',
        'neon-sm': '0 0 10px rgba(217,70,239,0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
export default config
