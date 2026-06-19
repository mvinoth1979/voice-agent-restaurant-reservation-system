/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-tertiary-container": "#003d0b",
        "on-error": "#ffffff",
        "primary-container": "#f47920",
        "inverse-on-surface": "#f3f0f0",
        "primary-fixed-dim": "#ffb68d",
        "inverse-primary": "#ffb68d",
        "error-container": "#ffdad6",
        "surface": "#fcf9f8",
        "surface-container-highest": "#e4e2e1",
        "on-secondary-container": "#fffbff",
        "surface-alt": "#F5F2ED",
        "on-primary-container": "#572400",
        "surface-dim": "#dcd9d9",
        "tertiary-container": "#5ead5b",
        "surface-bright": "#fcf9f8",
        "secondary": "#b6171e",
        "on-secondary-fixed": "#410003",
        "secondary-fixed": "#ffdad6",
        "tertiary-fixed-dim": "#88d982",
        "primary-fixed": "#ffdbc9",
        "surface-container-low": "#f6f3f2",
        "muted-text": "#757575",
        "surface-tint": "#9a4600",
        "on-background": "#1b1c1c",
        "on-surface-variant": "#574237",
        "on-surface": "#1b1c1c",
        "on-primary-fixed-variant": "#763300",
        "outline-variant": "#dec0b1",
        "on-primary-fixed": "#321200",
        "surface-variant": "#e4e2e1",
        "inverse-surface": "#303030",
        "background": "#FDFBF7",
        "on-secondary": "#ffffff",
        "tertiary": "#1b6d24",
        "on-primary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "error": "#ba1a1a",
        "surface-container-high": "#eae7e7",
        "primary": "#9a4600",
        "outline": "#8b7265",
        "on-secondary-fixed-variant": "#930010",
        "on-tertiary-fixed-variant": "#005312",
        "tertiary-fixed": "#a3f69c",
        "secondary-container": "#da3433",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#002204",
        "surface-container": "#f0eded",
        "on-error-container": "#93000a",
        "secondary-fixed-dim": "#ffb3ac",
        "success": "#2E7D32"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-desktop": "32px",
        "gutter": "24px",
        "stack-md": "16px",
        "margin-mobile": "16px",
        "stack-lg": "32px",
        "container-max": "1200px",
        "stack-sm": "8px"
      },
      fontFamily: {
        "headline-lg-mobile": ["Outfit", "sans-serif"],
        "display-lg": ["Outfit", "sans-serif"],
        "headline-lg": ["Outfit", "sans-serif"],
        "headline-md": ["Outfit", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "reservation-code": ["Outfit", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg-mobile": [
          "28px",
          {
            "lineHeight": "1.2",
            "fontWeight": "600"
          }
        ],
        "display-lg": [
          "48px",
          {
            "lineHeight": "1.1",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "1.2",
            "fontWeight": "600"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "1.3",
            "fontWeight": "600"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "1.6",
            "fontWeight": "400"
          }
        ],
        "reservation-code": [
          "36px",
          {
            "lineHeight": "1.0",
            "letterSpacing": "0.1em",
            "fontWeight": "800"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "1.5",
            "fontWeight": "400"
          }
        ],
        "label-md": [
          "14px",
          {
            "lineHeight": "1.2",
            "letterSpacing": "0.05em",
            "fontWeight": "600"
          }
        ]
      }
    },
  },
  plugins: [],
}
