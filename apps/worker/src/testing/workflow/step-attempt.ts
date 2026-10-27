import { getStepMetadata } from 'workflow';

export function atStepAttempt(attempt: number): void {
  vi.mocked(getStepMetadata).mockReturnValue({
    attempt,
  } as ReturnType<typeof getStepMetadata>);
}
