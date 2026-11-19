import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityAuthor,
  CommunityChannel,
  CommunityChannelsData,
  CommunityPost,
  ModerationReport,
  ModerationReportStatus,
} from '../src/types/index';
import { readPersistedSection, writePersistedSection } from './quotaStore';

interface PersistedCommunityData {
  channels: CommunityChannelsData;
  reports: ModerationReport[];
  initialized: boolean;
}

let memoryCommunity: PersistedCommunityData | null = null;

function normalizeSeedItem(raw: Record<string, unknown>, channel: CommunityChannel): CommunityPost {
  const rawAuthor = (raw.author as CommunityAuthor | undefined) || {
    id: 'user-community',
    name: String(raw.lead || 'Community Engineer'),
    handle: String(raw.slug || 'engineer'),
    role: 'Thành viên',
  };
  const answersList: CommunityAnswer[] = Array.isArray(raw.answers)
    ? (raw.answers as CommunityAnswer[])
    : raw.acceptedAnswer
      ? [raw.acceptedAnswer as CommunityAnswer]
      : [];

  return {
    id: String(raw.id || `${channel}-${crypto.randomBytes(4).toString('hex')}`),
    channel,
    title: String(raw.title || raw.name || 'Untitled Post'),
    author: rawAuthor,
    category: String(raw.category || channel.toUpperCase()),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [channel],
    createdAt: String(raw.createdAt || '2026-11-18T10:00:00Z'),
    votes: typeof raw.votes === 'number' ? raw.votes : typeof raw.likes === 'number' ? raw.likes : 0,
    upvotedBy: Array.isArray(raw.upvotedBy) ? raw.upvotedBy.map(String) : [],
    body: typeof raw.body === 'string' ? raw.body : typeof raw.description === 'string' ? raw.description : '',
    description: typeof raw.description === 'string' ? raw.description : typeof raw.body === 'string' ? raw.body : '',
    answersCount: typeof raw.answersCount === 'number' ? raw.answersCount : answersList.length,
    isAccepted: Boolean(raw.isAccepted || raw.acceptedAnswer),
    acceptedAnswer: raw.acceptedAnswer as CommunityAnswer | undefined,
    answers: answersList,
    likes: typeof raw.likes === 'number' ? raw.likes : typeof raw.votes === 'number' ? raw.votes : 0,
    views: typeof raw.views === 'number' ? raw.views : 42,
    demoSnippet: raw.demoSnippet as CommunityPost['demoSnippet'],
    forks: typeof raw.forks === 'number' ? raw.forks : 0,
    fileType: typeof raw.fileType === 'string' ? raw.fileType : undefined,
    payload: typeof raw.payload === 'string' ? raw.payload : undefined,
    name: typeof raw.name === 'string' ? raw.name : String(raw.title || ''),
    slug: typeof raw.slug === 'string' ? raw.slug : undefined,
    lead: typeof raw.lead === 'string' ? raw.lead : rawAuthor.name,
    membersCount: typeof raw.membersCount === 'number' ? raw.membersCount : undefined,
    activeDossier: raw.activeDossier as ClubHandoverDossier | undefined,
    hidden: Boolean(raw.hidden),
  };
}

function loadSeedChannels(): CommunityChannelsData {
  try {
    const seedPath = path.resolve(process.cwd(), 'src', 'data', 'communitySeed.json');
    if (fs.existsSync(seedPath)) {
      const parsed = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as {
        channels?: Record<string, Array<Record<string, unknown>>>;
      };
      const ch = parsed.channels || {};
      return {
        qa: (ch.qa || []).map((item) => normalizeSeedItem(item, 'qa')),
        showcase: (ch.showcase || []).map((item) => normalizeSeedItem(item, 'showcase')),
        drops: (ch.drops || []).map((item) => normalizeSeedItem(item, 'drops')),
        clubs: (ch.clubs || []).map((item) => normalizeSeedItem(item, 'clubs')),
      };
    }
  } catch {
    return { qa: [], showcase: [], drops: [], clubs: [] };
  }
  return { qa: [], showcase: [], drops: [], clubs: [] };
}

