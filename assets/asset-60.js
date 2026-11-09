/* ── IPW Popup — self-contained, CSS injected once from this file ── */
(function () {
    if (document.getElementById('ipw-popup-styles')) return;
    var s = document.createElement('style');
    s.id = 'ipw-popup-styles';
    s.textContent = [
        '#mivb-ep-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .25s;font-family:Poppins,sans-serif}',
        '#mivb-ep-overlay.mivb-ep-open{opacity:1;pointer-events:auto}',
        '#mivb-ep-box{background:#fff;border-radius:24px;padding:36px 32px 28px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.16);transform:translateY(16px);transition:transform .28s cubic-bezier(.34,1.56,.64,1);position:relative}',
        '#mivb-ep-overlay.mivb-ep-open #mivb-ep-box{transform:translateY(0)}',
        '#mivb-ep-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#bbb;line-height:1;padding:4px 6px;border-radius:50%}',
        '#mivb-ep-close:hover{color:#666;background:#f5f5f5}',
        '#mivb-ep-icon-wrap{position:relative;width:96px;height:96px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center}',
        '#mivb-ep-icon-wrap::before{content:"";position:absolute;inset:0;border-radius:50%;background:#fce8f0}',
        '#mivb-ep-icon{position:relative;font-size:42px;z-index:1;line-height:1}',
        '.mivb-ep-sparkle{position:absolute;color:#c4a8d8;font-size:16px;font-weight:700;line-height:1;z-index:2}',
        '#mivb-ep-title{font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 10px;line-height:1.3}',
        '#mivb-ep-msg{font-size:13px;color:#777;margin:0 0 18px;line-height:1.6}',
        '#mivb-ep-actions{display:flex;flex-direction:column;gap:10px;margin-bottom:10px}',
        '#mivb-ep-countdown{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:#888;padding:14px 0 8px;border-top:1px solid #f3f3f3;margin-top:16px;margin-bottom:14px}',
        '.mivb-ep-clock{font-size:16px}',
        '.mivb-ep-countdown-num{color:#FF7396;font-weight:700}',
        '.mivb-ep-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:13px 20px;border-radius:50px;font-size:15px;font-weight:600;text-decoration:none!important;cursor:pointer;border:none;transition:background .15s,box-shadow .15s;font-family:Poppins,sans-serif;width:100%;box-sizing:border-box}',
        '.mivb-ep-btn--dl{background:#FF7396;color:#fff!important;box-shadow:0 4px 14px rgba(255,115,150,.3)}',
        '.mivb-ep-btn--dl:hover{background:#e05575;color:#fff!important}',
        '.mivb-ep-btn--orders{background:#FF7396;color:#fff!important;box-shadow:0 4px 14px rgba(255,115,150,.3);margin-bottom:4px}',
        '.mivb-ep-btn--orders:hover{background:#e05575;color:#fff!important}',
        '.mivb-ep-btn--buy{background:#FF7396;color:#fff!important;box-shadow:0 4px 14px rgba(255,115,150,.3)}',
        '.mivb-ep-btn--buy:hover{background:#e05575;color:#fff!important}',
        '#mivb-ep-dismiss{font-size:13px;color:#aaa;text-decoration:underline;cursor:pointer;background:none;border:none;display:block;margin:0 auto;font-family:Poppins,sans-serif}',
        '#mivb-ep-dismiss:hover{color:#555}'
    ].join('');
    document.head.appendChild(s);
}());

var _ipwPopupEl = null;
var _ipwRedirectTimer = null;

function ipwStopRedirect() {
    if (_ipwRedirectTimer) { clearInterval(_ipwRedirectTimer); _ipwRedirectTimer = null; }
}

function _ipwUpdateCountdown(secs) {
    var wrap = document.getElementById('mivb-ep-countdown');
    var text = document.getElementById('mivb-ep-countdown-text');
    if (!wrap) return;
    wrap.style.display = 'flex';
    text.innerHTML = 'Taking you to My Orders in <strong class="mivb-ep-countdown-num">' + secs + '</strong> seconds';
}

function ipwStartRedirectCountdown(ordersUrl) {
    var url = ordersUrl || '/my-account/orders/';
    var secs = 20; // ← change this to adjust PDF popup redirect delay (seconds)
    _ipwUpdateCountdown(secs);
    _ipwRedirectTimer = setInterval(function () {
        secs--;
        if (secs <= 0) { ipwStopRedirect(); window.location.href = url; }
        else { _ipwUpdateCountdown(secs); }
    }, 1000);
}

