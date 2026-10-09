import { ICONS } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { Text } from '@platform/components/shared/text';

import { runErrorCardVariants } from './run-error-card-variants';

export type TRunErrorCardProps = {
  headline: string;
  body: string;
  nextStep: string;
  failedStepLine?: string;
  technicalDetails?: string;
  technicalDetailsLabel: string;
  headingLevel?: Exclude<THeadingLevel, 1>;
};

export const RunErrorCard = ({
  headline,
  body,
  nextStep,
  failedStepLine,
  technicalDetails,
  technicalDetailsLabel,
  headingLevel = 2,
}: TRunErrorCardProps) => {
  const {
    cardBorder,
    cardHeader,
    cardTitle,
    titleIcon,
    content,
    details,
    detailsText,
  } = runErrorCardVariants();

  return (
    <div role="alert">
      <Card className={cardBorder()}>
        <Card.Header
          title={
            <span className={cardTitle()}>
              <Icon name={ICONS.WARNING} className={titleIcon()} />
              {headline}
            </span>
          }
          headingLevel={headingLevel}
          className={cardHeader()}
        />
        <Card.Body>
          <div className={content()}>
            <Text variant="supporting">{body}</Text>
            {failedStepLine && <Text variant="hint">{failedStepLine}</Text>}
            <Text variant="hint">{nextStep}</Text>
            {technicalDetails && (
              <Disclosure
                variant="inline"
                className={details()}
                summary={technicalDetailsLabel}
              >
                <pre className={detailsText()}>{technicalDetails}</pre>
              </Disclosure>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
