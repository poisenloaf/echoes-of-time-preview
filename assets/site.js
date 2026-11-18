// Raids page: highlight today (ET) and show sessions in the visitor's time. localRange is exported for tests.
const ET = 'America/New_York', DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Wall-clock fields of an instant in a zone (undefined = visitor's zone).
function wall(ts, zone) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    .formatToParts(ts).forEach((x) => { p[x.type] = x.value; });
  return { wd: DAYS.indexOf(p.weekday), y: +p.year, m: +p.month, d: +p.day, utc: Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) };
}

// Instant at which ET shows y-m-d h:mi (two passes cover a DST change).
function et(y, m, d, h, mi) {
  const t = Date.UTC(y, m - 1, d, h, mi);
  let ts = t;
  for (let i = 0; i < 2; i++) ts = t - (wall(ts, ET).utc - ts);
  return ts;
}

// e.g. "Tue 11:00 PM – Wed 2:00 AM" for ET weekday `day` (0 = Sun), "HH:MM" start/end, on its next occurrence.
export function localRange(day, start, end, { now = Date.now(), zone, locale } = {}) {
  const t = wall(now, ET), [sh, sm] = start.split(':'), [eh, em] = end.split(':');
  const at = (ahead) => {
    const b = new Date(Date.UTC(t.y, t.m - 1, t.d + ahead)), y = b.getUTCFullYear(), m = b.getUTCMonth() + 1, d = b.getUTCDate();
    return [et(y, m, d, sh, sm), et(y, m, d + (+eh * 60 + +em <= +sh * 60 + +sm ? 1 : 0), eh, em)];
  };
  const ahead = (day - t.wd + 7) % 7;
  let [s, e] = at(ahead);
  if (e <= now) [s, e] = at(ahead + 7); // already finished today: next week
  const a = wall(s, zone), b = wall(e, zone), cross = b.wd !== a.wd;
  const f = (ts, wd) => new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: wd ? 'short' : undefined, hour: 'numeric', minute: '2-digit' }).format(ts);
  return `${f(s, a.wd !== day || cross)} – ${f(e, cross)}`;
}

if (typeof document !== 'undefined') {
  const today = wall(Date.now(), ET).wd;
  document.querySelectorAll('.day').forEach((d) => {
    if (+d.dataset.day === today) d.setAttribute('aria-current', 'date');
    d.querySelectorAll('.sched time').forEach((t) => {
      t.parentNode.querySelector('.local').textContent = 'Your time: ' + localRange(+d.dataset.day, t.dateTime, t.dataset.end);
    });
  });
}
