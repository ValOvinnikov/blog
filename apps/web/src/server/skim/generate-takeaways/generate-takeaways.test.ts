import { faker } from '@faker-js/faker';
import type { ArticleText } from '@shinefold/config';
import { SUMMARY_BLOCK_STYLE } from '@web/constants/generate-skim';

import { generateTakeaways, SKIM_GENERATION_MODEL } from './generate-takeaways';

faker.seed(6010);

const { parseMock, anthropicCtorMock } = vi.hoisted(() => ({
  parseMock: vi.fn(),
  anthropicCtorMock: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse: parseMock };
    constructor(options: unknown) {
      anthropicCtorMock(options);
    }
  },
}));

const MOCK_BODY: ArticleText = [
  {
    _type: 'block',
    _key: faker.string.alphanumeric(8),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: faker.string.alphanumeric(8),
        text: faker.lorem.sentence(),
      },
    ],
  },
];
const MOCK_API_KEY = faker.string.alphanumeric(32);
const MOCK_SUMMARY_BLOCKS = [
  { style: SUMMARY_BLOCK_STYLE.PARAGRAPH, text: faker.lorem.sentence() },
  { style: SUMMARY_BLOCK_STYLE.BULLET, text: faker.lorem.sentence() },
];
const MOCK_SDK_ERROR_MESSAGE = faker.lorem.sentence();

describe(generateTakeaways, () => {
  beforeEach(() => {
    parseMock.mockReset();
    anthropicCtorMock.mockReset();
    parseMock.mockResolvedValue({
      parsed_output: { blocks: MOCK_SUMMARY_BLOCKS },
    });
  });

  it('returns the parsed summary blocks', async () => {
    const blocks = await generateTakeaways(MOCK_BODY, MOCK_API_KEY);

    expect(blocks).toEqual(MOCK_SUMMARY_BLOCKS);
  });

  it('asks Claude for a draft with the given api key, under one abort deadline', async () => {
    await generateTakeaways(MOCK_BODY, MOCK_API_KEY);

    const [request, options] = parseMock.mock.calls[0] ?? [];
    expect(anthropicCtorMock).toHaveBeenCalledWith({ apiKey: MOCK_API_KEY });
    expect(request.model).toBe(SKIM_GENERATION_MODEL);
    expect(request).not.toHaveProperty('temperature');
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('propagates the SDK error when the response fails validation', async () => {
    parseMock.mockRejectedValue(new Error(MOCK_SDK_ERROR_MESSAGE));

    await expect(generateTakeaways(MOCK_BODY, MOCK_API_KEY)).rejects.toThrow(
      MOCK_SDK_ERROR_MESSAGE,
    );
  });

  it('throws when Claude returns no parseable output', async () => {
    parseMock.mockResolvedValue({ parsed_output: null });

    await expect(generateTakeaways(MOCK_BODY, MOCK_API_KEY)).rejects.toThrow(
      'no parseable output',
    );
  });
});
