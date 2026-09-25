const nz = new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Pacific/Auckland" });
const nzDate = new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeZone: "Pacific/Auckland" });

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? nz.format(new Date(iso)) : "";
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? nzDate.format(new Date(iso)) : "";
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
