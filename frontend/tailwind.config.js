/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#3b82f6",
          "secondary": "#f000b8",
          "accent": "#37cdbe",
          "neutral": "#3d4451",
          "base-100": "#0A0A0B",
          "base-200": "#141414",
          "base-300": "#262626",
          "info": "#3abff8",
          "success": "#22C55E",
          "warning": "#fbbd23",
          "error": "#EF4444",
          "base-content": "#d1d4dc",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    logs: false, // Turn off logs for cleaner output
  },
}
