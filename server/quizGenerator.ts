import Anthropic from '@anthropic-ai/sdk';

// Lazy-load Anthropic client to avoid startup errors if API key is missing
function getClaudeClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are an expert educational content creator.

Your task is to generate a multiple choice quiz based strictly on the given topic.

Rules:
1. Generate exactly 15 questions (5 per difficulty level).
2. Divide questions into 3 difficulty levels:
   - low difficulty: 5 questions (basic facts, definitions, locations)
   - medium difficulty: 5 questions (explanations, comparisons, relationships)
   - hard difficulty: 5 questions (analysis, reasoning, inference)
3. Each question MUST have:
   - id (number from 1-15)
   - difficulty ("low" | "medium" | "hard")
   - question (string - the question text)
   - options (array of exactly 4 strings - the answer choices)
   - correctAnswer (number 0-3 - index of the correct option)
4. Make sure:
   - All 4 options are plausible
   - Only ONE option is correct
   - Options are randomized (correct answer not always in same position)
   - Questions are clear and unambiguous
5. You MUST respond ONLY with valid JSON in the following format (no markdown, no extra text):

{
  "topic": "<topic>",
  "questions": [
    {
      "id": 1,
      "difficulty": "low",
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": 2
    },
    {
      "id": 2,
      "difficulty": "low",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0
    }
  ]
}`;

export interface Question {
  id: number;
  difficulty: 'low' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  topic: string;
  questions: Question[];
}

export async function generateQuiz(topic: string): Promise<Quiz> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.4,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a quiz for the topic: ${topic}

Remember: Respond ONLY with the JSON object, no markdown formatting, no explanations.`
      }
    ]
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude');
  }

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonText = content.text.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  const quiz = JSON.parse(jsonText);
  return quiz;
}

export function validateQuiz(quiz: Quiz): boolean {
  const questions = quiz.questions || [];

  if (questions.length !== 15) {
    console.log(`Validation failed: Expected 15 questions, got ${questions.length}`);
    return false;
  }

  const counts: Record<string, number> = { low: 0, medium: 0, hard: 0 };
  for (const q of questions) {
    counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;

    // Validate question structure
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
      console.log(`Validation failed: Question ${q.id} has invalid structure`);
      return false;
    }

    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      console.log(`Validation failed: Question ${q.id} has invalid correctAnswer`);
      return false;
    }
  }

  if (counts.low !== 5 || counts.medium !== 5 || counts.hard !== 5) {
    console.log(`Validation failed: Expected 5 questions per difficulty, got low=${counts.low}, medium=${counts.medium}, hard=${counts.hard}`);
    return false;
  }

  return true;
}

export async function generateQuizWithRetry(
  topic: string,
  retries: number = 2
): Promise<Quiz> {
  for (let i = 0; i < retries; i++) {
    try {
      const quiz = await generateQuiz(topic);
      if (validateQuiz(quiz)) {
        return quiz;
      }
      console.log(`Quiz validation failed on attempt ${i + 1}, retrying...`);
    } catch (error) {
      console.error(`Quiz generation attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        throw error;
      }
    }
  }
  throw new Error('Quiz generation failed after retries');
}
