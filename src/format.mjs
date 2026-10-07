export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const richText = (value) => escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
export const plainText = (value) => value.replace(/\*\*/g, '');
export const jsonScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export function interpolate(value, tokens) {
  return value.replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in tokens)) throw new Error(`Unknown content token ${match}`);
    return tokens[key];
  });
}
export function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}
