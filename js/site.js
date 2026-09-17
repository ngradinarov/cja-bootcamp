/* ============================================
   AcmeHealth Demo — Site JavaScript
   ============================================
   
   ADOBE WEB SDK NOTES:
   - All interactive elements have data-track-* attributes
   - These won't fire events on their own — your Launch rules
     will read them via Click data elements or custom code
   - Key attributes used:
       data-track-action   = event name (e.g. "cta-click", "plan-select")
       data-track-section  = page section (e.g. "hero", "quick-links")
       data-track-detail   = contextual detail (e.g. plan name, doctor name)
   ============================================ */

/* ============================================
   FAKE AUTH SYSTEM
   ============================================
   - Any email/password combo works
   - Session stored in localStorage
   - Persists across pages until logout
   - Exposes window.acmehealth.member for
     Launch data elements / Web SDK identity
   ============================================ */

const DEMO_MEMBERS = {
  'member@acmehealth.com': { name: 'Alex Johnson', memberId: 'HF-10042587', plan: 'Silver', region: 'Northern California' },
  'maria@acmehealth.com':  { name: 'Maria Garcia', memberId: 'HF-10098213', plan: 'Gold', region: 'Southern California' },
  'james@acmehealth.com':  { name: 'James Wilson', memberId: 'HF-10071456', plan: 'Medicare Advantage Plus', region: 'Mid-Atlantic' },
};

const DEFAULT_MEMBER = { name: 'Demo Member', memberId: 'HF-10000001', plan: 'Silver', region: 'Northern California' };

// Global namespace for Launch data elements to read
window.acmehealth = {
  member: null,
  isAuthenticated: false
};

