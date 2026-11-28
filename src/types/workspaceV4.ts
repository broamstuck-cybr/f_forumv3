export type OnboardingRole = 'student' | 'beginner' | 'business' | 'tech';

export type OnboardingDomain = 'education' | 'business' | 'event' | 'portfolio' | 'tech';

export type OnboardingGoal = 'present' | 'register' | 'sell' | 'portfolio';

export type BrandPersonality =
  | 'professional'
  | 'friendly'
  | 'minimal'
  | 'playful'
  | 'bold'
  | 'modern';

export type PageSectionKey =
  | 'hero'
  | 'stats'
  | 'timeline'
  | 'pricing'
  | 'register'
  | 'quiz'
  | 'showcase'
  | 'team';

export interface OnboardingProfile {
  role: OnboardingRole;
  siteName: string;
  domain: OnboardingDomain;
  goal: OnboardingGoal;
  personality: BrandPersonality;
  sections: PageSectionKey[];
  completedAt?: string;
}

export type AgentTraceKind = 'thought' | 'vault_search' | 'file_create' | 'file_edit' | 'check';

export interface AgentTraceStep {
  id: string;
  kind: AgentTraceKind;
  label: string;
  detail?: string;
  added?: number;
  removed?: number;
  status: 'running' | 'done';
}

export interface MatchedVaultResource {
  id: string;
  title: string;
  library: 'pinui' | 'threeui' | 'lucianlabs' | 'motionsites' | 'codefronts';
  reason: string;
  score: number;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  mode?: 'assistant' | 'build';
  modelUsed?: string;
  tokensTotal?: number;
  estimatedCostUsd?: number;
  suggestedResources?: Array<{
    id: string;
    title: string;
    library: string;
    category?: string;
    reason?: string;
  }>;
  trace?: AgentTraceStep[];
  matchedResources?: MatchedVaultResource[];
  motionSignature?: string;
  fileCreated?: string;
  durationMs?: number;
  feedback?: 'yes' | 'no' | 'keep_working';
}

export type PublishedPageCategory = 'presentation' | 'event' | 'portfolio' | 'business' | 'tech';

export interface PublishedPageRecord {
  slug: string;
  title: string;
  summary: string;
  authorName: string;
  authorRole?: string;
  category: PublishedPageCategory;
  personality: BrandPersonality;
  html: string;
  liveUrl?: string;
  sourceIds: string[];
  views?: number;
  likes: number;
  remixes: number;
  createdAt: string;
  updatedAt: string;
}

export type BehaviorSignalType =
  | 'view'
  | 'like'
  | 'use'
  | 'publish'
  | 'satisfied'
  | 'unsatisfied';

export interface BehaviorItemScore {
  score: number;
  likes: number;
  uses: number;
  publishes: number;
  updatedAt?: string;
}

export interface MotionRecipeItem {
  id: string;
  title: string;
  file: string;
  category: string;
  useWhen: string;
  cost: 'light' | 'medium' | 'heavy';
  summary: string;
  code: string;
  lang: string;
}

export interface AgentShowcaseProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: PublishedPageCategory;
  categoryLabel: string;
  authorLabel: string;
  profile: OnboardingProfile;
  userPrompt: string;
  motionSignature: string;
  sourceRefs: MatchedVaultResource[];
  trace: AgentTraceStep[];
  html: string;
}

export interface WorkspaceLaunchSeed {
  kind: 'vault-item' | 'remix-page' | 'showcase-15' | 'motion-recipe';
  id: string;
  title: string;
  prompt: string;
  sourceLibrary?: string;
  html?: string;
  profile?: Partial<OnboardingProfile>;
  sourceCode?: string;
}
