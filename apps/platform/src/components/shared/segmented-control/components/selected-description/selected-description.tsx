import type { TMaybeUndefined } from '@blog/config';

import { selectedDescriptionVariants } from './selected-description-variants';

type TSelectedDescriptionProps = {
  id: string;
  description: TMaybeUndefined<string>;
};

export const SelectedDescription = ({
  id,
  description,
}: TSelectedDescriptionProps) => (
  <p id={id} aria-live="polite" className={selectedDescriptionVariants()}>
    {description}
  </p>
);