function getSession() {
  try {
    const data = localStorage.getItem('ah_session');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function setSession(member, email) {
  const session = { ...member, email, loginTime: new Date().toISOString() };
  localStorage.setItem('ah_session', JSON.stringify(session));
  window.acmehealth.member = session;
  window.acmehealth.isAuthenticated = true;
  return session;
}

function clearSession() {
  localStorage.removeItem('ah_session');
  window.acmehealth.member = null;
  window.acmehealth.isAuthenticated = false;
}

function doLogin(email, password) {
  const emailLower = (email || '').toLowerCase().trim();

  // Check for personas saved by the file generator — preserve their exact GUID
  try {
    var storedPersonas = JSON.parse(localStorage.getItem('ah_personas') || '[]');
    var persona = storedPersonas.find(function(p) { return p.email === emailLower; });
    if (persona) {
      var pSession = setSession({
        name:     persona.name,
        memberId: persona.memberId || ('AH-' + persona.guid),
        plan:     persona.plan,
        region:   persona.region
      }, emailLower);
      pSession.guid = persona.guid;
      localStorage.setItem('ah_session', JSON.stringify(pSession));
      sessionStorage.setItem('ah_pending_login_event', JSON.stringify({
        memberId: pSession.memberId, name: pSession.name, email: emailLower,
        guid: persona.guid, plan: pSession.plan, region: pSession.region, authState: 'authenticated'
      }));
      console.log('[AcmeHealth Auth] Persona login — GUID preserved:', persona.guid);
      return pSession;
    }
  } catch(e) {}

  // Any password works — look up member profile or derive name from email
  function nameFromEmail(email) {
    var local = email.split('@')[0];
    return local.replace(/[._\-]/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  }
  const member = DEMO_MEMBERS[emailLower] || {
    ...DEFAULT_MEMBER,
    name: nameFromEmail(emailLower)
  };
  const session = setSession(member, emailLower);

  console.log('[AcmeHealth Auth] Login successful', {
    email: emailLower,
    memberId: session.memberId,
    plan: session.plan,
    region: session.region,
    note: 'Use window.acmehealth.member in Launch data elements'
  });

// Derive a deterministic 99XXXXXX GUID from email — matches file generator output
  function generateGuid(email) {
    var hash = 0;
    for (var i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i);
      hash = hash & hash;
    }
    return '99' + String((Math.abs(hash) % 800000) + 100000).padStart(6, '0');
  }

  var memberGuid = generateGuid(emailLower);
  session.guid = memberGuid;
  localStorage.setItem('ah_session', JSON.stringify(session));

  sessionStorage.setItem('ah_pending_login_event', JSON.stringify({
    memberId: session.memberId, name: session.name, email: emailLower,
    guid: memberGuid, plan: session.plan, region: session.region, authState: 'authenticated'
  }));

  return session;
}

function doLogout() {
  console.log('[AcmeHealth Auth] Logout', { member: window.acmehealth.member });
  // Push to Adobe Data Layer
  window.adobeDataLayer = window.adobeDataLayer || [];
  window.adobeDataLayer.push({ event: 'logout', user: { authState: 'anonymous' } });
  clearSession();
  window.location.href = 'index.html';
}

// Update header UI based on auth state
function updateAuthUI() {
  const session = getSession();
  const headerCta = document.querySelector('.header-cta');
  const utilSignIn = document.querySelector('.utility-bar a[href="login.html"]');

  if (session) {
    window.acmehealth.member = session;
    window.acmehealth.isAuthenticated = true;

    // Replace "Member Sign In" button with member dropdown
    if (headerCta) {
      headerCta.textContent = session.name;
      headerCta.href = 'dashboard.html';
      headerCta.setAttribute('data-track-action', 'member-menu');
    }

    // Replace utility bar "Sign In" with "Sign Out"
    if (utilSignIn) {
      utilSignIn.textContent = 'Sign Out';
      utilSignIn.href = '#';
      utilSignIn.addEventListener('click', function (e) {
        e.preventDefault();
        doLogout();
      });
    }

    // If on login page, redirect to dashboard
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html') {
      window.location.href = 'dashboard.html';
    }
  }
}


document.addEventListener('DOMContentLoaded', function () {

  // --- Auth state ---
  updateAuthUI();

  // --- Drain deferred login event (set by doLogin or registration before navigation) ---
  var pendingLogin = sessionStorage.getItem('ah_pending_login_event');
  if (pendingLogin) {
    sessionStorage.removeItem('ah_pending_login_event');
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push({ event: 'user login', user: JSON.parse(pendingLogin) });
  }

  // --- Active nav highlighting ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

  // --- Login form handling ---
  const loginForm = document.querySelector('[data-track-action="sign-in-attempt"]');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;

      if (!email) {
        alert('Please enter an email address.\n\nTip: Try "member@acmehealth.com" or use any email — all logins succeed.');
        return;
      }

      const session = doLogin(email, password);

      // Brief visual feedback then redirect
      const btn = this.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Signing in...';
        btn.style.background = '#2E7D32';
      }
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 600);
    });

    // Don't apply generic form handler to login form
    loginForm.dataset.authForm = 'true';
  }

  // --- Tab switching ---
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
      const tabGroup = this.closest('.tabs');
      tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const target = this.dataset.tab;
      if (target) {
        const parent = this.closest('.section') || document.body;
        parent.querySelectorAll('.tab-content').forEach(tc => {
          tc.style.display = tc.id === target ? 'block' : 'none';
        });
      }
    });
  });

  // --- Appointment slot selection ---
  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', function () {
      this.closest('.slot-grid').querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // --- Generic form "submission" (skip login form) ---
  document.querySelectorAll('form, .demo-form').forEach(form => {
    if (form.dataset.authForm) return; // handled above
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('.btn, button[type="submit"]');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Submitted ✓';
        btn.style.background = '#2E7D32';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
        }, 2000);
      }
    });
  });

  // --- Search bar demo ---
  const searchBar = document.querySelector('.search-bar');
  if (searchBar) {
    const searchBtn = searchBar.querySelector('.btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        const input = searchBar.querySelector('input');
        if (input && input.value.trim()) {
          alert('Search demo: "' + input.value + '"\n\nIn a real site, this would query a provider directory. For Web SDK testing, check your Launch debugger for the search event.');
        }
      });
    }
  }

  // --- Logout buttons ---
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      doLogout();
    });
  });

  // --- Console log for tracking attribute clicks (dev helper) ---
  document.addEventListener('click', function (e) {
    const tracked = e.target.closest('[data-track-action]');
    if (tracked) {
      console.log('[AcmeHealth Tracking]', {
        action: tracked.dataset.trackAction,
        section: tracked.dataset.trackSection || '',
        detail: tracked.dataset.trackDetail || '',
        element: tracked.tagName,
        page: currentPage,
        authenticated: window.acmehealth.isAuthenticated,
        memberId: window.acmehealth.member?.memberId || null
      });
    }
  });

});

/* ============================================
   DEBUG OVERLAY — ECID / GUID / Email
   Shows on all pages, bottom-left corner
   ============================================ */
