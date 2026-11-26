import { buttonBusyVariants } from '@shinefold/ui/components/atoms/button/button-variants';
import { spinnerVariants } from '@shinefold/ui/components/atoms/spinner/spinner-variants';
import { keys } from 'remeda';

export const BUSY_STYLES = keys(buttonBusyVariants.variants.busyStyle);

export const SPINNER_VARIANTS = keys(spinnerVariants.variants.variant);
