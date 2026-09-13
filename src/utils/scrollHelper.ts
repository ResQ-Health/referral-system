/**
 * scrollHelper.ts
 * Utility to ensure consistent scroll-to-top behavior across page transitions and modal openings.
 */

export function scrollToTop() {
  if (typeof window === 'undefined') return;

  // 1. Reset standard window and document root scroll
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
  }

  // 2. Reset all scrollable modal overlay and drawer containers (both desktop and mobile)
  const modalScrollSelectors = [
    '.modal-backdrop',
    '.modal-card-resq',
    '.modal-card-type',
    '.modal-card-drafts',
    '.referral-type-modal-card',
    '.clinician-profile-modal-card',
    '.referral-details-modal',
    '.marketplace-booking-modal',
    '.booking-modal-backdrop',
    '.req-doc-modal-overlay',
    '.req-doc-modal-container',
    '.marketplace-facility-drawer',
    '.booking-summary-layout',
    '.referral-review-fullpage',
    '.marketplace-layout',
    '.clinician-layout'
  ];

  modalScrollSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el && 'scrollTop' in el) {
        (el as HTMLElement).scrollTop = 0;
      }
    });
  });
}
