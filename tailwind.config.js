import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'hsl(var(--canvas) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-alt': 'hsl(var(--surface-alt) / <alpha-value>)',
        line: 'hsl(var(--line) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        faint: 'hsl(var(--faint) / <alpha-value>)',
        sage: 'hsl(var(--sage) / <alpha-value>)',
        terracotta: 'hsl(var(--terracotta) / <alpha-value>)',
        blush: 'hsl(var(--blush) / <alpha-value>)',
        dustyblue: 'hsl(var(--dustyblue) / <alpha-value>)',
        yellow: 'hsl(var(--yellow) / <alpha-value>)',
        neon: 'hsl(var(--neon) / <alpha-value>)',
        lavender: 'hsl(var(--lavender) / <alpha-value>)',
        purple: 'hsl(var(--purple) / <alpha-value>)',
        brown: 'hsl(var(--brown) / <alpha-value>)',
        background: 'hsl(var(--canvas) / <alpha-value>)',
        card: 'hsl(var(--surface) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--foreground) / <alpha-value>)',
          foreground: 'hsl(var(--surface) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--surface-alt) / <alpha-value>)',
          foreground: 'hsl(var(--foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--terracotta) / <alpha-value>)',
          foreground: 'hsl(var(--surface) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--lavender) / <alpha-value>)',
          foreground: 'hsl(var(--foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--line) / <alpha-value>)',
        input: 'hsl(var(--line) / <alpha-value>)',
        ring: 'hsl(var(--lavender) / <alpha-value>)',
      },
      borderRadius: {
        card: '16px',
        sidebar: '24px',
        input: '12px',
        chip: '8px',
        button: '12px',
        pill: '9999px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        /*
         * Cleaner neumorphism: tighter blur (was 14–22px → felt foggy on top/left).
         * Still dual light+dark, just sharper edges site-wide.
         */
        'neu-out':
          '-4px -4px 7px rgba(255, 250, 244, 0.5), 4px 4px 9px rgba(160, 143, 126, 0.2)',
        'neu-out-sm':
          '-3px -3px 5px rgba(255, 250, 244, 0.45), 3px 3px 6px rgba(160, 143, 126, 0.18)',
        'neu-in':
          'inset -3px -3px 5px rgba(255, 250, 244, 0.42), inset 3px 3px 5px rgba(160, 143, 126, 0.2)',
        'neu-in-sm':
          'inset -2px -2px 4px rgba(255, 250, 244, 0.4), inset 2px 2px 4px rgba(160, 143, 126, 0.18)',
        'neu-hover':
          '-5px -5px 9px rgba(255, 250, 244, 0.48), 5px 5px 11px rgba(160, 143, 126, 0.24)',
        /* Stronger emboss + crisp rim for floating sidebar */
        'neu-sidebar':
          '-5px -5px 10px rgba(255, 250, 244, 0.72), 6px 6px 14px rgba(150, 132, 114, 0.26), inset 1px 1px 0 rgba(255, 255, 255, 0.45), inset -1px -1px 0 rgba(170, 152, 134, 0.08)',
        /*
         * Sidebar inset (pressed-in): darker top-left, brighter bottom-right.
         * Highlight is intentionally brighter so the recess reads on cream.
         */
        'neu-in-sidebar':
          'inset 3px 3px 6px rgba(145, 128, 110, 0.28), inset -4px -4px 8px rgba(255, 253, 250, 0.88)',
      },
      fontFamily: {
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-danger': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.15)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-danger': 'pulse-danger 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
}