function ensureCommunityStore(): PersistedCommunityData {
  if (memoryCommunity && memoryCommunity.initialized) {
    const totalCount =
      memoryCommunity.channels.qa.length +
      memoryCommunity.channels.showcase.length +
      memoryCommunity.channels.drops.length +
      memoryCommunity.channels.clubs.length;
    if (totalCount > 0) {
      return memoryCommunity;
    }
  }

  const persisted = readPersistedSection<PersistedCommunityData | null>('communityStore', null);
  if (
    persisted &&
    persisted.initialized &&
    persisted.channels &&
    persisted.channels.qa.length +
      persisted.channels.showcase.length +
      persisted.channels.drops.length +
      persisted.channels.clubs.length >
      0
  ) {
    memoryCommunity = persisted;
    return memoryCommunity;
  }

  const seededChannels = loadSeedChannels();
  const initialReports: ModerationReport[] = [
    {
      id: 'rep-seed-01',
      targetId: seededChannels.qa[0]?.id || 'qa-01',
      targetChannel: 'qa',
      targetTitle: seededChannels.qa[0]?.title || 'Kiểm tra câu hỏi kỹ thuật',
      reason: 'Yêu cầu xác minh snippet benchmark đính kèm trong câu trả lời.',
      reporterId: 'usr-reviewer-01',
      reporterName: 'Lê Quang Huy',
      status: 'pending',
      createdAt: '2026-11-18T16:00:00Z',
    },
  ];

  memoryCommunity = {
    channels: seededChannels,
    reports: initialReports,
    initialized: true,
  };
  writePersistedSection('communityStore', memoryCommunity);
  return memoryCommunity;
}

function saveCommunityStore(): void {
  if (!memoryCommunity) return;
  writePersistedSection('communityStore', memoryCommunity);
}

export function getCommunityState(includeHidden = false): {
  channels: CommunityChannelsData;
  posts: CommunityPost[];
  reports: ModerationReport[];
} {
  const store = ensureCommunityStore();
  const filterFn = (p: CommunityPost) => (includeHidden ? true : !p.hidden);
  const channels: CommunityChannelsData = {
    qa: store.channels.qa.filter(filterFn),
    showcase: store.channels.showcase.filter(filterFn),
    drops: store.channels.drops.filter(filterFn),
    clubs: store.channels.clubs.filter(filterFn),
  };
  const posts: CommunityPost[] = [
    ...channels.qa,
    ...channels.showcase,
    ...channels.drops,
    ...channels.clubs,
  ];
  return {
    channels,
    posts,
    reports: store.reports,
  };
}

