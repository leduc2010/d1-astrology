import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { OrtusBottomSheet, OrtusRadioOption, OrtusSpacing } from '../../designsystem';
import {
  getAppLanguageOverride,
  type LanguageCode,
  nativeLanguageName,
  setAppLanguage,
  SUPPORTED_LANGUAGES,
  useT,
} from '../../i18n';
import type { UiText } from './uiText';

/** BCP 47 tags of the app's languages, English first as the default. */
export const LANGUAGE_TAGS: readonly LanguageCode[] = SUPPORTED_LANGUAGES.map((l) => l.code);

const primaryOf = (tag: string): string => tag.split(/[-_]/)[0]!.toLowerCase();

/** Which app language a stored tag means ("pt-BR" stays itself, "vi-VN" becomes "vi"). */
export function matchLanguage(stored: string | null | undefined): LanguageCode | null {
  if (stored == null || stored.length === 0) return null;
  const lower = stored.toLowerCase();
  return (
    LANGUAGE_TAGS.find((tag) => tag.toLowerCase() === lower) ??
    LANGUAGE_TAGS.find((tag) => primaryOf(tag) === primaryOf(stored)) ??
    null
  );
}

/** A language's name in that language ("Tiếng Việt", "Deutsch"), as people look for their own. */
export const endonym = (tag: LanguageCode): string => nativeLanguageName(tag);

/** The chosen app language, or null when the app follows the system language. */
export const currentLanguageChoice = (): LanguageCode | null => matchLanguage(getAppLanguageOverride());

/** Display name of the current app language, or "System default". */
export function currentLanguageLabel(t: UiText): string {
  const selected = currentLanguageChoice();
  return selected === null ? t.tf('language_system') : endonym(selected);
}

export type LanguageSheetProps = {
  onDismiss: () => void;
  /**
   * A new choice was applied (null = system). Android stores it itself; here the settings layer
   * persists it and re-applies it on start-up.
   */
  onChosen?: (code: LanguageCode | null) => void;
};

/** Sheet listing "System default" and every app language by its own name. */
export function LanguageSheet({ onDismiss, onChosen }: LanguageSheetProps) {
  const t = useT();
  // Read once on open, like Compose `remember`: the sheet closes as soon as a choice is made.
  const [selected] = useState(currentLanguageChoice);
  const choose = (code: LanguageCode | null) => {
    onDismiss();
    // Applying the language already shown would only reload every string for nothing.
    if (code === selected) return;
    void setAppLanguage(code);
    onChosen?.(code);
  };
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={t.tf('language_title')}>
      <ScrollView contentContainerStyle={styles.list}>
        <OrtusRadioOption text={t.tf('language_system')} selected={selected === null} onPress={() => choose(null)} />
        {LANGUAGE_TAGS.map((tag) => (
          <OrtusRadioOption key={tag} text={endonym(tag)} selected={selected === tag} onPress={() => choose(tag)} />
        ))}
      </ScrollView>
    </OrtusBottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: OrtusSpacing.xs },
});
