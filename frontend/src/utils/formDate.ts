export function formatDate(date: string | null | undefined): string {
  if (!date) {
    return '—';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Fecha no válida';
  }

  return new Intl.DateTimeFormat('es-HN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Tegucigalpa',
  }).format(parsedDate);
}