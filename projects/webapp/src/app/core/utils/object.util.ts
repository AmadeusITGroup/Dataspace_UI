/* Utility function to remove empty or undefined properties from an object.
 * @param obj The object to clean.
 * @returns A new object with empty properties removed.
 */
import { HttpErrorResponse } from '@angular/common/http';

export function removeEmptyProperties<T extends object>(obj: T): T {
  const cleanedObject = { ...obj };
  Object.keys(cleanedObject).forEach((key) => {
    const typedKey = key as keyof T;
    if (cleanedObject[typedKey] === undefined || cleanedObject[typedKey] === '') {
      delete cleanedObject[typedKey];
    }
  });
  return cleanedObject;
}

export function isResourceNotFound<T>(
  value: string | undefined,
  resources: T[] | undefined,
  idKey: keyof T
): boolean {
  if (!resources) {
    return false;
  }
  const hasItem = resources.some((resource) => resource[idKey] === value);
  return !hasItem;
}

export function arePropertiesEqual<T extends object, U extends T>(obj1: T, obj2: U): boolean {
  return Object.keys(obj1).every((key) => obj1[key as keyof T] === obj2[key as keyof T]);
}

export function retrieveErrorMessage(error: unknown): string {
  const httpError = error as HttpErrorResponse; // Cast to HttpErrorResponse
  const errorMessage =
    Array.isArray(httpError.error) && httpError.error[0]?.message
      ? httpError.error[0].message
      : httpError.error
        ? httpError.error.toString()
        : (error as Error).message;

  console.warn('Error triggered', errorMessage);
  try {
    const parsedError = JSON.parse(errorMessage);
    return parsedError?.error?.message || errorMessage;
  } catch {
    return errorMessage;
  }
}

export function composedErrorMessage(
  error: Error,
  actionName: string,
  resourceName: string
): string {
  const errorMessage = retrieveErrorMessage(error);
  return errorMessage
    ? errorMessage
    : `An unknown error occurred while ${actionName} the ${resourceName}.`;
}

export function transformInArray<T>(value: T | T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function extractErrorReason<
  T extends { errorDetailObject?: unknown; errorDetail?: unknown; message?: string; '@id'?: string }
>(obj: T | undefined, reasonProperty = 'dspace:reason'): string | undefined {
  let detail = obj?.errorDetailObject || obj?.errorDetail;

  if (!detail) {
    return obj?.message;
  }

  // Parse stringified JSON if needed
  if (typeof detail === 'string' && detail.trim().startsWith('{')) {
    try {
      detail = JSON.parse(detail);
    } catch (e) {
      console.warn('Failed to parse error detail object:', e);
      return obj?.message;
    }
  }

  // Check for error type and reason property
  if (
    typeof detail === 'object' &&
    detail !== null &&
    (detail as { ['@type']?: string })['@type']?.endsWith('Error') &&
    reasonProperty in detail
  ) {
    return String((detail as Record<string, unknown>)[reasonProperty]);
  }

  if (detail instanceof Object && 'message' in detail) {
    return String((detail as Record<string, unknown>)['message']);
  }
  return typeof obj?.errorDetail === 'string' ? obj.errorDetail : undefined;
}
