/**
 * Stands in for the `server-only` package under Vitest. In the app it is a
 * build-time guard against importing server modules into client bundles;
 * integration tests import those modules deliberately, in Node.
 */
export {};