export function createCommunityPost(input: {
  channel: CommunityChannel;
  title: string;
  body?: string;
  category?: string;
  tags?: string[];
  author: CommunityAuthor;
  demoSnippet?: CommunityPost['demoSnippet'];
  payload?: string;
  fileType?: string;
  activeDossier?: ClubHandoverDossier;
}): CommunityPost {
  const store = ensureCommunityStore();
  const channel: CommunityChannel = ['qa', 'showcase', 'drops', 'clubs'].includes(input.channel)
    ? input.channel
    : 'qa';
  const id = `${channel}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();
  const post: CommunityPost = {
    id,
    channel,
    title: input.title.trim(),
    author: input.author,
    category: (input.category || channel.toUpperCase()).trim(),
    tags: Array.isArray(input.tags) && input.tags.length > 0 ? input.tags : [channel],
    createdAt: now,
    votes: 1,
    upvotedBy: [input.author.id],
    body: input.body?.trim() || '',
    description: input.body?.trim() || '',
    answersCount: 0,
    isAccepted: false,
    answers: [],
    likes: 1,
    views: 1,
    demoSnippet: input.demoSnippet,
    forks: 0,
    fileType: input.fileType || 'markdown',
    payload: input.payload,
    name: input.title.trim(),
    lead: input.author.name,
    membersCount: channel === 'clubs' ? 1 : undefined,
    activeDossier: input.activeDossier,
    hidden: false,
  };
  store.channels[channel].unshift(post);
  saveCommunityStore();
  return post;
}

function findPostById(postId: string): CommunityPost | null {
  const store = ensureCommunityStore();
  for (const ch of ['qa', 'showcase', 'drops', 'clubs'] as CommunityChannel[]) {
    const found = store.channels[ch].find((p) => p.id === postId);
    if (found) return found;
  }
  return null;
}

export function upvoteCommunityPost(postId: string, actorId: string): CommunityPost | null {
  const post = findPostById(postId);
  if (!post) return null;
  const voters = new Set(post.upvotedBy || []);
  if (voters.has(actorId)) {
    voters.delete(actorId);
    post.votes = Math.max(0, post.votes - 1);
  } else {
    voters.add(actorId);
    post.votes += 1;
  }
  post.upvotedBy = Array.from(voters);
  post.likes = post.votes;
  saveCommunityStore();
  return post;
}

export function addCommunityAnswer(
  postId: string,
  input: { content: string; author: CommunityAuthor }
): CommunityPost | null {
  const post = findPostById(postId);
  if (!post) return null;
  const answer: CommunityAnswer = {
    id: `ans-${crypto.randomBytes(4).toString('hex')}`,
    author: input.author,
    createdAt: new Date().toISOString(),
    votes: 1,
    content: input.content.trim(),
    isAccepted: false,
  };
  if (!Array.isArray(post.answers)) {
    post.answers = post.acceptedAnswer ? [post.acceptedAnswer] : [];
  }
  post.answers.push(answer);
  post.answersCount = post.answers.length;
  saveCommunityStore();
  return post;
}

export function acceptCommunityAnswer(postId: string, answerId: string): CommunityPost | null {
  const post = findPostById(postId);
  if (!post) return null;
  if (!Array.isArray(post.answers)) {
    post.answers = post.acceptedAnswer ? [post.acceptedAnswer] : [];
  }
  const target = post.answers.find((a) => a.id === answerId);
  if (!target) return null;
  for (const ans of post.answers) {
    ans.isAccepted = ans.id === answerId;
  }
  post.acceptedAnswer = target;
  post.isAccepted = true;
  saveCommunityStore();
  return post;
}

export function forkCommunityItem(postId: string): CommunityPost | null {
  const post = findPostById(postId);
  if (!post) return null;
  post.forks = (post.forks || 0) + 1;
  saveCommunityStore();
  return post;
}

export function updateClubDossier(
  clubId: string,
  dossier: ClubHandoverDossier
): CommunityPost | null {
  const post = findPostById(clubId);
  if (!post) return null;
  post.activeDossier = {
    projectTitle: dossier.projectTitle.trim(),
    handoverNotes: dossier.handoverNotes.trim(),
    nextMilestones: dossier.nextMilestones.map((m) => m.trim()).filter(Boolean),
    architectureSummary: dossier.architectureSummary?.trim(),
    ownerHandle: dossier.ownerHandle?.trim(),
    updatedAt: new Date().toISOString(),
  };
  saveCommunityStore();
  return post;
}

export function submitModerationReport(input: {
  targetId: string;
  reason: string;
  reporterId: string;
  reporterName: string;
}): ModerationReport {
  const store = ensureCommunityStore();
  const post = findPostById(input.targetId);
  const report: ModerationReport = {
    id: `rep-${crypto.randomBytes(4).toString('hex')}`,
    targetId: input.targetId,
    targetChannel: post ? post.channel : 'qa',
    targetTitle: post ? post.title : input.targetId,
    reason: input.reason.trim(),
    reporterId: input.reporterId,
    reporterName: input.reporterName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.reports.unshift(report);
  saveCommunityStore();
  return report;
}

export function resolveModerationReport(
  reportId: string,
  status: ModerationReportStatus,
  actorName: string
): ModerationReport | null {
  const store = ensureCommunityStore();
  const report = store.reports.find((r) => r.id === reportId);
  if (!report) return null;
  report.status = status;
  report.resolvedAt = new Date().toISOString();
  report.resolvedBy = actorName;

  const post = findPostById(report.targetId);
  if (post) {
    if (status === 'hidden') {
      post.hidden = true;
    } else if (status === 'approved' || status === 'dismissed') {
      post.hidden = false;
    }
  }
  saveCommunityStore();
  return report;
}
