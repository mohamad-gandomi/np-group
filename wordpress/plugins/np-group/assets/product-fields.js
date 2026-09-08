/* global document */
(() => {
  const body = document.querySelector('#np-specifications tbody');
  const template = document.querySelector('#np-specification-template');
  const add = document.querySelector('#np-add-specification');
  if (!body || !template || !add) return;

  function renumber() {
    [...body.rows].forEach((row, index) => {
      row.querySelectorAll('input').forEach((input) => {
        input.name = input.name.replace(/\[[^\]]+\]/, `[${index}]`);
      });
      row.querySelector('[data-np-action="up"]').disabled = index === 0;
      row.querySelector('[data-np-action="down"]').disabled = index === body.rows.length - 1;
    });
    add.disabled = body.rows.length >= 100;
  }

  add.addEventListener('click', () => {
    if (body.rows.length >= 100) return;
    body.append(template.content.cloneNode(true));
    renumber();
    body.lastElementChild.querySelector('input').focus();
  });
  body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-np-action]');
    if (!button) return;
    const row = button.closest('tr');
    if (button.dataset.npAction === 'up' && row.previousElementSibling) body.insertBefore(row, row.previousElementSibling);
    if (button.dataset.npAction === 'down' && row.nextElementSibling) body.insertBefore(row.nextElementSibling, row);
    if (button.dataset.npAction === 'remove') row.remove();
    renumber();
  });
  renumber();
})();
