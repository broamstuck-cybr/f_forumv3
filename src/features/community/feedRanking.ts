export interface FeedSignals {
  createdAt: string;
  votes: number;
  comments: number;
  hasAccepted: boolean;
  bookmarks: number;
  authorHandle: string;
  tags: string[];
}

export interface FeedPersonalization {
  followedHandles: string[];
  interestTags: string[];
}

const GRAVITY = 1.6;
const W_VOTE = 2;
const W_COMMENT = 3;
const W_ACCEPTED = 6;
const W_BOOKMARK = 4;
const FOLLOW_BOOST = 1.5;
const TAG_BOOST = 0.2;

export function computeFeedScore(
  s: FeedSignals,
  p: FeedPersonalization,
  now: number = Date.now()
): number {
  const ageHours = Math.max(0, (now - Date.parse(s.createdAt)) / 3_600_000);
  const engagement =
    Math.max(0, s.votes) * W_VOTE +
    s.comments * W_COMMENT +
    (s.hasAccepted ? W_ACCEPTED : 0) +
    s.bookmarks * W_BOOKMARK +
    1;
  const followed = p.followedHandles.some((h) => h.toLowerCase() === s.authorHandle.toLowerCase());
  const interest = s.tags.filter((t) => p.interestTags.includes(t.toLowerCase())).length;
  const personalization = (followed ? FOLLOW_BOOST : 1) * (1 + interest * TAG_BOOST);
  return (engagement * personalization) / Math.pow(ageHours + 2, GRAVITY);
}
