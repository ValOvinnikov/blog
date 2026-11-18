function normaliseHost(host: string): string {
  return host.trim().toLowerCase();
}

export function isPlatformTenant(
  hosts: string[],
  rootDomain: string,
  marketingHost?: string,
): boolean {
  const root = normaliseHost(rootDomain);
  const marketing = normaliseHost(marketingHost ?? '');
  const platformHosts = [root, `www.${root}`];
  if (marketing) {
    platformHosts.push(marketing);
  }

  return hosts.some((host) => platformHosts.includes(normaliseHost(host)));
}
