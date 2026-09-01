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

  window.openBuyCreditsModal = function () {
    const m = document.getElementById('buyCreditsModal');
    if (!m) { toast('Plans window missing', 'error'); return; }
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeBuyCreditsModal = function () {
    const m = document.getElementById('buyCreditsModal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
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

  window.buyPlanDirect = async function (plan) {
    const spec = PLANS[plan];
    if (!spec) { toast('Invalid plan', 'error'); return; }
    const tok = token();
    if (!tok) { toast('Please login first', 'error'); window.location.href = '/login.html'; return; }
    if (typeof Razorpay === 'undefined') { toast('Payment SDK not loaded. Refresh and try again.', 'error'); return; }

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
            toast('Payment successful · credits added');
            if (window.closeBuyCreditsModal) window.closeBuyCreditsModal();
            if (window._app && window._app._fetchPaidTokenBalance) window._app._fetchPaidTokenBalance();
          } catch (err) {
            toast(err.message || 'Verify failed', 'error');
          }
        }
      });
      rzp.on('payment.failed', function (resp) {
        toast((resp.error && resp.error.description) || 'Payment failed', 'error');
      });
      rzp.open();
    } catch (err) {
      toast(err.message || 'Checkout failed', 'error');
    }
  };

  window.buyPlan = function (plan) { return window.buyPlanDirect(plan); };

  document.addEventListener('click', function (e) {
    const modal = document.getElementById('buyCreditsModal');
    if (e.target === modal) window.closeBuyCreditsModal();
  });
})();
