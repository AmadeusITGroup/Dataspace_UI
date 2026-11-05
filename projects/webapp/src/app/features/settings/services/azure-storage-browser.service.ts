import { Injectable } from '@angular/core';

/**
 * Represents an Azure Blob Storage container.
 */
export interface AzureContainer {
  name: string;
}

/**
 * Represents a blob (file) within an Azure Blob Storage container.
 */
export interface AzureBlob {
  name: string;
  contentLength?: number;
  contentType?: string;
  lastModified?: string;
}

/**
 * Service that calls the Azure Blob Storage REST API directly from the browser.
 *
 * Authentication uses a short-lived Account SAS token generated client-side
 * from the storage account key via HMAC-SHA256 (Web Crypto API).
 *
 * Because the SAS token is passed as a query parameter (no custom headers),
 * the browser sends a "simple" request — no CORS preflight is required.
 *
 * @see https://learn.microsoft.com/en-us/rest/api/storageservices/create-account-sas
 */
@Injectable()
export class AzureStorageBrowserService {
  /**
   * Lists all containers in a storage account.
   */
  async listContainers(accountName: string, accountKey: string): Promise<AzureContainer[]> {
    const sasToken = await this.#generateAccountSas(accountName, accountKey);
    const url = `https://${accountName}.blob.core.windows.net/?comp=list&${sasToken}`;
    const response = await this.#makeRequest(url);
    const text = await response.text();
    return this.#parseContainerList(text);
  }

  /**
   * Lists blobs in a specific container.
   * @param prefix Optional prefix to filter blobs (like a folder path).
   */
  async listBlobs(
    accountName: string,
    accountKey: string,
    containerName: string,
    prefix?: string
  ): Promise<AzureBlob[]> {
    const sasToken = await this.#generateAccountSas(accountName, accountKey);
    let url = `https://${accountName}.blob.core.windows.net/${containerName}?restype=container&comp=list&${sasToken}`;
    if (prefix) {
      url += `&prefix=${encodeURIComponent(prefix)}`;
    }
    const response = await this.#makeRequest(url);
    const text = await response.text();
    return this.#parseBlobList(text);
  }

  // ── Private: Request execution ──────────────────────────────────────────

  async #makeRequest(url: string): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new Error(
        'Failed to connect to Azure Storage. ' +
          'Please check that the storage account name is correct and that the account is accessible.'
      );
    }
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403) {
        throw new Error(
          'Azure Storage returned 403 Forbidden. The account key may be invalid or expired. ' +
            'Try updating the key in Settings > Storage Accounts.'
        );
      }
      throw new Error(`Azure Storage API error (${response.status}): ${errorText}`);
    }
    return response;
  }

  // ── Private: Account SAS generation ─────────────────────────────────────

  /**
   * Generates a short-lived Account SAS token for read/list operations on the Blob service.
   *
   * The SAS is valid for 15 minutes and grants:
   * - Services: Blob (b)
   * - Resource types: Service (s) + Container (c) — enough for List Containers and List Blobs
   * - Permissions: Read (r) + List (l)
   *
   * @see https://learn.microsoft.com/en-us/rest/api/storageservices/create-account-sas
   */
  async #generateAccountSas(accountName: string, accountKey: string): Promise<string> {
    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    const sv = '2023-11-03'; // signedVersion
    const ss = 'b'; // signedServices: Blob
    const srt = 'sc'; // signedResourceTypes: Service + Container
    const sp = 'rl'; // signedPermissions: Read + List
    const st = this.#formatUtcDate(now); // signedStart
    const se = this.#formatUtcDate(expiry); // signedExpiry
    const sip = ''; // signedIP (empty = any)
    const spr = 'https'; // signedProtocol

    // String-to-sign for Account SAS (version 2020-12-06+):
    // accountname + "\n" + signedpermissions + "\n" + signedservice + "\n" +
    // signedresourcetype + "\n" + signedstart + "\n" + signedexpiry + "\n" +
    // signedIP + "\n" + signedProtocol + "\n" + signedversion + "\n" +
    // signedEncryptionScope + "\n"
    const stringToSign = [
      accountName,
      sp,
      ss,
      srt,
      st,
      se,
      sip,
      spr,
      sv,
      '', // signedEncryptionScope (empty)
      '' // trailing element so join('\n') produces the required trailing \n
    ].join('\n');

    const sig = await this.#hmacSha256(accountKey, stringToSign);

    const params = new URLSearchParams({
      sv,
      ss,
      srt,
      sp,
      se,
      st,
      spr,
      sig
    });

    return params.toString();
  }

  /**
   * Formats a Date as an ISO 8601 UTC string without milliseconds.
   * Example: "2024-01-15T10:30:00Z"
   */
  #formatUtcDate(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  // ── Private: HMAC-SHA256 ────────────────────────────────────────────────

  /**
   * Computes HMAC-SHA256 using the Web Crypto API.
   * @param keyBase64 The account key in base64 format.
   * @param message The string to sign.
   * @returns The signature as a base64-encoded string.
   */
  async #hmacSha256(keyBase64: string, message: string): Promise<string> {
    const keyBytes = this.#base64ToArrayBuffer(keyBase64);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
    return this.#arrayBufferToBase64(signatureBytes);
  }

  /**
   * Converts a base64-encoded string to an ArrayBuffer.
   */
  #base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Converts an ArrayBuffer to a base64-encoded string.
   */
  #arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  // ── Private: XML parsing ────────────────────────────────────────────────

  /**
   * Parses the ListContainers XML response.
   */
  #parseContainerList(xml: string): AzureContainer[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const containers: AzureContainer[] = [];

    const containerElements = doc.getElementsByTagName('Container');
    for (const containerElement of Array.from(containerElements)) {
      const nameEl = containerElement.getElementsByTagName('Name')[0];
      if (nameEl?.textContent) {
        containers.push({ name: nameEl.textContent });
      }
    }

    return containers;
  }

  /**
   * Parses the ListBlobs XML response.
   */
  #parseBlobList(xml: string): AzureBlob[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const blobs: AzureBlob[] = [];

    const blobElements = doc.getElementsByTagName('Blob');
    for (const el of Array.from(blobElements)) {
      const nameEl = el.getElementsByTagName('Name')[0];
      const lengthEl = el.getElementsByTagName('Content-Length')[0];
      const typeEl = el.getElementsByTagName('Content-Type')[0];
      const modifiedEl = el.getElementsByTagName('Last-Modified')[0];

      if (nameEl?.textContent) {
        blobs.push({
          name: nameEl.textContent,
          contentLength: lengthEl?.textContent ? parseInt(lengthEl.textContent, 10) : undefined,
          contentType: typeEl?.textContent ?? undefined,
          lastModified: modifiedEl?.textContent ?? undefined
        });
      }
    }

    return blobs;
  }
}
