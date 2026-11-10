import { Button } from '@blog/ui/components/atoms/button';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

export const mockCtaImage = (seed: string) => (
  <img
    src={faker.image.urlPicsumPhotos({ width: 1200, height: 900 })}
    alt=""
    key={seed}
  />
);

export const MOCK_CTA_BRIGHT_PHOTO = (
  <img
    src="https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1600&h=900&fit=crop"
    alt=""
  />
);

export const MOCK_CTA_PRIMARY_AND_SECONDARY = (
  <>
    <Button variant="primary">Start reading</Button>
    <Button variant="ghost">Compare plans</Button>
  </>
);

export const MOCK_CTA_PRIMARY_ONLY = (
  <Button variant="primary">Subscribe</Button>
);

export const MOCK_CTA_PRIMARY_AND_INLINE_LINK = (
  <>
    <Button variant="primary">Reserve a seat</Button>
    <Button variant="link">See the schedule</Button>
  </>
);

type TMockCtaSlots = {
  eyebrow?: string;
  supportingText?: string;
  content?: ReactNode;
  actions?: ReactNode;
  footnote?: string;
  image?: ReactNode;
};

export const mockCtaSlots = ({
  eyebrow,
  supportingText,
  content,
  actions,
  footnote,
  image,
}: TMockCtaSlots) => (
  <>
    {eyebrow && <CtaModule.Eyebrow>{eyebrow}</CtaModule.Eyebrow>}
    {(supportingText || content) && (
      <CtaModule.Text supportingText={supportingText}>{content}</CtaModule.Text>
    )}
    {actions && <CtaModule.Actions>{actions}</CtaModule.Actions>}
    {footnote && <CtaModule.Footnote>{footnote}</CtaModule.Footnote>}
    {image && <CtaModule.Media>{image}</CtaModule.Media>}
  </>
);

export const MOCK_CTA_HEADING = faker.lorem.sentence(3);

export const MOCK_CTA_IMAGE_TEST_ID = 'cta-image';

export const mockCtaTestImage = () => (
  <img src={faker.image.url()} alt="" data-testid={MOCK_CTA_IMAGE_TEST_ID} />
);
