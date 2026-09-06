function containsWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function hasDotWithContentOnBothSides(domain: string): boolean {
  return domain.slice(1, -1).includes('.');
}

/**
 * Checks whether a string is a syntactically well-formed email address.
 * Purely structural — it says nothing about whether the address exists,
 * accepts mail, or is authorised to send from a given domain. Implemented
 * with index/split checks rather than a regex, since a pattern that
 * captures this shape by construction backtracks polynomially on
 * malformed input.
 */
export function isValidEmailAddress(value: string): boolean {
  const atIndex = value.indexOf('@');
  if (atIndex === -1 || atIndex !== value.lastIndexOf('@')) {
    return false;
  }

  const localPart = value.slice(0, atIndex);
  const domainPart = value.slice(atIndex + 1);

  if (
    localPart.length === 0 ||
    containsWhitespace(localPart) ||
    containsWhitespace(domainPart)
  ) {
    return false;
  }

  return hasDotWithContentOnBothSides(domainPart);
}
