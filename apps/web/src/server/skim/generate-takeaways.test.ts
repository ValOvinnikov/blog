import type { RichText } from '@blog/config';

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

const body: RichText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [{ _type: 'span', _key: 's1', text: 'A post about testing.' }],
  },
];

describe('generateTakeaways', () => {
  beforeEach(() => {
    parseMock.mockReset();
    anthropicCtorMock.mockReset();
  });

  it('returns the parsed takeaways and calls Claude with SKIM_GENERATION_MODEL and the given api key', async () => {
    parseMock.mockResolvedValue({
      parsed_output: { takeaways: ['One.', 'Two.', 'Three.'] },
    });

    const { generateTakeaways, SKIM_GENERATION_MODEL } =
      await import('./generate-takeaways');
    const takeaways = await generateTakeaways(body, 'test-api-key');

    expect(takeaways).toEqual(['One.', 'Two.', 'Three.']);
    expect(anthropicCtorMock).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(parseMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: SKIM_GENERATION_MODEL, temperature: 0 }),
    );
  });

  it('propagates the SDK error when the response fails zod validation', async () => {
    parseMock.mockRejectedValue(new Error('Failed to parse structured output'));

    const { generateTakeaways } = await import('./generate-takeaways');

    await expect(generateTakeaways(body, 'test-api-key')).rejects.toThrow(
      'Failed to parse structured output',
    );
  });

  it('throws when Claude returns no parseable output', async () => {
    parseMock.mockResolvedValue({ parsed_output: null });

    const { generateTakeaways } = await import('./generate-takeaways');

    await expect(generateTakeaways(body, 'test-api-key')).rejects.toThrow(
      'no parseable output',
    );
  });
});
