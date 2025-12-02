import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // iPad-optimized touch targets and spacing
      spacing: {
        '11': '2.75rem', // 44px - Apple HIG minimum touch target
        '13': '3.25rem',
        '15': '3.75rem',
      },
      fontSize: {
        // Larger base font for iPad readability
        'ipad-base': ['18px', '28px'],
        'ipad-lg': ['20px', '30px'],
        'ipad-xl': ['24px', '34px'],
        'ipad-2xl': ['32px', '42px'],
      },
      minHeight: {
        'touch': '44px', // Apple HIG minimum touch target
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
export default config
