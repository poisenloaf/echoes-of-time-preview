// Fills the Discord online count. Loaded only when a valid discord.serverId is set.
const el = document.querySelector('[data-discord-id]');
if (el) {
  const set = (t) => { el.textContent = t; };
  set('Online count loading.');
  try {
    fetch(`https://discord.com/api/guilds/${el.dataset.discordId}/widget.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const n = d.presence_count;
        if (!Number.isInteger(n) || n < 0) throw 0;
        set(`${n} ${n === 1 ? 'member' : 'members'} online`);
      })
      .catch(() => set('Online count unavailable.'));
  } catch { set('Online count unavailable.'); }
}
