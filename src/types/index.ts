export type DateOrder = 'DMY' | 'MDY' | 'YMD'
export type MessageKind = 'text' | 'media' | 'deleted' | 'system'
export interface ChatMessage { id: number; timestamp: number; author: string | null; text: string; kind: MessageKind }
export interface ParsedChat { messages: ChatMessage[]; participants: string[]; warnings: string[]; order: DateOrder; ambiguousDates: boolean; source: string; skipped: number }
export interface ParseOptions { order?: DateOrder; source?: string }
export interface ParticipantStats {
  name: string; messages: number; words: number; characters: number; avgWords: number; short: number; long: number;
  questions: number; exclamations: number; laughing: number; emoji: number; media: number; deleted: number;
  night: number; starts: number; ends: number; streakMessages: number; consecutiveRuns: number;
  love: number; hearts: number; audios: number; stickers: number; uppercase: number; vocabulary: number;
  medResponse: number | null; replies: number; activeDays: number
}
export interface CountItem { key: string; value: number }
export interface Insight { id: string; title: string; detail: string; method: string; period: string; value?: string; category: string }
export interface Trophy { id: string; label: string; icon: string; winner: string; count: number; criterion: string }
export interface Analytics {
  count: number; words: number; characters: number; media: number; deleted: number; participants: ParticipantStats[];
  dates: {first: number; last: number}; spanDays: number; activeDays: number; emptyDays: number; meanActive: number; medianActive: number;
  daily: CountItem[]; months: CountItem[]; years: CountItem[]; hours: number[]; weekdays: number[];
  topWords: CountItem[]; topEmojis: CountItem[]; biggestDay: CountItem | null; busiestMonth: CountItem | null;
  streak: number; sessions: number; responseMedian: number | null; longestSilenceHours: number; longestSilenceStart: number | null;
  sessionStarts: CountItem[]; sessionEnds: CountItem[]; loveExpressions: number; questions: number; night: number;
  gapHours: number; insights: Insight[]; trophies: Trophy[]
}
export type ModuleId = 'overview' | 'detective' | 'friends' | 'couple' | 'groups' | 'family' | 'language' | 'nostalgia' | 'communication' | 'wrapped'
export interface ModuleDefinition { id: ModuleId; name: string; emoji: string; kicker: string; description: string; accent: string }
