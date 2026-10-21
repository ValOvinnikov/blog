// `+tag` sub-addresses reach one inbox, so they count as one person when deciding who already owns a site.
export const toOwnerIdentityEmail = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0) return normalized;

  const localPart = normalized.slice(0, at).split('+')[0];
  return `${localPart || normalized.slice(0, at)}${normalized.slice(at)}`;
};
