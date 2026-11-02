import {
  ButtonStyle,
  OrtusBottomSheet,
  OrtusIcons,
  OrtusWideButton,
} from "@/designsystem";
import type { UiText } from "@/core/ui";
import { personDetail } from "./personBits";
import type { OtherPerson } from "./profilesModel";

/** Someone the owner added: open their match, or start removing them. */
export function PersonSheet(props: {
  t: UiText;
  person: OtherPerson;
  onMatch: () => void;
  onDelete: () => void;
  onDismiss: () => void;
}) {
  const { t, person, onMatch, onDelete, onDismiss } = props;
  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={person.person.name}
      subtitle={personDetail(t, person.person)}
    >
      {(close) => (
        <>
          <OrtusWideButton
            text={t.tf("profiles_sheet_match")}
            onPress={onMatch}
            leadingIcon={OrtusIcons.Heart}
          />
          <OrtusWideButton
            text={t.tf("profiles_sheet_delete", person.person.name)}
            onPress={onDelete}
            variant={ButtonStyle.Outline}
          />
          <OrtusWideButton
            text={t.tf("profiles_sheet_cancel")}
            onPress={close}
            variant={ButtonStyle.Secondary}
          />
        </>
      )}
    </OrtusBottomSheet>
  );
}

/** Asks once more before someone and their readings are removed. */
export function DeleteSheet(props: {
  t: UiText;
  name: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t, name, onConfirm, onDismiss } = props;
  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={t.tf("profiles_delete_title", name)}
      subtitle={t.tf("profiles_delete_body")}
    >
      {(close) => (
        <>
          <OrtusWideButton
            text={t.tf("profiles_delete_confirm")}
            onPress={onConfirm}
          />
          <OrtusWideButton
            text={t.tf("profiles_sheet_cancel")}
            onPress={close}
            variant={ButtonStyle.Outline}
          />
        </>
      )}
    </OrtusBottomSheet>
  );
}
