import { useState } from "react";

import {
  CalloutTone,
  OrtusCallout,
  OrtusCard,
  OrtusIcons,
  OrtusListRow,
  OrtusSizes,
  OrtusSpacing,
  OrtusTopBar,
  RowTrailing,
} from "@/designsystem";
import { useServices } from "@/core/data";
import {
  civilDateOfEpochDay,
  OrtusScreen,
  relationshipName,
  Reveal,
  solarDateText,
  useResumedOnly,
  type UiText,
} from "@/core/ui";
import { useT } from "@/i18n";
import {
  goBack,
  navigateToAddPartner,
  navigateToEditBirth,
  navigateToMatchResult,
} from "@/navigation/routes";
import { PersonSeal, personDetail } from "./personBits";
import type { PersonSummary } from "./personSummary";
import { DeleteSheet, PersonSheet } from "./profileSheets";
import { ProfilesModel, type OtherPerson } from "./profilesModel";
import { useScreenModel } from "@/core/ui";

const RowSeal = ({ person }: { person: PersonSummary }) => (
  <PersonSeal person={person} size={OrtusSizes.avatar} variant="hanTag" />
);

const otherSubtitle = (t: UiText, other: OtherPerson): string =>
  t.tf(
    "me_detail",
    relationshipName(t, other.relationship),
    t.tf(
      "profiles_consent",
      solarDateText(
        civilDateOfEpochDay(other.addedOnEpochDay),
        t.language,
        "medium",
      ),
    ),
  );

/** S10-02: the owner and everyone they added, each openable for a match or removal. */
export function ProfilesScreen() {
  const t = useT();
  const services = useServices();
  const [state, model] = useScreenModel(
    () => new ProfilesModel(services.profile, services.partners),
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const onBack = useResumedOnly(goBack);
  const onEditOwner = useResumedOnly(navigateToEditBirth);
  const onAddPerson = useResumedOnly(navigateToAddPartner);
  const onOpenMatch = useResumedOnly(navigateToMatchResult);

  const selected = state.others.find((other) => other.id === selectedId);
  const close = () => {
    setSelectedId(null);
    setConfirming(false);
  };

  return (
    <>
      <OrtusScreen
        header={
          <OrtusTopBar
            title={t.tf("profiles_title")}
            onBack={onBack}
            backAccessibilityLabel={t.tf("me_back")}
          />
        }
      >
        {state.deleteFailed ? (
          <OrtusCallout
            text={t.tf("profiles_delete_failed")}
            tone={CalloutTone.Warning}
          />
        ) : null}
        <Reveal index={0}>
          <OrtusCard contentPadding={OrtusSpacing.none}>
            {state.owner ? (
              <>
                <OrtusListRow
                  title={state.owner.name}
                  subtitle={t.tf(
                    "me_detail",
                    t.tf("profiles_mine"),
                    personDetail(t, state.owner),
                  )}
                  leading={<RowSeal person={state.owner} />}
                  trailing={RowTrailing.None}
                  showDivider
                />
                <OrtusListRow
                  title={t.tf("profiles_edit_mine")}
                  showDivider
                  onPress={onEditOwner}
                />
              </>
            ) : null}
            {state.others.map((other) => (
              <OrtusListRow
                key={other.id}
                title={other.person.name}
                subtitle={otherSubtitle(t, other)}
                leading={<RowSeal person={other.person} />}
                showDivider
                onPress={() => {
                  setSelectedId(other.id);
                  setConfirming(false);
                }}
              />
            ))}
            <OrtusListRow
              title={t.tf("profiles_add")}
              icon={OrtusIcons.Plus}
              onPress={onAddPerson}
            />
          </OrtusCard>
        </Reveal>
        <Reveal index={1}>
          <OrtusCallout text={t.tf("profiles_note")} tone={CalloutTone.Info} />
        </Reveal>
      </OrtusScreen>
      {selected && confirming ? (
        <DeleteSheet
          t={t}
          name={selected.person.name}
          onConfirm={() => {
            void model.delete(selected.id);
            close();
          }}
          onDismiss={close}
        />
      ) : null}
      {selected && !confirming ? (
        <PersonSheet
          t={t}
          person={selected}
          onMatch={() => {
            close();
            onOpenMatch(selected.id);
          }}
          onDelete={() => setConfirming(true)}
          onDismiss={close}
        />
      ) : null}
    </>
  );
}
