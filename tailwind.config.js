export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./public/**/*.html"
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'print': {'raw': 'print'}
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712'
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554'
      },
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49'
      },
      secondary: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
        950: '#0c0a09'
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Merriweather', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      display: ['Poppins', 'Inter', 'system-ui', 'sans-serif']
    },
    fontSize: {
      xs: ['0.75rem', {lineHeight: '1rem'}],
      sm: ['0.875rem', {lineHeight: '1.25rem'}],
      base: ['1rem', {lineHeight: '1.5rem'}],
      lg: ['1.125rem', {lineHeight: '1.75rem'}],
      xl: ['1.25rem', {lineHeight: '1.75rem'}],
      '2xl': ['1.5rem', {lineHeight: '2rem'}],
      '3xl': ['1.875rem', {lineHeight: '2.25rem'}],
      '4xl': ['2.25rem', {lineHeight: '2.5rem'}],
      '5xl': ['3rem', {lineHeight: '1'}],
      '6xl': ['3.75rem', {lineHeight: '1'}],
      '7xl': ['4.5rem', {lineHeight: '1'}],
      '8xl': ['6rem', {lineHeight: '1'}],
      '9xl': ['8rem', {lineHeight: '1'}]
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem'
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'hard': '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      typography: function(theme) {
        return {
          DEFAULT: {
            css: {
              color: theme('colors.gray.800'),
              lineHeight: '1.7',
              h1: {
                fontSize: theme('fontSize.3xl')[0],
                fontWeight: '700',
                marginBottom: theme('spacing.6')
              },
              h2: {
                fontSize: theme('fontSize.2xl')[0],
                fontWeight: '600',
                marginBottom: theme('spacing.4')
              },
              p: {
                marginBottom: theme('spacing.4')
              }
            }
          },
          dark: {
            css: {
              color: theme('colors.gray.200'),
              h1: {
                color: theme('colors.white')
              },
              h2: {
                color: theme('colors.gray.100')
              }
            }
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    function addUtilities(api) {
      var addUtilities = api.addUtilities;
      var theme = api.theme;
      
      var newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance'
        },
        '.text-pretty': {
          'text-wrap': 'pretty'
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.print-exact': {
          'color-adjust': 'exact',
          'print-color-adjust': 'exact'
        }
      };
      
      addUtilities(newUtilities);
    }
  ],
  future: {
    hoverOnlyWhenSupported: true
  }
}