/* Shared overlay builder — called once, reused by all popup states */
function _ipwBuildOverlay(ordersUrl) {
    var url = ordersUrl || '/my-account/orders/';
    if (_ipwPopupEl) {
        var ob = document.getElementById('mivb-ep-orders-btn');
        if (ob) ob.href = url;
        return;
    }
    document.body.insertAdjacentHTML('beforeend',
        '<div id="mivb-ep-overlay">' +
        '<div id="mivb-ep-box">' +
        '<button id="mivb-ep-close" aria-label="Close">&times;</button>' +
        '<div id="mivb-ep-icon-wrap">' +
        '<span class="mivb-ep-sparkle" style="top:-6px;left:6px">+</span>' +
        '<span class="mivb-ep-sparkle" style="top:2px;right:-10px">+</span>' +
        '<div id="mivb-ep-icon">🎉</div>' +
        '<span class="mivb-ep-sparkle" style="bottom:2px;left:-10px">+</span>' +
        '<span class="mivb-ep-sparkle" style="bottom:-6px;right:6px">+</span>' +
        '</div>' +
        '<h3 id="mivb-ep-title"></h3>' +
        '<p id="mivb-ep-msg"></p>' +
        '<div id="mivb-ep-track" style="display:none"><div id="mivb-ep-bar"></div></div>' +
        '<div id="mivb-ep-actions">' +
        '<a id="mivb-ep-dl-btn" target="blank" href="#" class="mivb-ep-btn mivb-ep-btn--dl" style="display:none">⬇ Download Again</a>' +
        '<a id="mivb-ep-buy-btn" href="#" class="mivb-ep-btn mivb-ep-btn--buy" style="display:none">🛒 Buy Again →</a>' +
        '</div>' +
        '<div id="mivb-ep-countdown" style="display:none">' +
        '<span class="mivb-ep-clock">🕐</span>' +
        '<span id="mivb-ep-countdown-text"></span>' +
        '</div>' +
        '<a id="mivb-ep-orders-btn" href="' + url + '" class="mivb-ep-btn mivb-ep-btn--orders">View My Orders →</a>' +
        '<button id="mivb-ep-dismiss">Stay on this page</button>' +
        '</div>' +
        '</div>'
    );
    _ipwPopupEl = document.getElementById('mivb-ep-overlay');
    function closePopup() {
        ipwStopRedirect();
        _ipwPopupEl.classList.remove('mivb-ep-open');
        document.body.style.overflow = '';
    }
    document.getElementById('mivb-ep-close').addEventListener('click', closePopup);
    document.getElementById('mivb-ep-dismiss').addEventListener('click', closePopup);
    _ipwPopupEl.addEventListener('click', function (e) { if (e.target === _ipwPopupEl) closePopup(); });
}

function _ipwOpenPopup() {
    _ipwPopupEl.classList.add('mivb-ep-open');
    document.body.style.overflow = 'hidden';
}

/* Post-download success popup */
function ipwShowEditPopup(downloadUrl, ordersUrl) {
    ordersUrl = ordersUrl || '/my-account/orders/';
    ipwStopRedirect();
    _ipwBuildOverlay(ordersUrl);

    document.getElementById('mivb-ep-icon').textContent = '🎉';
    document.getElementById('mivb-ep-title').textContent = 'Your invitation is ready!';
    document.getElementById('mivb-ep-msg').textContent = 'Download has started automatically. Use the button below if it didn\'t.';

    var dlBtn = document.getElementById('mivb-ep-dl-btn');
    var buyBtn = document.getElementById('mivb-ep-buy-btn');
    var ordBtn = document.getElementById('mivb-ep-orders-btn');
    if (dlBtn) { dlBtn.href = downloadUrl || '#'; dlBtn.style.display = 'flex'; }
    if (buyBtn) buyBtn.style.display = 'none';
    if (ordBtn) { ordBtn.href = ordersUrl; ordBtn.style.display = 'flex'; }

    document.getElementById('mivb-ep-countdown').style.display = 'none';
    _ipwOpenPopup();
    ipwStartRedirectCountdown(ordersUrl);
}

