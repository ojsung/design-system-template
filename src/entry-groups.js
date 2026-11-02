// Text link lists: long groups show a few entries and expand on request. Without this script every entry stays visible.
document.querySelectorAll('.entry-list[data-limit]').forEach((list, index) => {
  const extra = [...list.children].slice(Number(list.dataset.limit));
  if (!extra.length) return;
  list.id ||= `entry-list-${index}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn sm ghost';
  button.setAttribute('aria-controls', list.id);
  const paint = (open) => {
    extra.forEach((item) => { item.hidden = !open; });
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Show fewer' : `Show ${extra.length} more`;
  };
  button.addEventListener('click', () => paint(button.getAttribute('aria-expanded') !== 'true'));
  paint(false);

  const row = document.createElement('p');
  row.className = 'entry-more';
  row.append(button);
  list.after(row);
});
