const SHORT_SHA_LENGTH = 7;

export const shortSha = (sha: string): string => sha.slice(0, SHORT_SHA_LENGTH);
