# Decisions and Trade-offs

## Goal

Build a complete, accessible FAFSA data-entry form within the assignment's suggested two-hour scope. I intentionally optimized for clarity, correctness, accessibility, and interview maintainability instead of introducing unnecessary abstraction.

## Framework: React + TypeScript + Vite

I chose React because it is part of the company's stated frontend stack and is one of the technologies I am most comfortable explaining and extending in a live interview. TypeScript makes the form model and field names explicit and catches accidental state-shape mistakes. Vite keeps setup and local development minimal.

I did not add a routing layer because the assignment is one focused form and does not require multiple application pages.

## Form state: local React state

The form uses a single `FAFSAFormData` object in `App.tsx`, plus separate state for `errors`, `touched`, and successful submission feedback.

Why:
- The state belongs to one screen.
- Redux or another global store would add ceremony without solving a real problem here.
- Keeping state local makes the data flow easy to explain during code review.

A larger production FAFSA product with multiple routes, saved drafts, server synchronization, or cross-page dependencies could justify a form library or shared state layer.

## Validation strategy

Validation rules live in `src/utils/validation.ts` rather than being embedded throughout the JSX.

Why:
- Keeps business rules separate from presentation.
- Makes the seven required rules directly unit-testable.
- Makes interview extensions such as a new validation rule straightforward.

### Timing

I validate a field on blur, matching the assignment's explicit requirement. After a field has been touched or has an existing error, it is revalidated as the user changes it so an error can disappear immediately after correction.

On submit, the entire form is validated. Submission is prevented until no validation errors remain.

This approach avoids showing errors before the user has interacted with a field while still giving quick feedback after an error has been surfaced.

## Error presentation

Errors appear in two places:

1. Inline next to the relevant field.
2. In an error summary after form submission.

The summary contains links to the fields with errors. This helps users understand the total number of issues and jump directly to a field, which is especially useful in a longer form.

After an invalid submission, keyboard focus moves to the error summary so screen-reader and keyboard users are immediately informed that submission failed.

## Conditional fields

Spouse information is rendered only when marital status is `married`. Parent income is rendered only when dependency status is `dependent`.

When the controlling answer changes so a conditional section is no longer applicable, the hidden values and related errors are cleared.

Why:
- Hidden data should not accidentally be submitted.
- Hidden fields should not continue producing validation errors.
- The visible UI always matches the current business rules.

## Accessibility

The implementation targets the assignment's WCAG 2.1 AA requirement through semantic HTML first and ARIA only where it adds information.

Implemented choices:
- Native `<label>` elements connected with `htmlFor`/`id`.
- Native `<fieldset>` and `<legend>` for radio groups.
- `aria-invalid` on fields with validation errors.
- `aria-describedby` connecting inputs to hint/error text.
- Inline errors use `role="alert"` so newly displayed validation messages are announced.
- The error summary is programmatically focusable and receives focus after a failed submit.
- Visible high-contrast focus outlines are preserved.
- Error state is communicated with text and borders, not color alone.
- Touch targets are at least approximately 44px high.
- Source order and keyboard focus order are the same.
- Native controls are used so Tab, Shift+Tab, Space, Enter, and arrow-key behavior works without custom keyboard handlers.

### Accessibility testing approach

For a submission I would manually test:
- Keyboard-only navigation with Tab / Shift+Tab / Space / Enter / arrow keys.
- Chrome or Edge accessibility tree.
- Lighthouse accessibility audit.
- axe DevTools or WAVE.
- NVDA on Windows if available, verifying labels, legends, conditional fields, inline errors, and error summary announcements.

Automated component tests also verify accessible label lookup and ARIA error associations.

## Responsive layout

The page uses a single-column layout below 640px and a two-column grid for related fields on wider screens. The minimum supported width is 320px as requested.

The submit button becomes full width on mobile for a comfortable touch target.

## SSN handling

The exercise requires SSN entry and format validation. The example intentionally keeps SSN values only in client-side React state and does not persist them in browser storage.

In production, sensitive data would require additional security and compliance review, secure transport, strict backend handling, logging controls, and potentially different masking/display behavior. Those concerns are outside the scope of the client-only take-home assignment.

## Currency handling

Income fields use numeric input plus a visible dollar-prefix presentation. The underlying form state stores the raw numeric string and validation checks that it converts to a non-negative number.

I intentionally did not add locale-aware currency formatting while typing because that would increase implementation complexity and cursor-management edge cases without being required for demonstrating the core validation behavior.

## Component structure

I extracted only components that provide clear reuse or responsibility boundaries:
- `FormField` provides consistent labels, hints, and inline errors.
- `ErrorSummary` owns the top-level validation summary.
- Validation and state-list data live outside the component.

I intentionally did not split every form section into a separate component because the form is still small. Excessive component fragmentation would make the take-home harder to navigate without materially improving reuse.

If the form grew substantially, each section could be moved into a separate component without changing the validation architecture.

## Testing strategy

The project contains two levels of tests:

### Validation unit tests
`validation.test.ts` tests business rules independently from React, including the assignment's valid and invalid sample data.

### Interaction tests
`App.test.tsx` verifies important user behavior:
- spouse fields appear when married is selected;
- parent income appears for dependent applicants;
- blur validation produces an accessible error relationship;
- submitting an invalid form displays the error summary.

The goal is meaningful behavioral coverage rather than maximizing a coverage percentage.

## Submission behavior

There is no API endpoint in the assignment, so a successful form submission shows an in-page success state rather than pretending to send data to a server.

If a backend endpoint were provided, I would add an async submission state with:
- loading/disabled button state;
- server validation error mapping;
- top-level network error handling;
- retry guidance;
- success confirmation;
- protection against duplicate submissions.

## Assumptions

- The state selector includes the 50 U.S. states. The assignment says valid U.S. states; it does not explicitly request Washington, D.C. or U.S. territories.
- Household and college counts must be whole numbers at least 1.
- Income is entered as whole-dollar values for this exercise.
- SSN validation checks the required `XXX-XX-XXXX` format only; it does not attempt to determine whether an SSN is actually issued or valid in government records.
- The assignment does not provide an API, authentication requirements, or persistence requirements, so those are not implemented.

## What I would improve with more time

- Add automated axe-core accessibility checks.
- Add SSN input masking while preserving keyboard/screen-reader usability.
- Add richer currency formatting on blur.
- Add end-to-end tests with Playwright.
- Add a real submission service and server-error handling once an API contract exists.
- Test with multiple screen readers and browser combinations.
- Consider draft persistence only after establishing requirements for safely storing sensitive personal data.
