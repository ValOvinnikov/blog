import { Card } from '@platform/components/shared/card';
import { Icon } from '@platform/components/shared/icon';
import { Text } from '@platform/components/shared/text';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { ICONS } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';

import { cardFooterNoteVariants } from './card-footer-note-variants';

export const CardFooterNote = ({ children }: IWithChildren) => {
  const { footer, icon, note } = cardFooterNoteVariants();

  return (
    <Card.Footer className={footer()}>
      <Icon
        name={ICONS.INFO}
        size={ICON_SIZE.MD}
        strokeWidth={ICON_STROKE_WIDTH.CONTROL}
        className={icon()}
      />
      <Text variant="muted" className={note()}>
        {children}
      </Text>
    </Card.Footer>
  );
};