(function () {
  var NO_DEBUG_PAGES = ['journey'];
  var CARD_STYLE = 'background:rgba(15,23,42,0.95);border:1px solid #334155;border-radius:10px;padding:10px 14px;font-family:monospace;font-size:11px;color:#e2e8f0;backdrop-filter:blur(8px);min-width:360px;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
  var SECTION_LABEL = 'font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;';

  document.addEventListener('DOMContentLoaded', function () {
    var pg = window.location.pathname.split('/').pop().replace('.html', '') || 'home';
    if (NO_DEBUG_PAGES.indexOf(pg) >= 0) return;

    // Shared row styles
    var style = document.createElement('style');
    style.textContent = '.hf-dbg-row{display:flex;justify-content:space-between;gap:12px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);}.hf-dbg-row:last-child{border:none;}.hf-dbg-label{color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.06em;min-width:36px;}.hf-dbg-val{color:#cbd5e1;font-size:10px;text-align:right;word-break:break-all;max-width:300px;white-space:nowrap;}';
    document.head.appendChild(style);

    // Wrapper — fixed position, flex column, gap between cards
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;bottom:12px;left:12px;display:flex;flex-direction:column;gap:6px;z-index:99999;';

    // ── IDENTITY card (ECID + GUID when authenticated) ──────────────
    var idBox = document.createElement('div');
    idBox.id = 'ah-debug';
    idBox.style.cssText = CARD_STYLE;
    idBox.innerHTML =
      '<div id="ah-debug-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;cursor:pointer;">' +
        '<span style="' + SECTION_LABEL + '">Identity</span>' +
        '<span id="ah-debug-toggle" style="font-size:14px;color:#475569;">−</span>' +
      '</div>' +
      '<div id="ah-debug-body">' +
        '<div class="hf-dbg-row"><span class="hf-dbg-label">ECID</span><span class="hf-dbg-val" id="dbg-ecid">loading...</span></div>' +
        '<div class="hf-dbg-row" id="dbg-guid-row" style="display:none;"><span class="hf-dbg-label">GUID</span><span class="hf-dbg-val" id="dbg-guid"></span></div>' +
      '</div>';

    // ── CONTEXT card (Email + Page — session/event context, not identityMap) ──
    var ctxBox = document.createElement('div');
    ctxBox.id = 'ah-debug-ctx';
    ctxBox.style.cssText = CARD_STYLE;
    ctxBox.innerHTML =
      '<div style="margin-bottom:6px;"><span style="' + SECTION_LABEL + '">Context</span></div>' +
      '<div class="hf-dbg-row"><span class="hf-dbg-label">User</span><span class="hf-dbg-val" id="dbg-email">anonymous</span></div>' +
      '<div class="hf-dbg-row"><span class="hf-dbg-label">View</span><span class="hf-dbg-val" id="dbg-page">—</span></div>';

    wrapper.appendChild(idBox);
    wrapper.appendChild(ctxBox);
    document.body.appendChild(wrapper);

    // Toggle collapses both cards together
    document.getElementById('ah-debug-header').addEventListener('click', function () {
      var body   = document.getElementById('ah-debug-body');
      var toggle = document.getElementById('ah-debug-toggle');
      var isCollapsed = body.style.display === 'none';
      body.style.display    = isCollapsed ? '' : 'none';
      ctxBox.style.display  = isCollapsed ? '' : 'none';
      toggle.textContent    = isCollapsed ? '−' : '+';
    });

    // Populate session info — GUID row only shown when authenticated (GUID fires in identityMap)
    try {
      var sess = JSON.parse(localStorage.getItem('ah_session') || 'null');
      if (sess) {
        if (sess.guid) {
          var guidRow = document.getElementById('dbg-guid-row');
          if (guidRow) guidRow.style.display = '';
          document.getElementById('dbg-guid').textContent = sess.guid;
        }
        document.getElementById('dbg-email').textContent = sess.email || 'anonymous';
      }
    } catch (e) {}

    // Page/view name
    document.getElementById('dbg-page').textContent = pg;

    // Get ECID via alloy
    function fetchECID(attempts) {
      if (typeof alloy === 'function') {
        alloy('getIdentity', { namespaces: ['ECID'] }).then(function (result) {
          var ecid = result && result.identity && result.identity.ECID;
          document.getElementById('dbg-ecid').textContent = ecid || 'not found';
          document.getElementById('dbg-ecid').title = ecid || '';
        }).catch(function () {
          document.getElementById('dbg-ecid').textContent = 'unavailable';
        });
      } else if (attempts < 20) {
        setTimeout(function () { fetchECID(attempts + 1); }, 500);
      } else {
        document.getElementById('dbg-ecid').textContent = 'alloy not loaded';
      }
    }
    fetchECID(0);
  });
})();
