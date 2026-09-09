export function timeAgo(date: string | Date): string {
  const then = new Date(date).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 60) return "hace un momento";

  const units: [number, string][] = [
    [31536000, "año"],
    [2592000, "mes"],
    [86400, "día"],
    [3600, "hora"],
    [60, "minuto"],
  ];

  for (const [secondsInUnit, label] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `hace ${value} ${label}${value > 1 ? (label === "mes" ? "es" : "s") : ""}`;
    }
  }

  return "hace un momento";
}
