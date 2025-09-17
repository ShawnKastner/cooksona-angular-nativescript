export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('de-DE');
  } catch {
    return String(iso);
  }
}
