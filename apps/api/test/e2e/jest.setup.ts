import { Blob } from 'buffer';

// Polyfill global File for environments where it is not available (e.g., Node < 20)
if (typeof (globalThis as any).File === 'undefined') {
  class File extends Blob {
    name: string;
    lastModified: number;

    constructor(parts: any[], name: string, options: { type?: string; lastModified?: number } = {}) {
      super(parts, options);
      this.name = name;
      this.lastModified = options.lastModified ?? Date.now();
    }
  }

  (globalThis as any).File = File;
}
