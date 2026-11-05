import { Injectable } from '@angular/core';

export interface SasTokenConfig {
  namespace: string;
  entity: string;
  keyName: string;
  keyValue: string;
  expirySeconds?: number;
}

export interface SasTokenResult {
  token: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class SasTokenService {
  private tokenCache = new Map<string, SasTokenResult>();

  /**
   * Generate a SAS token for Azure Event Hub using the same algorithm as the bash script
   */
  async generateSasToken(config: SasTokenConfig): Promise<SasTokenResult> {
    const expirySeconds = config.expirySeconds ?? 3600; // Default 1 hour
    const cacheKey = this.getCacheKey(config);

    // Check if we have a valid cached token
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Math.floor(Date.now() / 1000) + 60) {
      // Token still valid for at least 1 more minute
      return cached;
    }

    // Build the resource URI (must include /messages for REST send)
    const resourceUri = `https://${config.namespace}.servicebus.windows.net/${config.entity}/messages`;

    // URL-encode resource URI
    const encodedSr = encodeURIComponent(resourceUri);

    // Calculate expiry epoch (UTC)
    const expiry = Math.floor(Date.now() / 1000) + expirySeconds;

    // String to sign: "<url-encoded-sr>\n<expiry>"
    const stringToSign = `${encodedSr}\n${expiry}`;

    // Compute HMAC-SHA256 signature
    const signature = await this.computeHmacSha256(stringToSign, config.keyValue);

    // URL-encode the signature
    const encodedSig = encodeURIComponent(signature);

    // Build final SAS token
    const sasToken = `SharedAccessSignature sr=${encodedSr}&sig=${encodedSig}&se=${expiry}&skn=${config.keyName}`;

    const result: SasTokenResult = {
      token: sasToken,
      expiresAt: expiry
    };

    // Cache the token
    this.tokenCache.set(cacheKey, result);

    return result;
  }

  /**
   * Compute HMAC-SHA256 signature using Web Crypto API
   */
  private async computeHmacSha256(message: string, key: string): Promise<string> {
    // IMPORTANT: The key must be used as UTF-8 bytes, NOT base64-decoded
    // This matches the bash script behavior: openssl dgst -sha256 -hmac "${KEY_VALUE}"
    const keyData = new TextEncoder().encode(key);

    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Encode message as UTF-8
    const messageBuffer = new TextEncoder().encode(message);

    // Sign the message
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);

    // Convert to base64
    const result = this.arrayBufferToBase64(signature);
    return result;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Generate a cache key for the token config
   */
  private getCacheKey(config: SasTokenConfig): string {
    return `${config.namespace}:${config.entity}:${config.keyName}`;
  }

  /**
   * Clear all cached tokens
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}
