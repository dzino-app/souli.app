import { getConversations, type Conversation } from "./conversations";
import { getMoodHistory, type MoodEntry } from "./mood-tracking";

export interface DailyNoteConversation {
  id: string;
  title: string;
  messageCount: number;
}

export interface DailyNote {
  date: string; // YYYY-MM-DD
  conversations: DailyNoteConversation[];
  mood: 1 | 2 | 3 | 4 | 5 | null;
  moodNote?: string;
}

/**
 * Check if a conversation has any messages on the given date,
 * or was created on that date.
 */
function conversationHasActivityOnDate(
  conv: Conversation,
  dateStr: string,
): boolean {
  // Check if createdAt falls on this date
  if (conv.createdAt.startsWith(dateStr)) return true;

  // Check if any messages were sent on this date
  return conv.messages.some((m) => m.timestamp.startsWith(dateStr));
}

function countMessagesOnDate(conv: Conversation, dateStr: string): number {
  return conv.messages.filter((m) => m.timestamp.startsWith(dateStr)).length;
}

/**
 * Get a DailyNote for a single date (YYYY-MM-DD).
 */
export function getDailyNote(dateStr: string): DailyNote {
  const allConversations = getConversations();
  const allMoods = getMoodHistory();

  const conversations: DailyNoteConversation[] = allConversations
    .filter((c) => conversationHasActivityOnDate(c, dateStr))
    .map((c) => ({
      id: c.id,
      title: c.title,
      messageCount: countMessagesOnDate(c, dateStr),
    }));

  const moodEntry: MoodEntry | undefined = allMoods.find(
    (m) => m.date === dateStr,
  );

  return {
    date: dateStr,
    conversations,
    mood: moodEntry?.mood ?? null,
    moodNote: moodEntry?.note,
  };
}

/**
 * Get DailyNotes for a date range (inclusive).
 * startDate and endDate are YYYY-MM-DD strings.
 */
export function getDailyNotes(
  startDate: string,
  endDate: string,
): DailyNote[] {
  const notes: DailyNote[] = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    notes.push(getDailyNote(dateStr));
    current.setDate(current.getDate() + 1);
  }

  return notes;
}
