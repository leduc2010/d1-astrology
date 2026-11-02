import { useCallback } from 'react';
import { Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusColors, OrtusLinkButton, OrtusSpacing } from '../../designsystem';
import { useT } from '../../i18n';
import { type AppLinks, hasLegal } from '../model';

/**
 * Opens a web or mailto link. A phone with nothing to open it does nothing rather than crash:
 * there is no useful recovery, and the tap is simply ignored as on Android (`runCatching`).
 */
export async function openLink(uri: string): Promise<boolean> {
  try {
    await Linking.openURL(uri);
    return true;
  } catch {
    return false;
  }
}

/** [openLink] as a stable callback for components (Kotlin `rememberOpenLink`). */
export function useOpenLink(): (uri: string) => void {
  return useCallback((uri: string) => {
    void openLink(uri);
  }, []);
}

export type LegalLinksProps = {
  links: AppLinks;
  style?: StyleProp<ViewStyle>;
};

/** "Terms of use  Privacy policy", quiet links under a purchase; only the ones this build has. */
export function LegalLinks({ links, style }: LegalLinksProps) {
  const { tf } = useT();
  const open = useOpenLink();
  if (!hasLegal(links)) return null;
  return (
    <View style={[styles.row, style]}>
      {links.termsUrl.trim() !== '' ? (
        <OrtusLinkButton
          text={tf('legal_terms')}
          onPress={() => open(links.termsUrl)}
          color={OrtusColors.textMuted}
        />
      ) : null}
      {links.privacyUrl.trim() !== '' ? (
        <OrtusLinkButton
          text={tf('legal_privacy')}
          onPress={() => open(links.privacyUrl)}
          color={OrtusColors.textMuted}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.lg },
});
