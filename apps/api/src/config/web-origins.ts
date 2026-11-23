const FIRST_NEXT_DEV_PORT = 3000;
const LAST_NEXT_DEV_PORT = 3020;

export function getAllowedWebOrigins(
  configuredOrigin: string | undefined,
  isProduction: boolean,
): string[] {
  const configured = new URL(configuredOrigin ?? 'http://localhost:3000').origin;
  if (isProduction) return [configured];

  const origins = new Set([configured]);
  for (let port = FIRST_NEXT_DEV_PORT; port <= LAST_NEXT_DEV_PORT; port += 1) {
    origins.add(`http://localhost:${port}`);
    origins.add(`http://127.0.0.1:${port}`);
  }
  return [...origins];
}
