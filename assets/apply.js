// Apply page: submit via fetch and show the result inline. The form works without this.
const F = document.getElementById('apply');
if (F) {
  const status = document.getElementById('result');   // always-present live region; text is updated in place
  const summary = document.getElementById('errsum');
  const pageErr = document.getElementById('pageerr');   // server-rendered page-level error (no-JS failure), if any
  const why = F.elements.whyJoin;
  const button = F.querySelector('button[type=submit]');
  const LABELS = { characterName: 'Character name', class: 'Class', role: 'Role', level: 'Level', discord: 'Discord username', whyJoin: 'Why do you want to join?' };
  const targetId = (name) => (name === 'role' ? 'role-tank' : name); // role errors point at the first radio

  const clear = () => {
    summary.hidden = true;
    summary.textContent = '';
    status.textContent = '';
    if (pageErr) pageErr.hidden = true;
    status.className = 'result';
    F.querySelectorAll('.err').forEach((p) => { p.hidden = true; p.textContent = ''; });
    F.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  };

  const showErrors = (errors) => {
    const list = document.createElement('ul');
    for (const [name, message] of Object.entries(errors)) {
      const p = document.getElementById('err-' + name);
      if (p) { p.textContent = '! ' + message; p.hidden = false; }
      const control = F.elements[name];
      // Radio groups come back as a RadioNodeList; their error is tied to the fieldset via aria-describedby.
      if (control && !(typeof RadioNodeList !== 'undefined' && control instanceof RadioNodeList)) control.setAttribute('aria-invalid', 'true');
      const a = document.createElement('a');
      a.href = '#' + targetId(name);
      a.textContent = (LABELS[name] || name) + ': ' + message;
      const li = document.createElement('li');
      li.append(a);
      list.append(li);
    }
    summary.append('Please fix the following:', list);
    summary.hidden = false;
    summary.focus();
  };

  // Summary links focus the control itself (fragment navigation alone does not always move focus).
  summary.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    const el = a && document.getElementById(a.getAttribute('href').slice(1));
    if (el) { ev.preventDefault(); el.focus(); }
  });

  // A no-JS error page arrives with the summary already visible.
  if (!summary.hidden) summary.focus(); else if (pageErr) pageErr.focus();

  F.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clear();
    // Same rule as the server: 10 to 1000 code points, with newlines normalized (a native maxlength counts UTF-16 units).
    const whyLen = [...why.value.replace(/\r\n?/g, '\n').trim()].length;
    if (whyLen < 10 || whyLen > 1000) {
      showErrors({ whyJoin: 'Tell us a little about yourself in 10 to 1000 characters.' });
      return;
    }
    button.disabled = true;
    let ok = false;
    try {
      const res = await fetch(F.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(new FormData(F)) });
      const json = await res.json().catch(() => ({ message: 'Something went wrong. Please try again.' }));
      if (json.errors && Object.keys(json.errors).length) {
        showErrors(json.errors);
      } else {
        ok = Boolean(json.ok);
        status.textContent = json.message;
        status.className = 'result' + (ok ? ' ok' : '');
        if (ok) F.reset();
      }
    } catch {
      status.textContent = 'Could not reach the server. Please try again or apply on Guilds Forever.';
    }
    button.disabled = false;
    if (!summary.hidden) return;           // focus already moved to the error summary
    status.focus();                        // announce the result and scroll it into view, success or failure
  });
}
