import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { BirthPlace } from '@/core/model';
import { OrtusBottomSheet, OrtusSpacing, OrtusTextField, OrtusWideButton, UiCue } from '@/designsystem';
import { useT } from '@/i18n';

import { MAX_LATITUDE, MAX_LONGITUDE, parseCoordinate, parseUtcOffset, typedOffsetText } from './coordinates';

export type CoordinatesSheetProps = {
  initial: BirthPlace | null;
  onDismiss: () => void;
  onSave: (latitude: number, longitude: number, utcOffsetMinutes: number | null) => void;
};

/**
 * Latitude and longitude typed by hand, for places the list doesn't have, plus an optional UTC offset:
 * without one the zone is guessed from the longitude, which can be hours out (China, Spain, summer time).
 */
export function CoordinatesSheet({ initial, onDismiss, onSave }: CoordinatesSheetProps) {
  const t = useT();
  const [latitude, setLatitude] = useState(() => (initial ? String(initial.latitude) : ''));
  const [longitude, setLongitude] = useState(() => (initial ? String(initial.longitude) : ''));
  const [offset, setOffset] = useState(() => typedOffsetText(initial));
  const [showError, setShowError] = useState(false);
  const [showOffsetError, setShowOffsetError] = useState(false);

  const save = () => {
    const lat = parseCoordinate(latitude, MAX_LATITUDE);
    const lon = parseCoordinate(longitude, MAX_LONGITUDE);
    const utcOffset = parseUtcOffset(offset);
    const offsetInvalid = offset.trim() !== '' && utcOffset === null;
    setShowError(lat === null || lon === null);
    setShowOffsetError(offsetInvalid);
    if (lat !== null && lon !== null && !offsetInvalid) onSave(lat, lon, utcOffset);
  };

  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={t.tf('onboarding_coordinates_title')}
      subtitle={t.tf('onboarding_coordinates_subtitle')}
    >
      <View style={styles.column}>
        <OrtusTextField
          value={latitude}
          onChangeText={(text) => {
            setLatitude(text);
            setShowError(false);
          }}
          label={t.tf('onboarding_latitude')}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <OrtusTextField
          value={longitude}
          onChangeText={(text) => {
            setLongitude(text);
            setShowError(false);
          }}
          label={t.tf('onboarding_longitude')}
          error={showError ? t.tf('onboarding_coordinates_error') : undefined}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <OrtusTextField
          value={offset}
          onChangeText={(text) => {
            setOffset(text);
            setShowOffsetError(false);
          }}
          label={t.tf('onboarding_offset_field')}
          placeholder={t.tf('onboarding_offset_placeholder')}
          helper={t.tf('onboarding_offset_hint')}
          error={showOffsetError ? t.tf('onboarding_offset_error') : undefined}
          returnKeyType="done"
        />
        <OrtusWideButton
          text={t.tf('onboarding_coordinates_save')}
          onPress={save}
          enabled={latitude.trim() !== '' && longitude.trim() !== ''}
          cue={UiCue.Select}
        />
      </View>
    </OrtusBottomSheet>
  );
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.md, paddingBottom: OrtusSpacing.xl },
});
