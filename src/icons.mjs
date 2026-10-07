const paths = {
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.7c3.3-.4 6.8-1.6 6.8-7.3A5.7 5.7 0 0 0 19.3 4 5.2 5.2 0 0 0 19.2 0S18 0 15.2 1.5a13.4 13.4 0 0 0-6.4 0C6 0 4.8 0 4.8 0a5.2 5.2 0 0 0-.1 4A5.7 5.7 0 0 0 3.2 8c0 5.7 3.5 6.9 6.8 7.3A3.5 3.5 0 0 0 9 18v4" transform="translate(0 1) scale(1 .9)"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
};
export const icon = (name) => `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name] || paths.external}</svg>`;
