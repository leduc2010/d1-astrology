import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceholderSection } from '@/core/ui';
import {
  ButtonSize,
  ButtonStyle,
  ChatComposer,
  Disclaimer,
  OrtusButton,
  OrtusColors as c,
  OrtusIconButton,
  OrtusIcons,
  OrtusRootHeader,
  OrtusSpacing,
  OrtusText,
  QuotaPill,
  TypingDots,
  useReducedMotion,
} from '@/designsystem';
import { useT } from '@/i18n';
import { navigateToAiSupport, navigateToPaywall } from '@/navigation/routes';

import { AiIntro, ChatLine } from './AiChat';
import type { AiModel, AiReady, AiUiState } from './aiModel';
import { questionsLeft } from './aiQuota';
import { AiConsentSheet, OutOfQuestionsSheet, SourcesSheet } from './AiSheets';
import { useAiModel } from './useAiModel';

/**
 * S06 Ask AI tab: answered by the online guide when the build has one (after the owner agrees),
 * otherwise from the owner's own readings. Mental-health questions lead to the support screen
 * instead, and investment questions are declined; neither leaves the device.
 */
export function AiScreen() {
  const { state, model } = useAiModel();
  const insets = useSafeAreaInsets();
  const showSupport = state.kind === 'ready' && state.showSupport;

  useEffect(() => {
    if (!showSupport) return;
    navigateToAiSupport();
    model.onDismissSupport();
  }, [showSupport, model]);

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.frame, { paddingTop: insets.top }]}>
      <AiHeader state={state} model={model} />
      <AiBody state={state} model={model} />
    </KeyboardAvoidingView>
  );
}

function AiHeader({ state, model }: { state: AiUiState; model: AiModel }) {
  const { tf, tp } = useT();
  const hasChat = state.kind === 'ready' && state.messages.length > 0;
  const left = state.kind === 'ready' ? questionsLeft(state.quota) : 0;
  return (
    <OrtusRootHeader
      label={tf('ai_header_label')}
      title={tf('ai_header_title')}
      labelColor={c.mysticLight}
      actions={
        hasChat ? (
          <>
            <QuotaPill text={tp('ai_questions_left', left, left)} highlighted={left > 0} />
            <OrtusIconButton icon={OrtusIcons.Plus} accessibilityLabel={tf('ai_new_chat')} onPress={() => model.onNewChat()} />
          </>
        ) : undefined
      }
    />
  );
}

function AiBody({ state, model }: { state: AiUiState; model: AiModel }) {
  const { tf } = useT();
  switch (state.kind) {
    case 'loading':
      return <View style={styles.flex} />;
    case 'noProfile':
      return (
        <PlaceholderSection
          label={tf('ai_no_profile_label')}
          title={tf('ai_no_profile_title')}
          body={tf('ai_no_profile_body')}
          style={styles.placeholder}
        />
      );
    case 'unavailable':
      return (
        <PlaceholderSection
          label={tf('ai_no_profile_label')}
          title={tf('ai_unavailable_title')}
          body={tf('ai_unavailable_body')}
          style={styles.placeholder}
        />
      );
    case 'ready':
      return <Conversation state={state} model={model} />;
  }
}

function Conversation({ state, model }: { state: AiReady; model: AiModel }) {
  const { tf } = useT();
  const reducedMotion = useReducedMotion();
  const scroll = useRef<ScrollViewInstance>(null);
  const [draft, setDraft] = useState('');
  const [sourcesFor, setSourcesFor] = useState<number | null>(null);
  const empty = state.messages.length === 0;
  const sourcesAnswer = state.messages.find((m) => m.id === sourcesFor && m.kind === 'answer');

  // A question goes out the same way from the composer or a prompt card: an accepted one clears the draft.
  const ask = (question: string) => {
    if (model.onAsk(question)) setDraft('');
  };
  const send = () => ask(draft);

  return (
    <>
      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.chat}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: !reducedMotion })}
      >
        {empty ? (
          <AiIntro quota={state.quota} onAsk={ask} />
        ) : (
          state.messages.map((message) => (
            <ChatLine key={message.id} message={message} onViewSources={() => setSourcesFor(message.id)} />
          ))
        )}
      </ScrollView>
      <View style={styles.bottom}>
        {state.isAnswering ? <AnsweringRow onStop={() => model.onStop()} /> : null}
        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          placeholder={tf(empty ? 'ai_composer_hint' : 'ai_composer_hint_more')}
          onSend={send}
          canSend={draft.trim() !== '' && !state.isAnswering}
          sendAccessibilityLabel={tf('ai_send')}
        />
        <Disclaimer text={tf('ai_disclaimer')} />
      </View>
      {sourcesAnswer?.kind === 'answer' ? (
        <SourcesSheet answer={sourcesAnswer} onDismiss={() => setSourcesFor(null)} />
      ) : null}
      {state.askConsent ? (
        <AiConsentSheet
          onAccept={() => {
            if (model.onAcceptAiConsent()) setDraft('');
          }}
          onDismiss={() => model.onDeclineAiConsent()}
        />
      ) : null}
      {state.outOfQuestions ? (
        <OutOfQuestionsSheet
          quota={state.quota}
          watchingAd={state.watchingAd}
          onWatchAd={() => model.onWatchAd()}
          onOpenPaywall={() => {
            model.onDismissOutOfQuestions();
            navigateToPaywall();
          }}
          onDismiss={() => model.onDismissOutOfQuestions()}
        />
      ) : null}
    </>
  );
}

/** Shown while an answer is being written, with a way to stop it. */
function AnsweringRow({ onStop }: { onStop: () => void }) {
  const { tf } = useT();
  return (
    <View style={styles.answering}>
      <TypingDots />
      <OrtusText variant="caption" color={c.textSecondary}>
        {tf('ai_answering')}
      </OrtusText>
      <OrtusButton text={tf('ai_stop')} onPress={onStop} variant={ButtonStyle.Outline} size={ButtonSize.Small} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  flex: { flex: 1 },
  placeholder: { paddingHorizontal: OrtusSpacing.screen, paddingVertical: OrtusSpacing.md },
  chat: { paddingHorizontal: OrtusSpacing.screen, paddingVertical: OrtusSpacing.md, gap: OrtusSpacing.md },
  bottom: { paddingHorizontal: OrtusSpacing.screen, gap: OrtusSpacing.xs },
  answering: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: OrtusSpacing.xs },
});
