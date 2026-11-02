/**
 * Jest setup for design-system and sound tests: Reanimated in test mode (its resolver is set in
 * package.json `jest.resolver`), gesture handler mocks and the safe-area context mock.
 * Registered in package.json `jest.setupFiles`.
 */
import 'react-native-gesture-handler/jestSetup';

// Gesture handler binds to the native UI runtime on load; there is none under Jest.
jest.mock('react-native-gesture-handler/src/handlers/gestures/installUIRuntimeBindings', () => ({
  installUIRuntimeBindings: () => {},
}));
jest.mock('react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings', () => ({
  installUIRuntimeBindings: () => {},
}));
/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must require lazily */
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
require('react-native-reanimated').setUpTests();
/* eslint-enable @typescript-eslint/no-require-imports */
