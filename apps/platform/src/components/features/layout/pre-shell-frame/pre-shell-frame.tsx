import { Card } from '@platform/components/shared/card';
import type { ReactNode } from 'react';

import { preShellFrameVariants } from './pre-shell-frame-variants';

export type TPreShellFrameProps = {
  header: ReactNode;
  children: ReactNode;
};

/** The page frame for routes that render before `AdminShell` exists. */
export const PreShellFrame = ({ header, children }: TPreShellFrameProps) => {
  const { root, main, card, headerGutter } = preShellFrameVariants();

  return (
    <div className={root()}>
      <main className={main()}>
        <Card className={card()}>
          <div className={headerGutter()}>{header}</div>
          <Card.Body>{children}</Card.Body>
        </Card>
      </main>
    </div>
  );
};
