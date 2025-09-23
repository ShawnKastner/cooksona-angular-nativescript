module.exports = {
  presets: [require('./tailwind.preset.cjs')],
  content: [
    './apps/web/src/**/*.{html,ts,css,scss}',
    './libs/**/*.{html,ts}',
  ],
};
