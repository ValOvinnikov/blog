export const BLOCK_RHYTHM = '[&>:where(p+p,p+ul,p+ol,ul+p,ol+p)]:mt-4';

/** For a container whose paragraphs and lists sit inside a wrapper it does not render. */
export const NESTED_BLOCK_RHYTHM = '[&_:where(p+p,p+ul,p+ol,ul+p,ol+p)]:mt-4';
