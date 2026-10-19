/** Bounded, retryable inlining cache. Never cache an HTTP error page as a font/image. */
export class EmbeddedAssetCache {
  private entries = new Map<string, Promise<string>>();
  constructor(private readonly request: typeof fetch = (...args) => fetch(...args), private readonly limit = 96) { if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Cache size must be a positive integer'); }
  get(url: string, kind: 'font' | 'image', expectedSha256?: string): Promise<string> {
    if (expectedSha256 && !/^[a-f0-9]{64}$/i.test(expectedSha256)) throw new TypeError('Invalid expected SHA-256');
    const key = `${kind}:${url}:${expectedSha256 ?? ''}`;
    const existing = this.entries.get(key);
    if (existing) return existing;
    const pending = this.load(url, kind, expectedSha256).catch((error: unknown) => {
      if (this.entries.get(key) === pending) this.entries.delete(key);
      throw error;
    });
    if (this.entries.size >= this.limit) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key, pending);
    return pending;
  }
  clear(): void { this.entries.clear(); }
  private async load(url: string, kind: 'font' | 'image', expectedSha256?: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.request(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Could not load ${kind}: HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size || /^(text\/html|application\/(?:json|problem\+json))/i.test(blob.type)) throw new Error(`Invalid ${kind} response`);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (kind === 'font') {
        const magic = String.fromCharCode(...bytes.slice(0, 4));
        if (bytes.length < 12 || !['wOF2', 'wOFF', 'OTTO', 'true', '\x00\x01\x00\x00'].includes(magic)) throw new Error('Response is not supported font software');
      }
      if (expectedSha256) {
        if (!globalThis.crypto?.subtle) throw new Error('Font integrity verification requires HTTPS or localhost');
        const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((v) => v.toString(16).padStart(2, '0')).join('');
        if (actual !== expectedSha256.toLowerCase()) throw new Error('Font asset changed: SHA-256 does not match its recorded version');
      }
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
    } finally { clearTimeout(timer); }
  }
}
export const embeddedAssets = new EmbeddedAssetCache();
