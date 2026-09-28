# DECISIONS.md

## Goal and Scope

The goal of this take-home was to build an accessible, responsive FAFSA data-entry form with clear validation while staying within the suggested two-hour time box.

I intentionally favored a straightforward implementation over additional abstraction or production features. The application focuses on the requirements that can be demonstrated and discussed clearly: form behavior, conditional fields, validation, accessibility, responsive design, and tests.

## Framework: React + TypeScript + Vite

I chose React because it is part of the stated frontend stack and it is a framework I am comfortable explaining and extending during a live interview.

TypeScript is used to make the form data shape, field names, and validation interfaces explicit. This reduces accidental mistakes when updating form state and makes validation functions easier to reason about.

Vite provides a lightweight development environment with minimal setup.

I did not add routing because this assignment represents one focused form and does not require multiple application pages.

## Form Layout

I implemented the form as a single page with clearly separated sections rather than a multi-step wizard.

Reasons:

- The assignment is intentionally time-boxed.
- All required information can be reviewed in one place.
- A single-page form reduces navigation and state-management complexity.
- It is easier to test, demonstrate, and extend.

On wider screens, related fields can be displayed in two columns. On smaller screens, fields stack vertically so the form remains usable at the required 320px minimum width.

## State Management

The form uses local React state rather than Redux or another global state-management solution.

The component maintains separate state for:

- form values;
- validation errors;
- touched fields;
- submission feedback.

This was intentional because all state currently belongs to a single screen. Introducing Redux or another global store would add complexity without solving a problem in this scope.

If the FAFSA flow later became a multi-page application with saved drafts, shared server state, or cross-page dependencies, I would reconsider the state-management approach.

## Validation Architecture

Validation rules are kept in `src/utils/validation.ts` instead of being embedded throughout the JSX.

This provides a few benefits:

- business rules remain separate from rendering logic;
- each rule can be unit tested independently;
- validation behavior can be reused by both individual-field validation and full-form validation;
- adding a new rule is straightforward.

The current implementation uses a `switch` statement for field-level validation. For the size of this form, the approach is explicit and easy to scan. If the application grew significantly, I would consider a validator map or schema-based solution.

## Validation Timing

The assignment explicitly asks for validation on blur, so a field is validated when the user leaves it.

After a field has been touched or already has an error, it is also revalidated while the user corrects the value. This lets an error disappear as soon as the input becomes valid rather than forcing the user to blur the field again.

On submit, the entire form is validated. If any errors remain, submission is prevented.

This provides feedback without immediately showing errors before the user has interacted with the form.

## Numeric Input Decisions

The form contains four numeric fields:

- Number in Household
- Number in College
- Student Income
- Parent Income

I decided to accept digits only in these fields for this exercise.

Instead of relying on `<input type="number">`, the UI uses text inputs with `inputMode="numeric"` and numeric input hints. Native number inputs can allow characters such as `-`, `+`, `.`, `e`, and `E` because those characters are valid in some numeric formats. That behavior is not useful for the data being collected here.

Input values are sanitized before being stored in React state so non-digit characters are not retained.

### Household and college counts

These values represent people, so they must be whole numbers. Decimal values do not make sense for these fields.

Validation still checks that:

- each value is at least 1;
- Number in College does not exceed Number in Household.

### Income values

For this exercise, Student Income and Parent Income are treated as whole-dollar amounts.

The provided sample data uses whole-dollar values, and the assignment does not require cents. Keeping income as whole dollars avoids unnecessary parsing and cursor-management complexity while still meeting the requested validation behavior.

Income is displayed with currency-style grouping on blur where appropriate, while the underlying validation still ensures the value is non-negative.

Input sanitization does not replace validation. Validation remains defensive so invalid data would still be rejected even if it entered the validation layer from somewhere other than the UI.

## SSN Handling

SSN input is limited to nine digits and formatted as `XXX-XX-XXXX` for display.

Validation checks the required format but does not attempt to determine whether the SSN was actually issued or is valid in a government system.

SSNs remain only in client-side React state. They are not stored in localStorage or another persistence mechanism.

In a production FAFSA application, handling SSNs would require additional security, privacy, logging, transport, storage, and compliance considerations outside the scope of this assignment.

## Conditional Fields

Two parts of the form are conditional:

- Spouse information appears only when `Married` is selected.
- Parent Income appears only when `Dependent` is selected.

When a controlling answer changes and a conditional field no longer applies, its stored value and related validation error are cleared.

This prevents hidden data from remaining in the form and prevents hidden fields from causing submission errors.

## Radio Button Keyboard Behavior

Dependency Status and Marital Status use native radio buttons grouped with the same `name` and contained in semantic `<fieldset>` / `<legend>` elements.

I intentionally kept the browser's native keyboard behavior instead of adding custom keyboard handlers.

For a radio group:

- `Tab` moves focus into or out of the group;
- arrow keys move between options in the same group;
- `Space` can select the focused option.

For example, if `Dependent` is selected, pressing `Tab` moves to the next form control rather than moving to `Independent`. A keyboard user can move from `Dependent` to `Independent` with the arrow keys. This is expected native radio-group behavior and avoids creating unnecessary tab stops.

## Error Presentation

Validation errors are presented in two ways.

### Inline errors

An error appears close to the field that caused it so the user can immediately understand what needs to be fixed.

