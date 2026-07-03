import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@blog/ui', '@blog/service', '@blog/config'],
};

export default config;
