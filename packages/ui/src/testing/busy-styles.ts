import { buttonBusyVariants } from '@blog/ui/components/atoms/button/button-variants';
import { spinnerVariants } from '@blog/ui/components/atoms/spinner/spinner-variants';
import { objectKeys } from '@blog/utils/primitives';

export const BUSY_STYLES = objectKeys(buttonBusyVariants.variants.busyStyle);

export const SPINNER_VARIANTS = objectKeys(spinnerVariants.variants.variant);
