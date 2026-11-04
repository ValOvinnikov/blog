import { isUndefined } from '@blog/utils/primitives';
import { flushSync } from 'react-dom';

const FIELD_CONTROL =
  'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])';

export type TInvalidControls = {
  ids: string[];
  revealFirst?: () => void;
};

export const revealFirstInvalidControl = ({
  ids: [firstId],
  revealFirst,
}: TInvalidControls) => {
  if (isUndefined(firstId)) return;
  if (revealFirst) flushSync(revealFirst);
  const target = document.getElementById(firstId);
  target?.focus({ preventScroll: true });
  if (target && !target.contains(document.activeElement)) {
    target
      .querySelector<HTMLElement>(FIELD_CONTROL)
      ?.focus({ preventScroll: true });
  }
  target?.scrollIntoView({ block: 'center' });
};
