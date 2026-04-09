# Testing setup

- `npm test` runs the Vitest suite for unit, route, and component tests.
- `npm run test:coverage` generates a coverage report in `coverage/`.
- `npm run test:e2e` runs Playwright smoke tests against a local Next dev server.
- `npm run test:e2e:report` opens the Playwright HTML report after a run.

## Environment

- Vitest defaults `SKIP_ENV_VALIDATION=true`, so mocked tests do not need production credentials.
- Copy `.env.test.example` to `.env.test` if you want a dedicated test env file.
- Playwright uses the real app, so it expects working app env values and seeded admin credentials.

## Suggested workflow

- `npm run db:seed` to ensure the admin account exists.
- `npm test` for fast feedback during development.
- Use readable scenario names so the console output doubles as a feature checklist.
- `npm run test:e2e` before merging UI or auth flow changes.
- Open `playwright-report/` when a browser flow fails to inspect the trace, screenshot, and video.
