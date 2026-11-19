CREATE TABLE IF NOT EXISTS ff_users (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ff_quotas (
  subject_id text PRIMARY KEY,
  subject_type text NOT NULL,
  used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ff_community_posts (
  id text PRIMARY KEY,
  channel text NOT NULL,
  title text NOT NULL,
  author jsonb NOT NULL,
  category text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  votes integer NOT NULL DEFAULT 0,
  upvoted_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  body text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  answers_count integer NOT NULL DEFAULT 0,
  is_accepted boolean NOT NULL DEFAULT false,
  accepted_answer jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  likes integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  demo_snippet jsonb,
  forks integer NOT NULL DEFAULT 0,
  file_type text,
  payload text,
  name text,
  slug text,
  lead text,
  members_count integer,
  active_dossier jsonb,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ff_community_reports (
  id text PRIMARY KEY,
  target_id text NOT NULL,
  target_channel text NOT NULL,
  target_title text NOT NULL,
  reason text NOT NULL,
  reporter_id text NOT NULL,
  reporter_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ff_admin_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ff_audit_logs (
  id text PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  detail text NOT NULL
);

CREATE TABLE IF NOT EXISTS ff_changelog (
  id text PRIMARY KEY,
  version text NOT NULL,
  title text NOT NULL,
  notes text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  author text NOT NULL
);

CREATE TABLE IF NOT EXISTS ff_projects (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  active_file_path text NOT NULL DEFAULT 'index.html',
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  attached_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshots jsonb NOT NULL DEFAULT '[]'::jsonb,
  processes jsonb NOT NULL DEFAULT '[]'::jsonb,
  checks jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ff_projects_user_updated ON ff_projects (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ff_community_posts_channel_created ON ff_community_posts (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ff_audit_logs_timestamp ON ff_audit_logs (timestamp DESC);

ALTER TABLE ff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_projects ENABLE ROW LEVEL SECURITY;
