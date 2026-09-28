/** @type {import('tailwindcss').Config} */
export default {
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
