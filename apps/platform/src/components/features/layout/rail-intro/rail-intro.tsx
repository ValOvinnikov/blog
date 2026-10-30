import { railIntroVariants } from './rail-intro-variants';

export type TRailIntroProps = {
  title: string;
  description: string;
  isPageHeading?: boolean;
  className?: string;
};

export const RailIntro = ({
  title,
  description,
  isPageHeading = false,
  className,
}: TRailIntroProps) => {
  const {
    root,
    title: titleSlot,
    description: descriptionSlot,
  } = railIntroVariants({ isPageHeading });
  const TitleTag = isPageHeading ? 'h1' : 'p';

  return (
    <div className={root({ class: className })}>
      <TitleTag className={titleSlot()}>{title}</TitleTag>
      <p className={descriptionSlot()}>{description}</p>
    </div>
  );
};
