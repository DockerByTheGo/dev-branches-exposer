
export function getSubdomain(host: string): string | null {
  const domainParts = host.split('.');
  if (domainParts.length < 3) return null;
  return domainParts[0];
}
