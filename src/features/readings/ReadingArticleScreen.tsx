import { useEffect, useState } from 'react';

import { factFor, topicName, type Topic } from '@/core/reading';
import { Reveal, useResumedOnly } from '@/core/ui';
import { CalloutTone, OrtusCallout, OrtusIcons, OrtusLinkButton } from '@/designsystem';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { CombinedArticle, SingleArticle } from './ReadingArticleParts';
import { ReadingFeedbackSheet } from './ReadingFeedbackSheet';
import { ReadingsPage, ZiWeiMissingNotice } from './ReadingsCommon';
import { lensSystem, parseLens, parseTopic, readingOf, type ReadingLens, type ReadingsUiState } from './readingsModel';
import { useReadingsModel } from './useReadingsModel';

export type ReadingArticleScreenProps = {
  /** Route param: the topic's enum name, e.g. "CAREER". */
  topicKey: string | undefined;
  /** Route param: the lens's enum name; missing or unknown reads as the combined lens. */
  lensKey: string | undefined;
};

/** One reading, wired to its model and the app's navigation. A link naming no topic goes back. */
export function ReadingArticleScreen({ topicKey, lensKey }: ReadingArticleScreenProps) {
  const topic = parseTopic(topicKey);
  const model = useReadingsModel();
  const onBack = useResumedOnly(goBack);
  useEffect(() => {
    if (topic === null) goBack();
  }, [topic]);
  if (topic === null) return null;
  return (
    <ReadingArticleContent
      state={model.state}
      topic={topic}
      lens={parseLens(lensKey)}
      onFeedbackSent={model.onFeedbackSent}
      onBack={onBack}
    />
  );
}

export type ReadingArticleContentProps = {
  state: ReadingsUiState;
  topic: Topic;
  lens: ReadingLens;
  onFeedbackSent: (topic: Topic) => void;
  onBack: () => void;
};

/**
 * S05-02: one topic read through the chosen lens. The combined lens shows every system's basis
 * and where they differ; a single lens shows that system alone and how many others agree.
 */
export function ReadingArticleContent({ state, topic, lens, onFeedbackSent, onBack }: ReadingArticleContentProps) {
  const t = useT();
  const [showFeedback, setShowFeedback] = useState(false);
  return (
    <>
      <ReadingsPage title={topicName(t, topic)} state={state} onBack={onBack}>
        {(ready) => {
          const reading = readingOf(ready, topic);
          const system = lensSystem(lens);
          const focus = system === null ? null : factFor(reading, system);
          return (
            <>
              {system === null ? (
                <CombinedArticle reading={reading} />
              ) : focus === null ? (
                <ZiWeiMissingNotice />
              ) : (
                <SingleArticle reading={reading} focus={focus} />
              )}
              <Reveal index={4}>
                {ready.feedbackSent.includes(topic) ? (
                  <OrtusCallout text={t.tf('reading_feedback_thanks')} tone={CalloutTone.Good} />
                ) : (
                  <OrtusLinkButton
                    text={t.tf('reading_feedback_link')}
                    onPress={() => setShowFeedback(true)}
                    trailingIcon={OrtusIcons.ChevronRight}
                  />
                )}
              </Reveal>
            </>
          );
        }}
      </ReadingsPage>
      {showFeedback ? (
        <ReadingFeedbackSheet onSend={() => onFeedbackSent(topic)} onDismiss={() => setShowFeedback(false)} />
      ) : null}
    </>
  );
}
