import { CommandLink, Heading, Text, TerminalChip } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';

import { notFoundPageVariants } from './not-found-page-variants';

const s = notFoundPageVariants();

/**
 * NotFoundPage — the terminal-styled 404 body content. Rendered from the
 * root `not-found.tsx`, which sits outside the `[locale]` route tree (this
 * app's `Header`/`Footer` chrome lives in `[locale]/layout.tsx`), so this
 * stays a self-contained, centered composition: no site chrome, just the
 * `TerminalChip` molecule, a short explanation, and a link home.
 */
export const NotFoundPage = () => (
  <main className={s.root()}>
    <Heading level={1} visual="hero">
      404
    </Heading>
    <TerminalChip
      prefix="404: "
      suffix="command not found"
      className={s.chip()}
    />
    <Text className={s.copy()}>
      That route doesn&apos;t resolve to anything here.
    </Text>
    <CommandLink
      as={SmartLink}
      href="/"
      command="cd ~"
      ariaLabel="Return home"
    />
  </main>
);
