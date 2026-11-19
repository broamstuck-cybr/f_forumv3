import type { SecretFinding, SecretScanResult, WorkspaceFile } from '../types/index';

interface SecretPatternRule {
  ruleId: string;
  description: string;
  regex: RegExp;
}

const SECRET_RULES: SecretPatternRule[] = [
  {
    ruleId: 'SEC_OPENAI_KEY',
    description: 'OpenAI or compatible sk-* API key detected',
    regex: /\bsk-[a-zA-Z0-9_-]{12,}\b/g,
  },
  {
    ruleId: 'SEC_GOOGLE_API_KEY',
    description: 'Google AIza* API key detected',
    regex: /\bAIza[0-9A-Za-z_-]{20,}\b/g,
  },
  {
    ruleId: 'SEC_GITHUB_PAT',
    description: 'GitHub personal access token (ghp_*/github_pat_*) detected',
    regex: /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  },
  {
    ruleId: 'SEC_SLACK_TOKEN',
    description: 'Slack xoxb-*/xoxp-* token detected',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{12,}\b/g,
  },
  {
    ruleId: 'SEC_BEARER_TOKEN',
    description: 'Hardcoded Authorization Bearer token detected',
    regex: /Bearer\s+[A-Za-z0-9._-]{24,}/g,
  },
  {
    ruleId: 'SEC_ENV_ASSIGNMENT',
    description: 'Hardcoded secret assignment in environment configuration',
    regex: /\b(?:AI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|SESSION_SECRET|ADMIN_BOOTSTRAP_PASSWORD)\s*=\s*['"]?[A-Za-z0-9_-]{10,}['"]?/g,
  },
];

function redactMatch(matched: string): string {
  if (matched.length <= 8) return '[REDACTED_SECRET]';
  return `${matched.slice(0, 4)}...[REDACTED]`;
}

export function scanFilesForSecrets(
  files: Array<{ path: string; content: string }>
): SecretScanResult {
  const findings: SecretFinding[] = [];

  for (const file of files) {
    const lines = (file.content || '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const lineText = lines[i];
      for (const rule of SECRET_RULES) {
        rule.regex.lastIndex = 0;
        const match = rule.regex.exec(lineText);
        if (match) {
          findings.push({
            file: file.path,
            line: i + 1,
            ruleId: rule.ruleId,
            description: rule.description,
            snippetRedacted: redactMatch(match[0]),
          });
        }
      }
    }
  }

  return {
    clean: findings.length === 0,
    findings,
    scannedFilesCount: files.length,
  };
}

export function redactSecretsInText(content: string): string {
  let out = content;
  for (const rule of SECRET_RULES) {
    rule.regex.lastIndex = 0;
    out = out.replace(rule.regex, '[REDACTED_SECRET]');
  }
  return out;
}

export function sanitizeFilesForZipExport(files: WorkspaceFile[]): {
  clean: boolean;
  findings: SecretFinding[];
  sanitizedFiles: WorkspaceFile[];
} {
  const scan = scanFilesForSecrets(files);
  const sanitizedFiles = files.map((file) => ({
    ...file,
    content: redactSecretsInText(file.content),
  }));
  return {
    clean: scan.clean,
    findings: scan.findings,
    sanitizedFiles,
  };
}
