import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from 'node:stream/web';

// vmThreads contexts omit Node's web-stream globals, which undici reads at import time.
globalThis.ReadableStream ??=
  ReadableStream as typeof globalThis.ReadableStream;
globalThis.WritableStream ??=
  WritableStream as typeof globalThis.WritableStream;
globalThis.TransformStream ??=
  TransformStream as typeof globalThis.TransformStream;
