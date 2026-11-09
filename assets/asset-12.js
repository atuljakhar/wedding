/**
 * MultiAuth Login — Core Form Logic
 *
 * Tabs, sub-tabs, password login, registration, shared helpers.
 * Exposes window.malForms namespace for other scripts (mal-otp, mal-modal, mal-interceptor).
 */
(function () {
    'use strict';

    const data = window.malFormsData || {};
    const mal = window.malForms = {};

    mal.data = data;

    // ── Shared Helpers ──────────────────────────────────────────

    mal.qs = (selector, scope) => (scope || document).querySelector(selector);

    mal.qsa = (selector, scope) => (scope || document).querySelectorAll(selector);

    mal.showMessage = (container, text, type) => {
        const el = mal.qs('.mal-form-message', container);
        if (!el) return;
        el.textContent = text;
        el.className = 'mal-form-message mal-form-message--visible mal-form-message--' + type;
    };

    mal.clearMessage = (container) => {
        const el = mal.qs('.mal-form-message', container);
        if (!el) return;
        el.textContent = '';
        el.className = 'mal-form-message';
    };

    mal.setLoading = (btn, loading, originalText) => {
        btn.disabled = loading;
        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = data.i18n?.sending || 'Please wait...';
        } else {
            btn.textContent = originalText || btn.dataset.originalText || 'Submit';
        }
    };

    mal.postAjax = (action, formData) => {
        formData.append('action', action);
        return fetch(data.ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData,
        }).then(r => r.json());
    };

    /**
     * Start a countdown timer on the resend OTP link inside a form.
     * Disables the link and shows "Resend in Xs" until the cooldown expires.
     *
     * @param {HTMLElement} form  The .mal-form--otp element.
     * @param {number}      secs  Countdown seconds (from server or default 30).
     */
    mal.startResendTimer = (form, secs) => {
        const link = mal.qs('.mal-otp-resend', form);
        const timer = mal.qs('.mal-resend-timer', form);
        if (!link) return;

        // Clear any existing timer on this form.
        mal.clearResendTimer(form);

        link.classList.add('mal-otp-resend--disabled');
        let remaining = secs;

        const update = () => {
            if (timer) {
                timer.textContent = remaining > 0
                    ? (data.i18n?.resendIn || 'Resend in %s sec').replace('%s', remaining)
                    : '';
            }
        };
        update();

        form._malResendInterval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                mal.clearResendTimer(form);
            } else {
                update();
            }
        }, 1000);
    };

    /**
     * Clear an active resend timer on a form and re-enable the link.
     *
     * @param {HTMLElement} form  The .mal-form--otp element.
     */
    mal.clearResendTimer = (form) => {
        if (form._malResendInterval) {
            clearInterval(form._malResendInterval);
            form._malResendInterval = null;
        }
        const link = mal.qs('.mal-otp-resend', form);
        const timer = mal.qs('.mal-resend-timer', form);
        if (link) link.classList.remove('mal-otp-resend--disabled');
        if (timer) timer.textContent = '';
    };

    mal.onLoginSuccess = (response) => {
        const redirect = response.data?.redirect || window.location.href;
        let event;
        try {
            event = new CustomEvent('mal:login:success', {
                detail: response,
                cancelable: true,
            });
            document.dispatchEvent(event);
        } catch (e) {
            console.error('[MAL] mal:login:success listener threw:', e);
        }
        // If a listener called e.preventDefault(), it is handling the redirect itself.
        if (!event || !event.defaultPrevented) {
            window.location.href = redirect;
        }
    };

    // ── Tabs ────────────────────────────────────────────────────

    document.addEventListener('click', (e) => {
        const tab = e.target.closest('.mal-tab');
        if (!tab) return;

        e.preventDefault();
        const wrapper = tab.closest('.mal-inline-form, .mal-modal__container, .mal-login-wall__inner');
        if (!wrapper) return;

        const tabName = tab.dataset.tab;

        mal.qsa('.mal-tab', wrapper).forEach(t => t.classList.remove('mal-tab--active'));
        mal.qsa('.mal-panel', wrapper).forEach(p => p.classList.remove('mal-panel--active'));

        tab.classList.add('mal-tab--active');
        const panel = mal.qs('[data-panel="' + tabName + '"]', wrapper);
        if (panel) panel.classList.add('mal-panel--active');
    });

    // ── Sub-tabs (Password / OTP) ───────────────────────────────

    document.addEventListener('click', (e) => {
        const subTab = e.target.closest('.mal-sub-tab');
        if (!subTab) return;

        e.preventDefault();
        const panel = subTab.closest('.mal-panel');
        if (!panel) return;

        const subName = subTab.dataset.subtab;

        mal.qsa('.mal-sub-tab', panel).forEach(t => t.classList.remove('mal-sub-tab--active'));
        mal.qsa('.mal-subpanel', panel).forEach(p => p.classList.remove('mal-subpanel--active'));

        subTab.classList.add('mal-sub-tab--active');
        const subPanel = mal.qs('[data-subpanel="' + subName + '"]', panel);
        if (subPanel) subPanel.classList.add('mal-subpanel--active');
    });

    // ── Password Login Form ─────────────────────────────────────

    document.addEventListener('submit', (e) => {
        const form = e.target.closest('.mal-form--password');
        if (!form) return;

        e.preventDefault();
        const wrapper = form.closest('.mal-panel');
        const btn = mal.qs('button[type="submit"]', form);
        const originalText = btn.textContent;

        mal.clearMessage(wrapper);
        mal.setLoading(btn, true);

        const fd = new FormData();
        fd.append('nonce', data.nonce);
        fd.append('username', mal.qs('input[name="username"]', form).value);
        fd.append('password', mal.qs('input[name="password"]', form).value);
        fd.append('redirect_to', mal.qs('input[name="redirect_to"]', form).value);

        mal.postAjax('mal_login', fd).then(resp => {
            if (resp.success) {
                mal.onLoginSuccess(resp);
            } else {
                mal.showMessage(wrapper, resp.data?.message || 'Login failed.', 'error');
                mal.setLoading(btn, false, originalText);
            }
        }).catch(() => {
            mal.showMessage(wrapper, 'Network error. Please try again.', 'error');
            mal.setLoading(btn, false, originalText);
        });
    });

    // ── Registration Form (email + password) ─────────────────────

    // Password rules checked on each keystroke.
    const pwRules = {
        length: (v) => v.length >= 8,
        upper: (v) => /[A-Z]/.test(v),
        lower: (v) => /[a-z]/.test(v),
        digit: (v) => /[0-9]/.test(v),
        special: (v) => /[^A-Za-z0-9]/.test(v),
    };

    /** Check all rules for a password field and update its sibling .mal-pw-rules list. */
    function checkPwRules(input) {
        const list = input.closest('.mal-field')?.querySelector('.mal-pw-rules');
        if (!list) return true;
        const val = input.value;
        let allPass = true;
        list.querySelectorAll('li[data-rule]').forEach(li => {
            const fn = pwRules[li.dataset.rule];
            const pass = fn ? fn(val) : true;
            li.classList.toggle('mal-pw-pass', pass);
            if (!pass) allPass = false;
        });
        return allPass;
    }

    // Live feedback as user types.
    document.addEventListener('input', (e) => {
        const input = e.target;
        if (input.name !== 'password' || !input.closest('.mal-form--register')) return;
        checkPwRules(input);
    });

    document.addEventListener('submit', (e) => {
        const form = e.target.closest('.mal-form--register');
        if (!form) return;

        e.preventDefault();
        const wrapper = form.closest('.mal-panel');
        const btn = mal.qs('button[type="submit"]', form);
        const originalText = btn.textContent;
        const pwInput = mal.qs('input[name="password"]', form);

        mal.clearMessage(wrapper);

        // Block submit if password rules not satisfied.
        if (!checkPwRules(pwInput)) {
            mal.showMessage(wrapper, data.i18n?.weakPassword || 'Please meet all password requirements.', 'error');
            pwInput.focus();
            return;
        }

        mal.setLoading(btn, true);

        const fd = new FormData();
        fd.append('nonce', data.nonce);
        fd.append('email', mal.qs('input[name="email"]', form).value);
        fd.append('password', mal.qs('input[name="password"]', form).value);
        fd.append('redirect_to', mal.qs('input[name="redirect_to"]', form).value);

        const phoneInput = mal.qs('input[name="phone"]', form);
        if (phoneInput && phoneInput.value.trim()) {
            fd.append('phone', phoneInput.value.trim());
        }

        mal.postAjax('mal_register', fd).then(resp => {
            if (resp.success) {
                mal.onLoginSuccess(resp);
            } else {
                mal.showMessage(wrapper, resp.data?.message || 'Registration failed.', 'error');
                mal.setLoading(btn, false, originalText);
            }
        }).catch(() => {
            mal.showMessage(wrapper, 'Network error. Please try again.', 'error');
            mal.setLoading(btn, false, originalText);
        });
    });
})();
