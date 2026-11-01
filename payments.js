/* Savoiré — checkout + credit history (wired to sidebar / dock) */
(function () {
  const PLANS = {
    starter: { amount: 19, credits: 100000, name: 'Starter' },
    pro:     { amount: 49, credits: 500000, name: 'Pro' },
    popular: { amount: 99, credits: 1000000, name: 'Popular' },
    ultra:   { amount: 199, credits: 2000000, name: 'Ultra' }
  };

  function token() {
    try { return localStorage.getItem('sv_firebase_token') || ''; } catch (e) { return ''; }
  }

  function toast(msg, type) {
    if (window._app && window._app._toast) {
      window._app._toast(type === 'error' ? 'error' : 'info', 'fa-info-circle', msg);
      return;
    }
    alert(msg);
  }

  let paymentSuccessPreviousFocus = null;
  let paymentSuccessPreviousOverflow = '';

  function ensurePaymentSuccessModal() {
    let overlay = document.getElementById('svPaymentSuccessModal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'svPaymentSuccessModal';
    overlay.className = 'sv-pay-success-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'svPaySuccessTitle');
    overlay.setAttribute('aria-describedby', 'svPaySuccessMessage');
    overlay.setAttribute('aria-hidden', 'true');

    const card = document.createElement('div');
    card.className = 'sv-pay-success-card';

    const mark = document.createElement('div');
    mark.className = 'sv-pay-success-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '✓';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'sv-pay-success-eyebrow';
    eyebrow.textContent = 'Payment confirmed';

    const title = document.createElement('h2');
    title.id = 'svPaySuccessTitle';
    title.textContent = 'Thank you for your purchase!';

    const message = document.createElement('p');
    message.id = 'svPaySuccessMessage';
    message.className = 'sv-pay-success-message';

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'sv-pay-success-continue';
    action.textContent = 'Continue studying →';
    action.addEventListener('click', closePaymentSuccess);

    card.append(mark, eyebrow, title, message, action);
    overlay.appendChild(card);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closePaymentSuccess();
    });
    overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePaymentSuccess();
      } else if (event.key === 'Tab') {
        const continueButton = overlay.querySelector('.sv-pay-success-continue');
        if (continueButton) { event.preventDefault(); continueButton.focus(); }
      }
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function showPaymentSuccess(spec) {
    const overlay = ensurePaymentSuccessModal();
    const message = overlay.querySelector('#svPaySuccessMessage');
    const credits = Number(spec && spec.credits) || 0;
    const planName = (spec && spec.name) || 'your';
    if (message) {
      message.textContent = 'Your ' + planName + ' pack is confirmed. ' +
        credits.toLocaleString() + ' credits have been added; your balance is refreshing now.';
    }

    paymentSuccessPreviousFocus = document.activeElement;
    paymentSuccessPreviousOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('sv-payment-success-open');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      const continueButton = overlay.querySelector('.sv-pay-success-continue');
      if (continueButton) continueButton.focus({ preventScroll: true });
    });
  }

  function closePaymentSuccess() {
    const overlay = document.getElementById('svPaymentSuccessModal');
    if (!overlay || overlay.getAttribute('aria-hidden') === 'true') return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sv-payment-success-open');
    document.body.style.overflow = paymentSuccessPreviousOverflow;
    window.setTimeout(function () {
      if (!overlay.classList.contains('is-open')) overlay.style.display = 'none';
    }, 220);

    const prior = paymentSuccessPreviousFocus;
    paymentSuccessPreviousFocus = null;
    if (prior && prior.isConnected && typeof prior.focus === 'function') {
      window.setTimeout(function () { try { prior.focus({ preventScroll: true }); } catch (e) {} }, 0);
    }
  }

  window.openBuyCreditsModal = function () {
    const m = document.getElementById('buyCreditsModal');
    if (!m) { toast('Plans window missing', 'error'); return; }
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('sv-modal-open');
  };

  window.closeBuyCreditsModal = function () {
    const m = document.getElementById('buyCreditsModal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('sv-modal-open');
  };

  window.openCreditHistory = async function () {
    const modal = document.getElementById('creditHistoryModal');
    const list = document.getElementById('creditHistoryList');
    if (modal) modal.style.display = 'flex';
    if (list) list.innerHTML = '<div style="text-align:center;padding:28px;color:rgba(255,255,255,.45)">Loading…</div>';
    const tok = token();
    if (!tok) {
      if (list) list.innerHTML = '<div style="text-align:center;padding:28px">Login required</div>';
      return;
    }
    try {
      const res = await fetch('/api/credit-history', { headers: { Authorization: 'Bearer ' + tok } });
      const data = await res.json().catch(() => ({}));
      const rows = data.history || data.items || [];
      if (!rows.length) {
        if (list) list.innerHTML = '<div style="text-align:center;padding:32px;color:rgba(255,255,255,.5)">No credit activity yet.</div>';
        return;
      }
      if (list) {
        list.innerHTML = rows.slice(0, 40).map(function (h) {
          const pos = (h.type === 'purchase' || h.type === 'bonus' || (h.credits || 0) > 0) && h.type !== 'generation';
          const amt = h.credits || h.amount || h.change || 0;
          const title = h.description || h.plan || h.type || 'Activity';
          const when = h.createdAt?.seconds ? new Date(h.createdAt.seconds * 1000).toLocaleString() : (h.date || '');
          return '<div class="credit-history-item"><div class="credit-history-info"><div class="credit-history-title">' +
            String(title).replace(/</g, '&lt;') + '</div><div class="credit-history-sub">' + when +
            '</div></div><div class="credit-history-change ' + (pos ? 'pos' : 'neg') + '">' +
            (pos ? '+' : '-') + Math.abs(Number(amt) || 0).toLocaleString() + '</div></div>';
        }).join('');
      }
    } catch (e) {
      if (list) list.innerHTML = '<div style="text-align:center;padding:28px">Could not load history.</div>';
    }
  };

  let paying = false;
  window.buyPlanDirect = async function (plan) {
    const spec = PLANS[plan];
    if (!spec) { toast('Invalid plan', 'error'); return; }
    if (paying) { toast('Checkout already open'); return; }
    const tok = token();
    if (!tok) { toast('Please login first', 'error'); window.location.href = '/login.html'; return; }
    if (typeof Razorpay === 'undefined') { toast('Payment SDK not loaded. Refresh and try again.', 'error'); return; }

    paying = true;
    toast('Opening secure checkout…');
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ plan: plan })
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || 'Order failed');

      const user = (window.firebaseAuthInstance && window.firebaseAuthInstance.currentUser) || {};
      const rzp = new Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Savoiré AI',
        description: spec.name + ' · ' + spec.credits.toLocaleString() + ' credits · 30 days',
        order_id: order.orderId,
        prefill: { name: user.displayName || '', email: user.email || '' },
        theme: { color: '#1970ff' },
        handler: async function (resp) {
          try {
            const uid = user.uid || '';
            const vr = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
              body: JSON.stringify({
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
                plan: plan,
                uid: uid
              })
            });
            const out = await vr.json();
            if (!vr.ok || !out.success) throw new Error(out.error || 'Verify failed');
            paying = false;
            if (window.closeBuyCreditsModal) window.closeBuyCreditsModal();
            if (window._app && window._app._fetchPaidTokenBalance) {
              Promise.resolve(window._app._fetchPaidTokenBalance()).catch(function () {});
            }
            try { showPaymentSuccess(spec); }
            catch (uiError) { toast('Payment successful · credits added'); }
          } catch (err) {
            paying = false;
            toast(err.message || 'Verify failed', 'error');
          }
        }
      });
      rzp.on('payment.failed', function (resp) {
        paying = false;
        toast((resp.error && resp.error.description) || 'Payment failed', 'error');
      });
      rzp.on('close', function () { paying = false; });
      rzp.open();
    } catch (err) {
      paying = false;
      toast(err.message || 'Checkout failed', 'error');
    }
  };

  window.buyPlan = function (plan) { return window.buyPlanDirect(plan); };

  document.addEventListener('click', function (e) {
    const modal = document.getElementById('buyCreditsModal');
    if (e.target === modal) window.closeBuyCreditsModal();
  });
})();
