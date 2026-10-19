const DOMAIN_LABEL = '[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?';

export const DOMAIN_LABEL_PATTERN = new RegExp(`^${DOMAIN_LABEL}$`);

export const DOMAIN_PATTERN = new RegExp(
  `^${DOMAIN_LABEL}(\\.${DOMAIN_LABEL})+$`,
);
