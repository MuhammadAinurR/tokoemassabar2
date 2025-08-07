const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', ...fontFamily.sans]
  		},
  		colors: {
  			luxury: {
  				'50': '#F9F9F9',
  				'100': '#F0F0F0',
  				'200': '#E4E4E4',
  				'300': '#D1D1D1',
  				'400': '#B4B4B4',
  				'500': '#939393',
  				'600': '#6E6E6E',
  				'700': '#4F4F4F',
  				'800': '#2E2E2E',
  				'900': '#1A1A1A'
  			},
  			accent: {
  				'50': '#FFF9E5',
  				'100': '#FFF0B3',
  				'200': '#FFE680',
  				'300': '#FFDB4D',
  				'400': '#FFD11A',
  				'500': '#E6B800',
  				'600': '#B38F00',
  				'700': '#806600',
  				'800': '#4D3D00',
  				'900': '#1A1400'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}