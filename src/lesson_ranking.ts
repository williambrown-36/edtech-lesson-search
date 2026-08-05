export type LessonDocument = {
  id: string;
  title: string;
  text: string;
};

export type EmbeddedLesson = LessonDocument & {
  embedding: number[];
};

export type SearchResult = LessonDocument & {
  score: number;
};

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    throw new Error("Embeddings must be non-empty and have matching dimensions.");
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (leftValue === undefined || rightValue === undefined) {
      throw new Error("Embedding dimension is missing.");
    }
    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  if (denominator === 0) {
    throw new Error("Embeddings must have non-zero magnitude.");
  }

  return dotProduct / denominator;
}

export function rankLessons(
  lessons: EmbeddedLesson[],
  queryEmbedding: number[],
  limit: number,
): SearchResult[] {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Search limit must be a positive integer.");
  }

  return lessons
    .map(({ embedding, ...lesson }) => ({
      ...lesson,
      score: cosineSimilarity(embedding, queryEmbedding),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
