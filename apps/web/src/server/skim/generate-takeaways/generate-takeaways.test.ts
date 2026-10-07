import type { ArticleText } from '@blog/config';

import type * as GenerateTakeawaysModule from './generate-takeaways';

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

const body: ArticleText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [{ _type: 'span', _key: 's1', text: 'A post about testing.' }],
  },
];

describe('generateTakeaways', () => {
  let generateTakeaways: (typeof GenerateTakeawaysModule)['generateTakeaways'];
  let skimGenerationModel: (typeof GenerateTakeawaysModule)['SKIM_GENERATION_MODEL'];

  beforeEach(async () => {
    parseMock.mockReset();
    anthropicCtorMock.mockReset();
    ({ generateTakeaways, SKIM_GENERATION_MODEL: skimGenerationModel } =
      await import('./generate-takeaways'));
  });

  it('returns the parsed takeaways and calls Claude with SKIM_GENERATION_MODEL and the given api key', async () => {
    parseMock.mockResolvedValue({
      parsed_output: { takeaways: ['One.', 'Two.', 'Three.'] },
    });

    const takeaways = await generateTakeaways(body, 'test-api-key');

    expect(takeaways).toEqual(['One.', 'Two.', 'Three.']);
    expect(anthropicCtorMock).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(parseMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: skimGenerationModel, temperature: 0 }),
    );
  });

  it('propagates the SDK error when the response fails zod validation', async () => {
    parseMock.mockRejectedValue(new Error('Failed to parse structured output'));

    await expect(generateTakeaways(body, 'test-api-key')).rejects.toThrow(
      'Failed to parse structured output',
    );
  });

  it('throws when Claude returns no parseable output', async () => {
    parseMock.mockResolvedValue({ parsed_output: null });

    await expect(generateTakeaways(body, 'test-api-key')).rejects.toThrow(
      'no parseable output',
    );
  });
});
