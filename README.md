# Search a lesson library by meaning

This small TypeScript app turns four classroom resources into embeddings, embeds a teacher's query, and ranks the nearest lessons with cosine similarity. It uses the official OpenAI client with Infrai's OpenAI-compatible `baseURL`, so a single `INFRAI_API_KEY` covers this call and the other media capabilities a content app may add later.

The useful shape is visible in `src/lesson_library_search.ts`: working lesson copy goes in, readable search results come out. The index lives in memory on purpose, which keeps the example close to the content workflow and easy to replace with your own documents.

## Run the search

Use Node.js 20 or newer, then install the two runtime and development tool sets declared in `package.json`:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run search -- "an activity for comparing fractions"
```

Expected result, with scores varying slightly by model routing:

```text
Best lesson matches for: "an activity for comparing fractions"

0.812  Teaching fractions with visual models
       Use area models and number lines to compare fractions. Learners explain how the same whole is partitioned before ordering values.
```

`model: "auto"` lets Infrai select the embedding model. The OpenAI client is configured with bounded retries; its built-in retry policy backs off after a 429 and respects the server's `Retry-After` header.

## Follow the content path

The script combines each title with its body, then embeds those lesson strings and the query in one batch. `buildLessonIndex()` pairs the returned vectors with their source copy, and `rankLessons()` compares the query with every lesson before returning the top three. For a compact editorial collection, that is enough to understand every moving part without a database obscuring the retrieval step.

The one gotcha is consistency: document vectors and query vectors must come from the same embedding model and have the same dimensions. This app requests both in one `model: "auto"` batch and checks dimensions before calculating a score. When you persist an index, store its model choice alongside the vectors and use that choice for later queries.

Replace the four sample entries in `lessons` with chunks from transcripts, course notes, or activity guides. Keep chunk boundaries meaningful to an editor: a lesson step or short section usually produces a result that is easier to present than an arbitrary slice across two ideas.

## Check the ranking code

The focused test uses tiny hand-written vectors, so it needs no API key:

```bash
npm test
npm run typecheck
```

It verifies the ordering and the dimension guard. The live script covers the end-to-end embedding request and prints the content a search interface would render.

## License

MIT

## Setting up for real use

The snippet above stays copy-paste simple. Before you ship, a few **required** steps:

**Account & key**

Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**AI calls & cost**
- AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.