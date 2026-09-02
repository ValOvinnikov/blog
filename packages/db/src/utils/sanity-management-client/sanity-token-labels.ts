// Both the label used to mint a provisioned robot token and the label used
// later to recognize it for revocation must be the exact same string — a
// shared constant, not two copies kept in sync by hand.
export const SANITY_READ_TOKEN_LABEL = 'web-read (provisioned)';
export const SANITY_WRITE_TOKEN_LABEL = 'web-write (provisioned)';
