/// <reference types="nativewind/types" />

declare module 'base64-arraybuffer' {
  export function encode(buffer: ArrayBuffer): string;
  export function decode(base64: string): ArrayBuffer;
}
