async function completeCanaryStep(): Promise<void> {
  'use step';
}

export async function runCanary(): Promise<void> {
  'use workflow';

  await completeCanaryStep();
}
