export interface AttackPanel {
  element: HTMLElement;
}

/** Placeholder for the Attack tab — locked for this milestone. */
export function createAttackPanel(): AttackPanel {
  const panel = document.createElement('div');
  panel.className = 'panel attack-panel';

  const title = document.createElement('h3');
  title.className = 'panel-title';
  title.textContent = 'Attack';
  panel.appendChild(title);

  const lockedMsg = document.createElement('div');
  lockedMsg.className = 'attack-coming-soon';
  lockedMsg.innerHTML = `
    <div class="attack-lock-icon">🔒</div>
    <p>Coming Soon</p>
  `;
  panel.appendChild(lockedMsg);

  return { element: panel };
}
