export function isPlatformTenant(hosts: string[], rootDomain: string): boolean {
  const root = rootDomain.trim().toLowerCase();
  const platformHosts = [root, `www.${root}`];

  return hosts.some((host) => platformHosts.includes(host.toLowerCase()));
}
