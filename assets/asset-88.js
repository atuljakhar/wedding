/**
 * MultiAuth Login — Modal
 *
 * Open / close login modal, overlay click, Escape key.
 * Exposes: window.malForms.openModal, window.malForms.closeModal
 * Depends on: mal-forms.js (window.malForms namespace).
 */
(function () {
    'use strict';

    const mal = window.malForms || {};

    function openModal(redirectUrl) {
        const modal = document.getElementById('mal-login-modal');
        if (!modal) return;

        mal.qsa('input[name="redirect_to"]', modal).forEach(input => {
            input.value = redirectUrl;
        });

        modal.classList.add('mal-modal--open');
        document.body.classList.add('mal-modal-active');

        document.dispatchEvent(
            new CustomEvent('mal:modal:opened', { detail: { redirectUrl } })
        );
    }

    function closeModal() {
        const modal = document.getElementById('mal-login-modal');
        if (!modal) return;

        modal.classList.remove('mal-modal--open');
        document.body.classList.remove('mal-modal-active');

        document.dispatchEvent(new CustomEvent('mal:modal:closed'));
    }

    // Expose for interceptor and other scripts.
    mal.openModal = openModal;
    mal.closeModal = closeModal;

    function init() {
        const modal = document.getElementById('mal-login-modal');
        if (!modal) return;

        // Open triggers (.mal-open-login-modal links)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mal-open-login-modal')) {
                e.preventDefault();
                openModal(window.location.href);
            }
        });

        // Close via X button
        const closeBtn = mal.qs('.mal-modal__close', modal);
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Close via overlay
        const overlay = mal.qs('.mal-modal__overlay', modal);
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }

        // Close via Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('mal-modal--open')) {
                closeModal();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
