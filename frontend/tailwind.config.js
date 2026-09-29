/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-navy': '#1F3864',
        'accent-blue': '#2E74B5',
        'surface-grey': '#F2F2F2',
        'text-secondary': '#595959',
        'text-primary': '#1A1A1A',
        'risk-high': '#C0392B',
        'risk-medium': '#E67E22',
        'risk-low': '#27AE60',
        'risk-review': '#7F8C8D',
        // Elevated dark & glowing palette preserving original branding:
        'navy-dark': '#0B132B',
        'navy-deep': '#0F1E3D',
        'navy-card': '#132247',
        'cyan-glow': '#00B4D8',
        'cyan-bright': '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 56, 100, 0.35)',
        'glass-glow': '0 0 25px rgba(46, 116, 181, 0.45)',
        'glow-cyan': '0 0 30px rgba(0, 180, 216, 0.35)',
        'glow-red': '0 0 30px rgba(192, 57, 43, 0.35)',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'blur(20px)' },
          '50%': { opacity: '0.9', filter: 'blur(30px)' },
        },
      }
    },
  },
  plugins: [],
}