/* Edit-limit reached popup — Add to Cart + checkout flow, no auto-redirect */
function ipwShowLimitReachedPopup(message, purchaseUrl, productId, designJson, mivbCategory, mivbSubmissionId) {
    ipwStopRedirect();
    _ipwBuildOverlay('/my-account/orders/');

    document.getElementById('mivb-ep-icon').textContent = '✏️';
    document.getElementById('mivb-ep-title').textContent = 'All edits used';
    document.getElementById('mivb-ep-msg').textContent = message || 'You\'ve used all edits for this purchase. Buy again to unlock more edits and a fresh download.';

    var dlBtn = document.getElementById('mivb-ep-dl-btn');
    var buyBtn = document.getElementById('mivb-ep-buy-btn');
    var ordBtn = document.getElementById('mivb-ep-orders-btn');

    if (dlBtn) dlBtn.style.display = 'none';

    // Primary CTA: Add to cart then redirect to checkout
    if (buyBtn) {
        buyBtn.textContent = '🛒 Buy Again →';
        buyBtn.style.display = 'flex';
        buyBtn.removeAttribute('href');
        buyBtn.onclick = function (e) {
            e.preventDefault();
            buyBtn.textContent = 'Adding to cart…';
            buyBtn.style.opacity = '0.7';
            buyBtn.style.pointerEvents = 'none';

            var checkoutUrl = (typeof ipwSettings !== 'undefined' && ipwSettings.checkoutUrl) || '/checkout/';

            if (!productId) {
                // No product ID — fall back to product page or checkout
                window.location.href = purchaseUrl || checkoutUrl;
                return;
            }

            // ipw_add_to_cart: empties cart, adds product, returns checkout URL.
            // Works on every page — uses ipwSettings.nonce (ipw_package_nonce),
            // unlike mi_confirm_add_to_cart which requires the card-editor nonce.
            var ipwNonce = (typeof ipwSettings !== 'undefined' && ipwSettings.nonce) || '';
            var ipwAjax  = (typeof ipwSettings !== 'undefined' && ipwSettings.ajaxUrl)
                           || '/wp-admin/admin-ajax.php';

            var body = new URLSearchParams();
            body.set('action',     'ipw_add_to_cart');
            body.set('product_id', productId);
            body.set('nonce',      ipwNonce);
            // Carry the user's latest design so _mivb_video_json is saved at checkout
            if (designJson)        body.set('design_json',    designJson);
            if (mivbCategory)      body.set('category',       mivbCategory);
            if (mivbSubmissionId)  body.set('submission_id',  mivbSubmissionId);
            // Carry language so _mivb_lang is preserved on the new order
            var _lang = (typeof mivbForm !== 'undefined' && mivbForm.lang) ? mivbForm.lang : '';
            if (_lang) body.set('lang', _lang);

            fetch(ipwAjax, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data && data.success) {
                        window.location.href = (data.data && data.data.checkout_url) || checkoutUrl;
                    } else {
                        window.location.href = purchaseUrl || checkoutUrl;
                    }
                })
                .catch(function () {
                    window.location.href = purchaseUrl || checkoutUrl;
                });
        };
    }

    // Secondary: View My Orders — neutral outline
    if (ordBtn) {
        ordBtn.href = '/my-account/orders/';
        ordBtn.textContent = 'View My Orders';
        ordBtn.style.cssText = 'display:flex;background:#f5f5f5;color:#444!important;box-shadow:none;border:1px solid #e0e0e0';
    }

    document.getElementById('mivb-ep-countdown').style.display = 'none';
    _ipwOpenPopup();
}

