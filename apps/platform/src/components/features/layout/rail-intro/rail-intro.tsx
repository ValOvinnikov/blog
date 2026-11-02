import { railIntroVariants } from './rail-intro-variants';

export type TRailIntroProps = {
  title: string;
  description: string;
  isPageHeading?: boolean;
  isWizard?: boolean;
  titleId?: string;
  className?: string;
};

export const RailIntro = ({
  title,
  description,
  isPageHeading = false,
  isWizard = false,
  titleId,
  className,
}: TRailIntroProps) => {
  const {
    root,
    title: titleSlot,
    description: descriptionSlot,
  } = railIntroVariants({ isPageHeading, isWizard });
  const TitleTag = isPageHeading ? 'h1' : 'p';

  return (
    <div className={root({ class: className })}>
      <TitleTag id={titleId} className={titleSlot()}>
        {title}
      </TitleTag>
      <p className={descriptionSlot()}>{description}</p>
    </div>
  );
};
