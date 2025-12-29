// ============================================
// Claude AI Integration
// ============================================

import { APIError, ERRORS } from './errors';
import type { ClaudeActionType, DraftContext } from '../../../shared/types';

export function isClaudeEnabled(): boolean {
  return !!process.env.CLAUDE_API_KEY;
}

export async function invokeClaudeAction(
  actionType: ClaudeActionType,
  input: string,
  context?: DraftContext
): Promise<{ output: string; statusTag: string }> {
  if (!isClaudeEnabled()) {
    throw new APIError(503, 'Claude integration is not configured.');
  }

  try {
    const prompt = buildPrompt(actionType, input, context);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: getMaxTokens(actionType),
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw ERRORS.CLAUDE_UNAVAILABLE;
    }

    const data = await response.json();
    const output = data.content[0].text;

    return {
      output,
      statusTag: getStatusTag(actionType),
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw ERRORS.CLAUDE_TIMEOUT;
  }
}

function buildPrompt(
  actionType: ClaudeActionType,
  input: string,
  context?: DraftContext
): string {
  switch (actionType) {
    case 'SUMMARIZE':
      return `You are helping a researcher synthesize their notes. Please provide a brief, coherent reflection on the following notes in 20-30 words. Focus on the main themes and insights.

Notes:
${input}

Provide only the reflection, without any preamble or explanation.`;

    case 'DRAFT':
      return `You are helping a researcher prepare a first draft. Using the notes and context provided below, write a draft of maximum 150 words.

Purpose: ${context?.purpose || 'General'}
Role: ${context?.role || 'Researcher'}
Tone: ${context?.tone || 'Academic'}

Notes:
${input}

Provide only the draft text, without any preamble or explanation.`;

    case 'REWRITE':
      return `You are helping a researcher improve clarity. Please rewrite the following text to improve its clarity while preserving the original meaning and tone.

Text:
${input}

Provide only the rewritten text, without any preamble or explanation.`;

    case 'CRITIQUE':
      return `You are helping a researcher improve their argumentation. Please provide a logical critique of the following text. Identify up to 5 specific points, with each point being maximum 20 words.

Text:
${input}

Format your response as a numbered list. Provide only the critique points, without any preamble or conclusion.`;

    default:
      throw new APIError(400, `Unknown action type: ${actionType}`);
  }
}

function getMaxTokens(actionType: ClaudeActionType): number {
  switch (actionType) {
    case 'SUMMARIZE':
      return 100; // ~20-30 words
    case 'DRAFT':
      return 300; // ~150 words
    case 'REWRITE':
      return 500; // Variable based on input
    case 'CRITIQUE':
      return 200; // 5 points × ~20 words
    default:
      return 200;
  }
}

function getStatusTag(actionType: ClaudeActionType): string {
  switch (actionType) {
    case 'SUMMARIZE':
      return 'STATUS: Reflection';
    case 'DRAFT':
      return 'STATUS: Draft for Editing';
    case 'REWRITE':
      return 'STATUS: Rewrite Suggestion';
    case 'CRITIQUE':
      return 'STATUS: Critique Points';
    default:
      return 'STATUS: Output';
  }
}