document.addEventListener('DOMContentLoaded', function () {
    const finalBtn = document.querySelector('.final-download-btn');
    if (!finalBtn) return;

    // Add in-app browser detection
    function isInAppBrowser() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        return /Instagram|FBAN|FBAV|Messenger|Line|Snapchat|TikTok/i.test(ua);
    }

    // Enhanced PDF download function with cross-browser support
    function handlePdfDownload(pdfUrl, filename = 'Invitation') {
        console.log("Downloading from:", pdfUrl);

        try {
            if (isInAppBrowser()) {
                // Direct navigation for Instagram / FB / TikTok browsers
                window.location.href = pdfUrl;
            } else {
                // Normal browsers → fetch + blob for custom filename
                fetch(pdfUrl)
                    .then(res => {
                        if (!res.ok) throw new Error("Network error");
                        return res.blob();
                    })
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = filename + ".pdf";
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                    })
                    .catch(err => {
                        console.error("Download failed:", err);
                        // Fallback to direct navigation
                        window.location.href = pdfUrl;
                    });
            }
        } catch (e) {
            console.error("Error handling download:", e);
            // Last resort fallback
            window.location.href = pdfUrl;
        }
    }

    finalBtn.addEventListener('click', function (e) {
        e.preventDefault();

        console.log('Final Download button clicked');

        // Store original button text and set "Please wait..."
        const originalText = finalBtn.textContent;
        finalBtn.textContent = 'Please wait...';
        finalBtn.disabled = true;

        // Function to reset button state
        function resetButton() {
            finalBtn.textContent = originalText;
            finalBtn.disabled = false;
        }

        // If user not logged in, show login popup and redirect to checkout after login
        // if (finalBtn.classList.contains('login-required')) {
        //     // Mark that after login we need to check package and redirect
        //     localStorage.setItem('ipw_afterLoginCheck', 'true');
        //     triggerLoginPopup();
        //     resetButton();
        //     return;
        // }

        const urlParams = new URLSearchParams(window.location.search);
        const editParam = urlParams.get('edit');
        const product_id = editParam ? atob(editParam) : '';
        const orderParam = urlParams.get('orderID');
        const order_id = orderParam ? atob(orderParam) : '';
        const data = new URLSearchParams();
        data.append('action', 'ipw_download_product');
        data.append('nonce', mi_fe_ajax_object.nonce);
        data.append('product_id', product_id);
        data.append('is_final_download', '1');
        if (order_id) data.append('order_id', order_id);

        fetch(mi_fe_ajax_object.ajax_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: data.toString(),
        })
            .then(response => response.json().catch(() => ({ success: false, data: 'Unexpected response from server' })))
            .then(result => {
                console.log('IPW Final Download response:', result);
                if (result.success && result.data && result.data.download_url) {
                    // Use enhanced download function instead of window.open
                    const filename = result.data.product_name || 'Invitation';
                    handlePdfDownload(result.data.download_url, filename);

                    // Track download — prefer AJAX response data, fall back to miProductData
                    const _mpd = window.miProductData || {};
                    const _pid = result.data.product_id || _mpd.id || product_id;
                    if (_pid) {
                        const trackParams = {
                            content_ids: [String(_pid)],
                            content_name: result.data.product_name || _mpd.name || filename,
                            content_type: 'product',
                            value: result.data.product_price || _mpd.price || 0,
                            currency: result.data.currency || _mpd.currency || 'INR',
                        };
                        if (typeof fbq === 'function') {
                            fbq('trackCustom', 'MemberPDFDownloaded', trackParams);
                        }
                        if (typeof gtag === 'function') {
                            gtag('event', 'member_pdf_downloaded', Object.assign({ product_type: 'pdf' }, trackParams));
                        }
                    }

                    // Show post-download popup (only in edit mode — orderID in URL)
                    const _urlP = new URLSearchParams(window.location.search);
                    if (_urlP.get('orderID')) {
                        ipwShowEditPopup(result.data.download_url, '/my-account/orders/');
                    }

                    resetButton();
                    return;
                }
                if (result.data && result.data.redirect_url) {
                    window.location.href = result.data.redirect_url;
                    return;
                }
                var msg = '';
                if (typeof result.data === 'string') {
                    msg = result.data;
                } else if (result.data && typeof result.data.message === 'string') {
                    msg = result.data.message;
                } else if (result.data && typeof result.data.error === 'string') {
                    msg = result.data.error;
                }
                var purchaseUrl = result.data && result.data.purchase_url;
                if (orderParam) {
                    // Edit mode (orderID in URL) — show popup so user can buy again
                    ipwShowLimitReachedPopup(msg, purchaseUrl, product_id || null);
                } else {
                    // Normal flow — redirect to checkout directly
                    window.location.href = purchaseUrl || ((typeof ipwSettings !== 'undefined' && ipwSettings.checkoutUrl) || '/checkout/');
                }
                resetButton();
            })
            .catch(function (error) {
                console.error('Error:', error);
                if (orderParam) {
                    ipwShowLimitReachedPopup('Something went wrong. Please try again.', null, product_id || null);
                } else {
                    window.location.href = (typeof ipwSettings !== 'undefined' && ipwSettings.checkoutUrl) || '/checkout/';
                }
                resetButton();
            });
    });

    // // On page load, if after-login check is pending, perform package status check
    // if (localStorage.getItem('ipw_afterLoginCheck')) {
    //     localStorage.removeItem('ipw_afterLoginCheck');
    //     const params = new URLSearchParams();
    //     params.append('action', 'ipw_user_package_status');
    //     fetch(ipwSettings.ajaxUrl, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    //         body: params.toString()
    //     })
    //     .then(res => res.json())
    //     .then(result => {
    //         const data = result.data || {};
    //         if (!data.has_active_package || !data.has_edits_left) {
});

const checkoutBtn = document.querySelector('.btn-checkout');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var urlParams   = new URLSearchParams(window.location.search);
        var inEditMode  = !!urlParams.get('orderID'); // orderID present = user came from My Orders edit link

        if (inEditMode) {
            // Edit mode: edits are exhausted for this order — show the limit-reached popup.
            // card-editor's document handler skips btn-checkout when orderID is in URL.
            e.stopPropagation();
            e.stopImmediatePropagation();
            var editParam = urlParams.get('edit');
            var productId = editParam ? atob(editParam) : null;
            ipwShowLimitReachedPopup(
                'You\'ve used all edits for this purchase. Buy again to unlock more edits and a fresh download.',
                null,
                productId
            );
        }
        // No orderID: let the event bubble to card-editor's document handler
        // (mi_confirm_add_to_cart → empties cart, adds product, redirects to checkout).
        // Server-side ajax_download_product also handles this via IPW_Order_Access.
    });
}