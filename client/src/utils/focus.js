/**
 * focusFirstInvalid(form) - after a failed submit, moves keyboard focus to the
 * first field marked aria-invalid="true", so keyboard and screen-reader users
 * land on the problem right away (supports WCAG 3.3.1 Error Identification).
 * Waits one frame so React has rendered the error states first.
 */
export function focusFirstInvalid(form) {
  requestAnimationFrame(() => {
    form?.querySelector('[aria-invalid="true"]')?.focus();
  });
}