Fields with errors use `aria-invalid`, and the error text is associated with the field through `aria-describedby`.

### Error summary

When an invalid form is submitted, an error summary appears near the top of the form. The summary lists the fields that need attention and provides links back to them.

Keyboard focus moves to the error summary after a failed submit so keyboard and screen-reader users are immediately informed that the form was not submitted.

## Accessibility Approach

The application targets the requested WCAG 2.1 AA level by using semantic HTML first and ARIA only where it adds useful context.

Implemented choices include:

- native `<label>` elements associated with inputs;
- `<fieldset>` and `<legend>` for related radio-button groups;
- `aria-invalid` on invalid controls;
- `aria-describedby` for hints and validation messages;
- inline error messages announced through an alert role;
- a programmatically focusable error summary;
- logical DOM and keyboard focus order;
- visible focus indicators;
- error communication through text rather than color alone;
- native interactive controls rather than custom replacements;
- mobile-friendly touch targets.

### Keyboard testing

The intended manual keyboard test is:

- navigate the entire form using `Tab` and `Shift+Tab`;
- use arrow keys inside radio groups;
- use `Space` to change a radio selection when necessary;
- submit the form using the keyboard;
- verify focus moves to the error summary after an invalid submission;
- verify error-summary links move focus to the appropriate field.

## Time Spent

Approximately 2 hours of implementation time, followed by final build/test verification.

## Accessibility Testing Performed

I manually tested keyboard navigation using Tab, Shift+Tab, arrow keys,
Space, and Enter. I verified focus order, native radio-group behavior,
validation messaging, and focus movement to the error summary.

Due to the exercise time limit, I did not complete a full NVDA, axe,
WAVE, or Lighthouse audit.

## Form Submission

The assignment does not provide an API endpoint, so this implementation does not pretend to send FAFSA data to a backend.

The primary action should be labeled `Submit Application` because the current implementation performs validation and then completes the client-side submission flow. A label such as `Review Application` would imply a separate review step, which this time-boxed implementation does not include.

If a real API were available, I would add:

- an async loading state;
- prevention of duplicate submission;
- server-side validation error mapping;
- network-error handling and retry guidance;
- a success response/confirmation flow.

If a product requirement later introduced a true review step, I would add an intermediate summary screen with `Back to Edit` and `Submit Application` actions.

## Component Structure

I extracted components where there is meaningful reuse or a clear responsibility boundary.

### `FormField`

Handles consistent rendering of:

- labels;
- required indicators;
- hints;
- inline errors.

### `ErrorSummary`

Handles the top-level submission error summary and links back to invalid fields.

### Validation utilities

Business rules live outside the React component so they are easier to test and extend.

I intentionally did not split every form section into its own component because the current form is still small. Excessive component fragmentation would add navigation overhead without providing meaningful reuse.

If the form grew substantially, sections such as Student Information, Household Information, and Financial Information could be extracted without changing the overall validation approach.

## Testing Strategy

The project uses two levels of tests.

### `validation.test.ts`

Validation unit tests cover business rules independently from React, including the valid and invalid sample scenarios supplied in the assignment.

Examples include:

- age requirement;
- SSN format;
- required parent income for dependent students;
- non-negative income;
- household/college relationship;
- state validation;
- spouse requirements for married students.

These tests remain defensive even though the UI sanitizes numeric input. For example, validation should still reject an invalid or negative value if one somehow reaches the validation layer.

### `App.test.tsx`

Interaction tests cover important user-facing behavior, including:

- conditional spouse fields;
- conditional parent-income field;
- validation on blur;
- accessible error relationships;
- invalid-submit error summary;
- numeric fields retaining digits only;
- whole-dollar income formatting.

Each test gets a fresh render of the application so state does not leak between tests. Sharing one rendered `<App />` instance across multiple tests would make the tests order-dependent and could cause selections, values, or errors from one test to affect another.

## Responsive Design

The form is designed to work from 320px wide mobile screens through desktop layouts.

On narrow screens:

- fields stack vertically;
- the primary action expands to a comfortable width;
- content remains readable without horizontal scrolling.

On wider screens, related fields use a multi-column layout where space allows.

## Assumptions

- Number in Household and Number in College are whole-number counts.
- Student Income and Parent Income are whole-dollar amounts for this exercise.
- Income values cannot be negative.
- The state selector includes the 50 U.S. states. The assignment does not explicitly request Washington, D.C. or U.S. territories.
- SSN validation checks format only.
- No backend, authentication, or persistence requirements were provided.
- No review screen is required, so the primary action submits the form after successful validation.

## Trade-offs Made for the Two-Hour Limit

I intentionally did not add:

- Redux or another global state library;
- React Hook Form or another form framework;
- a multi-step wizard;
- a separate review page;
- draft persistence;
- API integration without an API contract;
- complex input-mask libraries;
- automated axe integration;
- end-to-end browser tests.

These could all be reasonable production additions, but they would add implementation time and complexity without being necessary to demonstrate the required behavior.

## What I Would Improve With More Time

- Add automated axe-core accessibility tests.
- Test the complete flow with NVDA and other screen readers.
- Add Playwright end-to-end tests.
- Add a real submission service once an API contract exists.
- Add server-error and retry behavior.
- Consider a true review step if required by product design.
- Add stronger privacy/security controls around sensitive information in a production environment.
- Revisit state management if the FAFSA flow expands to multiple pages or draft persistence.
