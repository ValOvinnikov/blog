import { SIZE, type TIconName } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { Spinner, type TSpinnerProps } from '@blog/ui/components/atoms/spinner';

import { signInPanelProviderVariants } from './sign-in-panel-provider-variants';

export interface ISignInPanelProvider {
  id: string;
  icon: TIconName;
  label: string;
  pendingLabel: string;
  onSelect: () => void;
}

type TSignInPanelProviderProps = {
  provider: ISignInPanelProvider;
  isPending: boolean;
  isWaiting: boolean;
  spinnerVariant?: TSpinnerProps['variant'];
};

/** One "continue with" row of the sign-in panel, which names where it is taking the reader once pressed. */
export const SignInPanelProvider = ({
  provider,
  isPending,
  isWaiting,
  spinnerVariant,
}: TSignInPanelProviderProps) => {
  const { icon, label, pendingLabel, onSelect } = provider;
  const s = signInPanelProviderVariants({ isPending, isWaiting });
  const isInactive = isPending || isWaiting;

  return (
    <button
      type="button"
      aria-disabled={isInactive || undefined}
      aria-busy={isPending || undefined}
      onClick={isInactive ? undefined : onSelect}
      className={s.root()}
    >
      {isPending ? (
        <Spinner
          label={pendingLabel}
          variant={spinnerVariant}
          size={SIZE.SM}
          aria-hidden="true"
          className={s.spinner()}
        />
      ) : (
        <Icon name={icon} size={SIZE.SM} />
      )}
      {isPending ? pendingLabel : label}
    </button>
  );
};
