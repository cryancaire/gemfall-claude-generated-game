import { ENDLESS_CHALLENGES } from '../data/endlessChallenges.js';
import { ENDLESS_MILESTONE_TIME } from '../config.js';

const MINS_PER_MILESTONE = ENDLESS_MILESTONE_TIME / 60;

// Shown at each milestone in endless mode.
// Player picks one challenge — harder game, but immediate reward + stacking shard bonus.
export class EndlessModifierScreen {
  constructor(onSelect) {
    this._el          = document.getElementById('endless-modifier-screen');
    this._cardsEl     = document.getElementById('endless-mod-cards');
    this._milestoneEl = document.getElementById('endless-mod-milestone');
    this._onSelect    = onSelect;
    this._player      = null;
    this._entities    = null;
  }

  show(player, entities, milestoneNumber) {
    this._player     = player;
    this._entities   = entities;
    this._gpFocusIdx = 0;
    this._milestoneEl.textContent = `${milestoneNumber * MINS_PER_MILESTONE}-Minute Milestone`;
    this._render();
    this.setVisible(true);
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }

  _render() {
    this._cardsEl.innerHTML = '';
    const applicable = ENDLESS_CHALLENGES.filter(c => c.isApplicable(this._player, this._entities));
    const picks = applicable.sort(() => Math.random() - 0.5).slice(0, 3);

    for (const mod of picks) {
      const shardLabel = `+${Math.round(mod.shardBonus * 100)}% shards`;
      const card = document.createElement('div');
      card.className = 'mod-card endless-milestone-card';
      card.innerHTML = `
        <div class="mod-card-icon">${mod.icon}</div>
        <div class="mod-card-name">${mod.name}</div>
        <div class="mod-card-desc">${mod.description.replace(/\n/g, '<br>')}</div>
        <div class="endless-milestone-badge challenge-badge">${shardLabel}</div>
      `;
      card.addEventListener('click', () => {
        mod.apply(this._player, this._entities);
        this.setVisible(false);
        this._onSelect(mod);
      });
      this._cardsEl.appendChild(card);
    }

    if (picks.length === 0) {
      // All challenges already active — auto-dismiss with a small bonus
      this._player.spellDamageBonus += 0.10;
      this.setVisible(false);
      this._onSelect(null);
      return;
    }

    const cards = this._cardsEl.querySelectorAll('.mod-card');
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === 0));
  }

  gamepadNavigate(input) {
    const cards = Array.from(this._cardsEl.querySelectorAll('.mod-card'));
    if (!cards.length) return;
    if (this._gpFocusIdx === undefined || this._gpFocusIdx >= cards.length) this._gpFocusIdx = 0;

    if (input.wasPressed('gp_left') || input.wasPressed('gp_up')) {
      this._gpFocusIdx = (this._gpFocusIdx - 1 + cards.length) % cards.length;
    } else if (input.wasPressed('gp_right') || input.wasPressed('gp_down')) {
      this._gpFocusIdx = (this._gpFocusIdx + 1) % cards.length;
    } else if (input.wasPressed('gp_confirm')) {
      cards[this._gpFocusIdx]?.click();
      return;
    }
    cards.forEach((el, i) => el.classList.toggle('gp-focus', i === this._gpFocusIdx));
  }
}
