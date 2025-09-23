/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../../tailwind.preset.cjs")],
  content: [
    "./src/**/*.{css,xml,html,vue,svelte,ts,tsx}",
    "../../libs/**/*.{html,ts}",
    // Optionally include shared models/services templates if any produce classes via strings
  ],
  // use the .ns-dark class to control dark mode (applied by NativeScript) - since 'media' (default) is not supported.
  darkMode: ["class", ".ns-dark"],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // disables browser-specific resets for NativeScript
  },
};
