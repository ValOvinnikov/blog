export function requireEnv(tool: string, name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${tool}: missing required env var ${name}.`);
  }
  return value;
}
