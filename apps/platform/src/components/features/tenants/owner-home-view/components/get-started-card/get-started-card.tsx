import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  GET_STARTED_STEP,
  type TGetStartedStep,
} from '@platform/constants/get-started';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import type { TGetStarted } from '@platform/server/onboarding/get-started-for';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { ChecklistRow } from './components/checklist-row/checklist-row';
import { EditorInviteStatus } from './components/editor-invite-status/editor-invite-status';
import { LiveSiteBlock } from './components/live-site-block/live-site-block';
import { getStartedCardVariants } from './get-started-card-variants';

const STEP_LINK = { variant: BUTTON_VARIANT.LINK, hasArrow: true } as const;

type TChecklistStep = {
  step: TGetStartedStep;
  description: string;
  isLocked?: boolean;
  actions?: ReactNode;
};

export type TGetStartedCardProps = {
  getStarted: TGetStarted;
};

export const GetStartedCard = ({ getStarted }: TGetStartedCardProps) => {
  const { tenantId, siteAddress, doneSteps, studioAccess } = getStarted;
  const t = useTranslations('getStartedCard');
  const { body, list } = getStartedCardVariants();
  const isEditorReady = studioAccess === OWNER_STUDIO_ACCESS.READY;
  const isInviteDone = doneSteps[GET_STARTED_STEP.EDITOR_INVITE];
  const firstPostDescriptionKey = isEditorReady
    ? 'firstPostReady'
    : isInviteDone
      ? 'firstPostActivating'
      : 'firstPostLocked';
  const doneCount = Object.values(doneSteps).filter(Boolean).length;
  const stepTotal = Object.keys(doneSteps).length;

  const steps: TChecklistStep[] = [
    {
      step: GET_STARTED_STEP.LOOK,
      description: t('lookDescription'),
      actions: (
        <LinkButton {...STEP_LINK} href={adminRoutes.dashboardLook()}>
          {t('openLook')}
        </LinkButton>
      ),
    },
    {
      step: GET_STARTED_STEP.VOICE,
      description: t('voiceDescription'),
      actions: (
        <LinkButton {...STEP_LINK} href={adminRoutes.dashboardVoice()}>
          {t('openVoice')}
        </LinkButton>
      ),
    },
    {
      step: GET_STARTED_STEP.EDITOR_INVITE,
      description: t('editorInviteDescription'),
      actions: !isEditorReady && (
        <EditorInviteStatus tenantId={tenantId} studioAccess={studioAccess} />
      ),
    },
    {
      step: GET_STARTED_STEP.FIRST_POST,
      description: t(firstPostDescriptionKey),
      isLocked: !isEditorReady,
      actions: isEditorReady && (
        <LinkButton {...STEP_LINK} href={adminRoutes.dashboardStudio()}>
          {t('openStudio')}
        </LinkButton>
      ),
    },
  ];

  return (
    <Card>
      <Card.Header
        title={t('title')}
        supportingText={t('supportingText')}
        actions={
          <StatusBadge tone={BADGE_TONE.NEUTRAL} hasDot={false}>
            {t('doneCount', { done: doneCount, total: stepTotal })}
          </StatusBadge>
        }
      />
      <Card.Body className={body()}>
        <LiveSiteBlock siteAddress={siteAddress} />
        <ol className={list()}>
          {steps.map(({ step, description, isLocked, actions }) => (
            <ChecklistRow
              key={step}
              title={t(`stepTitle.${step}`)}
              isDone={doneSteps[step]}
              isLocked={isLocked}
              description={description}
              actions={actions}
            />
          ))}
        </ol>
      </Card.Body>
    </Card>
  );
};
