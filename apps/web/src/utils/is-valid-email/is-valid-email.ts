const WHITESPACE_PATTERN = /\s/;

// Index/split checks, not a regex: a pattern capturing this shape backtracks polynomially on malformed input.
export const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return false;
  }
  if (
    WHITESPACE_PATTERN.test(localPart) ||
    WHITESPACE_PATTERN.test(domainPart)
  ) {
    return false;
  }

  return domainPart.slice(1, -1).includes('.');
};
