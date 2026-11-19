# Student 5 Phase 2 accessibility check report

Scope: the added contact, feedback, sampler, about and FAQ pages. This is a source and behavior review, not WCAG certification of the entire team application.

Implemented checks:

- WCAG 1.3.1 / 3.3.2: visible associated labels, semantic headings, fieldset/legend for flavors, required-field validation and instructions.
- WCAG 3.3.1: inline error text connected to fields with aria-describedby; invalid fields expose aria-invalid. Error summary is announced; focus moves to the first invalid field.
- WCAG 4.1.3: submission status uses a polite live status region; no false sent-email confirmation.
- WCAG 2.1.1: native inputs, checkboxes, buttons, links and FAQ details elements support keyboard operation.
- WCAG 2.4.2 / 2.4.7: new pages set document titles and use the existing visible focus styles with input focus rings.
- Responsive layout uses one-column forms on small screens and two-column field groups from the sm breakpoint. Long content wraps.
- Existing shell supplies skip navigation and document language updates.

Remaining manual review before submission: inspect all new pages at 320px and 200% zoom; traverse with Tab/Shift+Tab; test error announcements with VoiceOver or NVDA; inspect actual rendered contrast with an accessibility checker; confirm Spanish switch behavior. Do not mark these checks as passed without doing them. Browser screenshots and automated accessibility scores are not a substitute for screen-reader testing.
