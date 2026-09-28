# FAFSA Application Form

Accessible React + TypeScript implementation of the FAFSA take-home assignment.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Test

```bash
npm test
```

## Production build

```bash
npm run build
```

## Key behavior

- Validates fields on blur.
- Revalidates touched fields while the user corrects them.
- Shows inline field errors and a linked error summary on submit.
- Conditionally shows spouse fields for married applicants.
- Conditionally shows parent income for dependent applicants.
- Supports keyboard navigation and screen-reader error associations.
- Responsive from 320px through desktop layouts.

See `DECISIONS.md` for implementation decisions, accessibility notes, trade-offs, and assumptions.
