// This file MUST be the first import in server.js / index.js.
// ES Module `import` statements are hoisted — the only guaranteed way to run
// dotenv before other modules read `process.env` is via a dedicated loader module.
import 'dotenv/config';
