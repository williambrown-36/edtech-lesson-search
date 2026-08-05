import assert from "node:assert/strict";
import test from "node:test";

import { rankLessons, type EmbeddedLesson } from "../src/lesson_ranking.ts";

test("ranks the lesson closest to the query first", () => {
  const lessons: EmbeddedLesson[] = [
    {
      id: "writing",
      title: "Revision workshop",
      text: "Peer feedback for a second draft.",
      embedding: [0, 1],
    },
    {
      id: "math",
      title: "Fraction models",
      text: "Compare fractions on a number line.",
      embedding: [1, 0],
    },
  ];

  const results = rankLessons(lessons, [0.9, 0.1], 1);

  assert.equal(results.length, 1);
  assert.equal(results[0]?.id, "math");
  assert.ok((results[0]?.score ?? 0) > 0.9);
});

test("rejects vectors with different dimensions", () => {
  const lessons: EmbeddedLesson[] = [
    {
      id: "science",
      title: "Plant energy",
      text: "Observe photosynthesis.",
      embedding: [1, 0, 0],
    },
  ];

  assert.throws(
    () => rankLessons(lessons, [1, 0], 1),
    /matching dimensions/,
  );
});
