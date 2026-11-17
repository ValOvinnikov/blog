import type { ScriptProps } from 'next/script';

export const SCRIPT_TEST_ID = 'next-script';

type TMockScriptProps = ScriptProps & { 'data-domain'?: string };

const MockScript = ({
  src,
  children,
  'data-domain': dataDomain,
}: TMockScriptProps) => (
  <p data-testid={SCRIPT_TEST_ID} data-domain={dataDomain}>
    {src ?? children}
  </p>
);

export default MockScript;
