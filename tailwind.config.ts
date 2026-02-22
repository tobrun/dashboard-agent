import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        db: {
          bg: '#0a0e1a',
          surface: '#111827',
          border: '#1f2937',
          'text-primary': '#e5e7eb',
          'text-muted': '#6b7280',
          accent: '#00d4ff',
          error: '#ef4444',
          success: '#10b981',
          'surface-hover': '#1a2235',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'panel-accent': '0 0 0 1px rgba(0, 212, 255, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config
