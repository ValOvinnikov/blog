import { buttonBusyVariants } from '@shinefold/ui/components/atoms/button/button-variants';
import { spinnerVariants } from '@shinefold/ui/components/atoms/spinner/spinner-variants';
import { objectKeys } from '@shinefold/utils/primitives';

export const BUSY_STYLES = objectKeys(buttonBusyVariants.variants.busyStyle);

export const SPINNER_VARIANTS = objectKeys(spinnerVariants.variants.variant);
