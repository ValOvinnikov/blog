const PLUS_TAG = /^([^+@]+)\+[^@]*(@.+)$/;

// `+tag` sub-addresses reach one inbox, so they count as one person when deciding who already owns a site.
export const toOwnerIdentityEmail = (email: string): string =>
  email.trim().toLowerCase().replace(PLUS_TAG, '$1$2');
