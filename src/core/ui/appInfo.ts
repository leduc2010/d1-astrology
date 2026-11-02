import Constants from "expo-constants";

import { type AppLinks, EMPTY_APP_LINKS } from "../model";

/*
 * Kotlin injects `AppLinks` and the version name from the app module; here they come from the
 * build. EXPO_PUBLIC_* values are inlined at build time; a build without them shows no links.
 */

/** Help address and legal pages of this build; blank values hide their rows. */
export const APP_LINKS: AppLinks = Object.freeze({
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? EMPTY_APP_LINKS.termsUrl,
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? EMPTY_APP_LINKS.privacyUrl,
  supportEmail:
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? EMPTY_APP_LINKS.supportEmail,
});

/** The version people see under the disclaimer and in help e-mails (Kotlin `versionName`). */
export const APP_VERSION: string = Constants.expoConfig?.version ?? "";
