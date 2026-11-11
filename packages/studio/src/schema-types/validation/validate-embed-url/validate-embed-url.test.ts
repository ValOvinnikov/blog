import { validateEmbedUrl } from '@blog/studio/schema-types/validation/validate-embed-url/validate-embed-url';
import { faker } from '@faker-js/faker';

faker.seed(3771);

const MOCK_HOST = faker.internet.domainName();

describe(validateEmbedUrl, () => {
  it.each([
    ['an empty field', undefined],
    ['a supported link', `https://vimeo.com/${faker.string.numeric(8)}`],
  ])('passes %s', (_description, value) => {
    expect(validateEmbedUrl(value)).toBe(true);
  });

  it('names the host of an unsupported link', () => {
    expect(validateEmbedUrl(`https://${MOCK_HOST}/video`)).toEqual(
      expect.stringContaining(MOCK_HOST),
    );
  });

  it('rejects text that is not a link', () => {
    expect(validateEmbedUrl(faker.lorem.word())).toEqual(expect.any(String));
  });
});
