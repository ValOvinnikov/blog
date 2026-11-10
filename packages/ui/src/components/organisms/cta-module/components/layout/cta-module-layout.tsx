import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';
import { CtaModuleSlotParts } from '@blog/ui/components/organisms/cta-module/cta-module-slot-parts';
import type {
  TCtaModuleBannerStyles,
  TCtaModuleStyles,
} from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import { mapCompoundSlots, type TCompoundChildren } from '@blog/ui/lib/react';
import { cloneElement, Fragment } from 'react';

export type TCtaModuleLayoutProps = IWithClassName &
  IWithDataTestId & {
    styles: TCtaModuleStyles;
    bannerStyles?: TCtaModuleBannerStyles;
    heading: string;
    headingId?: string;
    children?: TCompoundChildren<typeof CtaModuleSlotParts>;
  };

/** The markup every `CtaModule` layout shares, styled by the layout that renders it. */
export const CtaModuleLayout = ({
  styles: s,
  bannerStyles: banner,
  heading,
  headingId,
  children,
  className,
  dataTestId,
}: TCtaModuleLayoutProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, CtaModuleSlotParts);
  const { Eyebrow, Text, Actions, Footnote, Media } = slots;

  return (
    <div
      className={s.root({
        class: [banner?.root(), banner?.copy(), className],
      })}
      data-testid={dataTestId}
    >
      <div className={s.body()}>
        {Eyebrow &&
          cloneElement(Eyebrow, {
            className: s.eyebrow({
              class: [banner?.title(), Eyebrow.props.className],
            }),
          })}
        <div className={s.group({ class: banner?.block() })}>
          <Heading
            id={headingId}
            level={2}
            visual="section"
            className={s.heading({ class: banner?.title() })}
          >
            {heading}
          </Heading>
          {Text &&
            cloneElement(Text, {
              className: s.text({
                class: [banner?.text(), Text.props.className],
              }),
            })}
        </div>
        {Actions &&
          cloneElement(Actions, {
            className: s.actions({
              class: [banner?.actions(), Actions.props.className],
            }),
          })}
        {Footnote &&
          cloneElement(Footnote, {
            className: s.footnote({
              class: [
                banner?.block(),
                banner?.text(),
                Footnote.props.className,
              ],
            }),
          })}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
      {Media &&
        cloneElement(Media, {
          isFramed: !banner,
          className: s.media({
            class: [banner?.media(), Media.props.className],
          }),
        })}
      {banner && <div className={banner.overlay()} aria-hidden="true" />}
    </div>
  );
};
