/**
 * MultiAuth Login - OTP Flow (3-step: channel pick -> phone -> verify)
 *
 * Step 1: User picks a channel card (WhatsApp / SMS).
 *         -> JS only: stores chosen channel in hidden input, marks card selected,
 *            updates the channel-name label on the phone step, advances to step 2.
 *
 * Step 2: User enters phone and clicks "Send OTP".
 *         -> AJAX mal_send_otp_channel validates phone server-side and dispatches
 *            the OTP via the previously chosen channel.
 *
 * Step 3: User enters OTP and clicks "Verify & Login".
 *         -> AJAX mal_verify_otp checks code, creates session, redirects.
 *
 * Depends on: mal-forms.js (window.malForms namespace, window.malFormsData).
 */
(function () {
    'use strict';

    const data = window.malFormsData || {};
    const mal = window.malForms || {};

    // -- Helpers --------------------------------------------------------------

    /**
     * Show a specific OTP step and hide all others within the form.
     */
    function showStep(form, stepClass) {
        form.querySelectorAll('.mal-otp-step').forEach(el => {
            el.classList.toggle('mal-otp-step--active', el.classList.contains(stepClass));
        });
    }

    /**
     * Toggle the visual "selected" state on the channel cards.
     */
    function markSelectedCard(form, channel) {
        form.querySelectorAll('.mal-channel-card').forEach(c => {
            c.classList.toggle('mal-channel-card--selected', c.dataset.channel === channel);
        });
    }

    /**
     * Persist the chosen channel on the form's hidden input. The phone-entry
     * step's `data-current-channel` attribute drives all channel-dependent UI
     * (subtitle channel name, send-button label/icon, alternate-channel switch
     * card) via CSS, so we just set that attribute here too.
     */
    function setChannel(form, channel) {
        let input = mal.qs('input[name="otp_channel"]', form);
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'otp_channel';
            form.appendChild(input);
        }
        input.value = channel;

        const phoneStep = form.querySelector('.mal-otp-step--phone');
        if (phoneStep) {
            phoneStep.dataset.currentChannel = channel;
        }

        // Verify step also reads the channel via data attribute (controls the
        // channel name inside the success banner + subtitle).
        const verifyStep = form.querySelector('.mal-otp-step--verify');
        if (verifyStep) {
            verifyStep.dataset.currentChannel = channel;
        }

        markSelectedCard(form, channel);
    }

    /**
     * Format a 10-digit Indian mobile number as "+91 XXXXX XXXXX".
     */
    function formatPhoneDisplay(digits) {
        if (!digits || digits.length !== 10) return '+91 ' + (digits || '');
        return '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5);
    }

    /**
     * Show & populate the green "OTP sent successfully" banner on the verify
     * step. Channel name in the banner is driven via data-current-channel + CSS.
     */
    function showSentBanner(form, mobile) {
        const banner = form.querySelector('.mal-otp-sent');
        if (!banner) return;
        const phoneEl = banner.querySelector('.mal-otp-sent__phone');
        if (phoneEl) phoneEl.textContent = formatPhoneDisplay(mobile);
        banner.hidden = false;
    }

    /**
     * Read the 6 boxed inputs and write their concatenated value into the
     * hidden `otp` input. Returns the digit string.
     */
    function syncOtpFromBoxes(form) {
        const boxes = form.querySelectorAll('.mal-otp-box');
        let value = '';
        boxes.forEach(b => { value += (b.value || '').replace(/\D/g, ''); });
        const hidden = mal.qs('input[name="otp"]', form);
        if (hidden) hidden.value = value;
        return value;
    }

    /**
     * Reset the boxed OTP inputs and the hidden combined value.
     */
    function clearOtpBoxes(form) {
        form.querySelectorAll('.mal-otp-box').forEach(b => { b.value = ''; });
        const hidden = mal.qs('input[name="otp"]', form);
        if (hidden) hidden.value = '';
    }

    /**
     * Move keyboard focus to the first empty (or first) OTP box.
     */
    function focusFirstOtpBox(form) {
        const boxes = form.querySelectorAll('.mal-otp-box');
        for (let i = 0; i < boxes.length; i++) {
            if (!boxes[i].value) { try { boxes[i].focus(); } catch (e) { } return; }
        }
        if (boxes.length) { try { boxes[0].focus(); } catch (e) { } }
    }

    /**
     * Send `mal_send_otp_channel` AJAX for the chosen channel.
     * On success advances to the verify step and starts resend timer.
     */
    function sendOtpChannel(form, mobile, channel, sendBtn, originalText) {
        const wrapper = form.closest('.mal-panel') || form.closest('.mal-modal__container') || form.parentElement;

        mal.clearMessage(wrapper);

        const fd = new FormData();
        fd.append('action', 'mal_send_otp_channel');
        fd.append('nonce', mal.qs('input[name="mal_otp_nonce_field"]', form).value);
        fd.append('mobile', mobile);
        fd.append('channel', channel);

        fetch(data.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: fd })
            .then(r => r.json())
            .then(resp => {
                if (sendBtn) mal.setLoading(sendBtn, false, originalText);
                if (resp.success) {
                    clearOtpBoxes(form);
                    showSentBanner(form, mobile);
                    showStep(form, 'mal-otp-step--verify');
                    focusFirstOtpBox(form);
                    mal.startResendTimer(form, resp.data?.cooldown || 30);
                } else {
                    mal.showMessage(wrapper, resp.data?.message || 'Failed to send OTP.', 'error');
                }
            })
            .catch(() => {
                if (sendBtn) mal.setLoading(sendBtn, false, originalText);
                mal.showMessage(wrapper, 'Network error. Please try again.', 'error');
            });
    }

    // -- Step 1: Channel card click ------------------------------------------
    //
    // Tapping a card stores the chosen channel and advances to the phone step.
    // This is purely a JS state change - no AJAX is fired here, so we don't
    // burn rate-limit attempts before the user has even entered a phone number.

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mal-channel-card');
        if (!card) return;

        e.preventDefault();
        const form = card.closest('.mal-form--otp');
        if (!form) return;

        const channel = card.dataset.channel;
        if (!channel) return;

        setChannel(form, channel);
        showStep(form, 'mal-otp-step--phone');

        // Auto-focus the phone input for a smoother flow.
        const phoneInput = mal.qs('input[name="phone"]', form);
        if (phoneInput) {
            try { phoneInput.focus(); } catch (e) { /* ignore */ }
        }
    });

    // -- Step 2: "Send OTP" button -------------------------------------------
    //
    // Validates phone client-side, then dispatches mal_send_otp_channel using
    // the channel already stored on the form from step 1.

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.mal-otp-send');
        if (!btn) return;

        e.preventDefault();
        const form = btn.closest('.mal-form--otp');
        if (!form) return;

        const wrapper = form.closest('.mal-panel') || form.closest('.mal-modal__container') || form.parentElement;
        const phoneInput = mal.qs('input[name="phone"]', form);
        const phone = phoneInput.value.replace(/\D/g, '');

        if (phone.length !== 10) {
            mal.showMessage(wrapper, 'Please enter a valid 10-digit phone number.', 'error');
            return;
        }

        // Resolve channel: hidden input first, then intro step's default attr,
        // then a hard-coded fallback. Should always be set by step 1, this is
        // defence-in-depth in case someone deep-links into the phone step.
        const channelInput = mal.qs('input[name="otp_channel"]', form);
        const introStep = form.querySelector('.mal-otp-step--intro');
        const channel = (channelInput && channelInput.value)
            || (introStep && introStep.dataset.defaultChannel)
            || 'whatsapp';

        mal.clearMessage(wrapper);
        const originalText = btn.textContent;
        mal.setLoading(btn, true);

        sendOtpChannel(form, phone, channel, btn, originalText);
    });

    // -- "Change method" link on phone step ----------------------------------
    //
    // Goes back to the intro/channel-pick step. Phone value is preserved so the
    // user doesn't have to retype it after switching channels.

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.mal-channel-change');
        if (!link) return;

        e.preventDefault();
        const form = link.closest('.mal-form--otp');
        if (!form) return;

        const wrapper = form.closest('.mal-panel') || form.closest('.mal-modal__container') || form.parentElement;
        mal.clearMessage(wrapper);
        showStep(form, 'mal-otp-step--intro');
    });

    // -- In-step channel switch (phone step "Send via X instead" card) -------
    //
    // Lets the user toggle WhatsApp <-> SMS without bouncing back to step 1.
    // Pure JS state change, no AJAX. Phone value stays in the field.

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.mal-channel-switch');
        if (!btn) return;

        e.preventDefault();
        const form = btn.closest('.mal-form--otp');
        if (!form) return;

        const channelInput = mal.qs('input[name="otp_channel"]', form);
        const current = (channelInput && channelInput.value) || 'whatsapp';
        const next = current === 'whatsapp' ? 'sms' : 'whatsapp';

        setChannel(form, next);
    });

    // -- Step 3: Verify OTP --------------------------------------------------

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.mal-otp-verify');
        if (!btn) return;

        e.preventDefault();
        const form = btn.closest('.mal-form--otp');
        if (!form) return;

        const wrapper = form.closest('.mal-panel') || form.closest('.mal-modal__container') || form.parentElement;
        const phone = mal.qs('input[name="phone"]', form).value.replace(/\D/g, '');
        const otp = syncOtpFromBoxes(form);
        const redirectTo = mal.qs('input[name="redirect_to"]', form)?.value || '';

        if (otp.length < 4) {
            mal.showMessage(wrapper, 'Please enter a valid OTP.', 'error');
            return;
        }

        mal.clearMessage(wrapper);
        const originalText = btn.textContent;
        mal.setLoading(btn, true);
        btn.textContent = data.i18n?.verifying || 'Verifying...';

        const fd = new FormData();
        fd.append('action', 'mal_verify_otp');
        fd.append('nonce', mal.qs('input[name="mal_otp_nonce_field"]', form).value);
        fd.append('mobile', phone);
        fd.append('otp', otp);
        if (redirectTo) fd.append('redirect_to', redirectTo);

        fetch(data.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: fd })
            .then(r => r.json())
            .then(resp => {
                if (resp.success) {
                    mal.onLoginSuccess(resp);
                } else {
                    mal.showMessage(wrapper, resp.data?.message || 'Invalid OTP.', 'error');
                    mal.setLoading(btn, false, originalText);
                }
            })
            .catch(() => {
                mal.showMessage(wrapper, 'Network error. Please try again.', 'error');
                mal.setLoading(btn, false, originalText);
            });
    });

    // -- Resend OTP ----------------------------------------------------------

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.mal-otp-resend');
        if (!link) return;

        e.preventDefault();
        const form = link.closest('.mal-form--otp');
        if (!form) return;

        const wrapper = form.closest('.mal-panel') || form.closest('.mal-modal__container') || form.parentElement;
        const phone = mal.qs('input[name="phone"]', form).value.replace(/\D/g, '');

        mal.clearMessage(wrapper);

        clearOtpBoxes(form);
        focusFirstOtpBox(form);

        if (link.classList.contains('mal-otp-resend--disabled')) return;

        const fd = new FormData();
        fd.append('action', 'mal_resend_otp');
        fd.append('nonce', mal.qs('input[name="mal_otp_nonce_field"]', form).value);
        fd.append('mobile', phone);

        link.classList.add('mal-otp-resend--disabled');

        fetch(data.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: fd })
            .then(r => r.json())
            .then(resp => {
                if (resp.success) {
                    showSentBanner(form, phone);
                    mal.startResendTimer(form, resp.data?.cooldown || 30);
                } else {
                    if (resp.data?.cooldown) {
                        mal.startResendTimer(form, resp.data.cooldown);
                    } else {
                        link.classList.remove('mal-otp-resend--disabled');
                    }
                    mal.showMessage(wrapper, resp.data?.message || 'Failed to resend OTP.', 'error');
                }
            })
            .catch(() => {
                link.classList.remove('mal-otp-resend--disabled');
                mal.showMessage(wrapper, 'Network error. Please try again.', 'error');
            });
    });

    // -- Change phone number (from verify step) ------------------------------
    //
    // Resets the OTP code and bounces back to the phone-entry step. Channel
    // selection is preserved.

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.mal-otp-change-phone');
        if (!link) return;

        e.preventDefault();
        const form = link.closest('.mal-form--otp');
        if (!form) return;

        const wrapper = form.closest('.mal-panel') || form.closest('.mal-modal__container') || form.parentElement;

        clearOtpBoxes(form);

        // Hide the success banner so the next "Send OTP" press re-shows a
        // freshly-populated one for the (possibly new) phone number.
        const banner = form.querySelector('.mal-otp-sent');
        if (banner) banner.hidden = true;

        mal.clearMessage(wrapper);
        showStep(form, 'mal-otp-step--phone');
    });

    // -- OTP boxes: auto-advance, backspace, paste, auto-submit --------------
    //
    // Six single-digit inputs feed a hidden combined `otp` field (read by the
    // verify handler). When the user fills the last box the form auto-submits
    // for a faster login feel.

    function getBoxes(form) {
        return Array.from(form.querySelectorAll('.mal-otp-box'));
    }

    document.addEventListener('input', (e) => {
        const box = e.target.closest('.mal-otp-box');
        if (!box) return;
        const form = box.closest('.mal-form--otp');
        if (!form) return;

        // Strip non-digits, keep only the last char (handles browsers that let
        // the user type into a maxlength=1 field via composition).
        const digits = (box.value || '').replace(/\D/g, '');
        box.value = digits.slice(-1);

        const boxes = getBoxes(form);
        const idx = boxes.indexOf(box);

        if (box.value && idx < boxes.length - 1) {
            try { boxes[idx + 1].focus(); } catch (e) { /* ignore */ }
        }

        const combined = syncOtpFromBoxes(form);
        if (combined.length === boxes.length) {
            // Auto-submit when fully filled.
            const verifyBtn = form.querySelector('.mal-otp-verify');
            if (verifyBtn && !verifyBtn.disabled) verifyBtn.click();
        }
    });

    document.addEventListener('keydown', (e) => {
        const box = e.target.closest('.mal-otp-box');
        if (!box) return;
        const form = box.closest('.mal-form--otp');
        if (!form) return;
        const boxes = getBoxes(form);
        const idx = boxes.indexOf(box);

        if (e.key === 'Backspace' && !box.value && idx > 0) {
            e.preventDefault();
            const prev = boxes[idx - 1];
            prev.value = '';
            try { prev.focus(); } catch (e) { /* ignore */ }
            syncOtpFromBoxes(form);
        } else if (e.key === 'ArrowLeft' && idx > 0) {
            e.preventDefault();
            try { boxes[idx - 1].focus(); } catch (e) { /* ignore */ }
        } else if (e.key === 'ArrowRight' && idx < boxes.length - 1) {
            e.preventDefault();
            try { boxes[idx + 1].focus(); } catch (e) { /* ignore */ }
        }
    });

    document.addEventListener('paste', (e) => {
        const box = e.target.closest('.mal-otp-box');
        if (!box) return;
        const form = box.closest('.mal-form--otp');
        if (!form) return;

        const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
        const digits = pasted.replace(/\D/g, '');
        if (!digits) return;

        e.preventDefault();
        const boxes = getBoxes(form);
        const startIdx = boxes.indexOf(box);

        for (let i = 0; i < boxes.length - startIdx && i < digits.length; i++) {
            boxes[startIdx + i].value = digits.charAt(i);
        }
        const lastFilled = Math.min(startIdx + digits.length, boxes.length) - 1;
        if (lastFilled >= 0 && lastFilled < boxes.length) {
            try { boxes[Math.min(lastFilled + 1, boxes.length - 1)].focus(); } catch (e) { /* ignore */ }
        }

        const combined = syncOtpFromBoxes(form);
        if (combined.length === boxes.length) {
            const verifyBtn = form.querySelector('.mal-otp-verify');
            if (verifyBtn && !verifyBtn.disabled) verifyBtn.click();
        }
    });

}());
