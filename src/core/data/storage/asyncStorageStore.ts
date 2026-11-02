import type { KeyValueStore } from './keyValueStore';

type AsyncStorageApi = (typeof import('@react-native-async-storage/async-storage'))['default'];

// Required on first use: the native module throws at load time where it is absent (Jest, tooling),
// so merely importing the data layer must not touch it. A plain require, not import(), because
// Jest cannot run dynamic imports without experimental VM modules.
let loaded: AsyncStorageApi | null = null;
function storage(): AsyncStorageApi {
  if (loaded === null) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module: { default?: AsyncStorageApi } & AsyncStorageApi = require('@react-native-async-storage/async-storage');
    // The package is an ES module; its Jest mock is a plain CommonJS object.
    loaded = module.default ?? module;
  }
  return loaded;
}

/** The on-device store. Stays on the device; never synced or sent anywhere by the app. */
export function createAsyncStorageStore(): KeyValueStore {
  return Object.freeze({
    async getAllKeys() {
      return storage().getAllKeys();
    },
    async getMany(keys: readonly string[]) {
      if (keys.length === 0) return [];
      return storage().multiGet(keys);
    },
    async setMany(entries: readonly (readonly [string, string])[]) {
      if (entries.length === 0) return;
      await storage().multiSet(entries);
    },
    async removeMany(keys: readonly string[]) {
      if (keys.length === 0) return;
      await storage().multiRemove(keys);
    },
  });
}
