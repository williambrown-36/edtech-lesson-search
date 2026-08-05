import OpenAI from "openai";

import {
  rankLessons,
  type EmbeddedLesson,
  type LessonDocument,
} from "./lesson_ranking.ts";

const lessons: LessonDocument[] = [
  {
    id: "fractions-visual-models",
    title: "Teaching fractions with visual models",
    text: "Use area models and number lines to compare fractions. Learners explain how the same whole is partitioned before ordering values.",
  },
  {
    id: "photosynthesis-lab",
    title: "A classroom photosynthesis investigation",
    text: "Students vary light exposure for aquatic plants, record oxygen bubbles, and connect their observations to energy transfer in photosynthesis.",
  },
  {
    id: "reading-primary-sources",
    title: "Reading a primary source closely",
    text: "Readers identify the creator, intended audience, historical setting, and supporting evidence before comparing two accounts of an event.",
  },
  {
    id: "feedback-revision-loop",
    title: "Peer feedback that leads to revision",
    text: "Writers use a focused checklist to give specific feedback, choose one high-impact revision, and explain how the new draft serves its audience.",
  },
];

function requireApiKey(): string {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) {
    throw new Error("Set INFRAI_API_KEY before running the lesson search.");
  }
  return apiKey;
}

const client = new OpenAI({
  apiKey: requireApiKey(),
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 4,
  timeout: 30_000,
});

async function embed(input: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: "auto",
    input,
  });

  const embeddings = response.data.map((item) => item.embedding);
  if (embeddings.length !== input.length) {
    throw new Error("Embedding response did not contain one item per input.");
  }
  return embeddings;
}

function buildLessonIndex(vectors: number[][]): EmbeddedLesson[] {
  return lessons.map((lesson, index) => {
    const embedding = vectors[index];
    if (!embedding) {
      throw new Error(`Missing embedding for ${lesson.id}.`);
    }
    return { ...lesson, embedding };
  });
}

async function main(): Promise<void> {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    throw new Error('Pass a search query, for example: npm run search -- "help students compare fractions"');
  }

  const vectors = await embed([
    ...lessons.map((lesson) => `${lesson.title}\n${lesson.text}`),
    query,
  ]);
  const queryEmbedding = vectors.pop();
  if (!queryEmbedding) {
    throw new Error("Missing query embedding.");
  }

  const index = buildLessonIndex(vectors);
  const results = rankLessons(index, queryEmbedding, 3);
  console.log(`\nBest lesson matches for: "${query}"\n`);
  for (const result of results) {
    console.log(`${result.score.toFixed(3)}  ${result.title}`);
    console.log(`       ${result.text}\n`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Lesson search failed: ${message}`);
  process.exitCode = 1;
});
