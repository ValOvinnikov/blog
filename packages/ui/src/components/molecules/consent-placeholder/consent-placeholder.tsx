import { SIZE, type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import type { TMediaFrameRatio } from '@blog/ui/components/atoms/media-frame/media-frame-variants';

import { consentPlaceholderVariants } from './consent-placeholder-variants';

export type TConsentPlaceholderProps = IWithClassName &
  IWithDataTestId & {
    id: string;
    providerName: string;
    message: string;
    allowLabel: string;
    settingsLabel: string;
    scopeNote: string;
    ratio?: TMediaFrameRatio;
    onAllow: () => void;
    onOpenSettings: () => void;
  };

const s = consentPlaceholderVariants();

/** A themed stand-in, sized to the embed's aspect ratio, for a third-party embed a reader hasn't yet consented to load — allowing it grants the whole external-media category, so it also offers a route to the full preferences. */
export const ConsentPlaceholder = ({
  id,
  providerName,
  message,
  allowLabel,
  settingsLabel,
  scopeNote,
  ratio = 'video',
  onAllow,
  onOpenSettings,
  className,
  dataTestId,
}: TConsentPlaceholderProps) => {
  const scopeId = `${id}-scope`;

  return (
    <MediaFrame ratio={ratio} className={className} dataTestId={dataTestId}>
      <div className={s.content()}>
        <p className={s.provider()}>{providerName}</p>
        <p className={s.message()}>{message}</p>
        <div className={s.actions()}>
          <Button
            variant="primary"
            size={SIZE.SM}
            onClick={onAllow}
            aria-describedby={scopeId}
          >
            {allowLabel}
          </Button>
          <Button
            variant="link"
            size={SIZE.SM}
            onClick={onOpenSettings}
            aria-describedby={scopeId}
          >
            {settingsLabel}
          </Button>
        </div>
        <p id={scopeId} className={s.scope()}>
          {scopeNote}
        </p>
      </div>
    </MediaFrame>
  );
};
