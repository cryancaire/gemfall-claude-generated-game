import { calcScore, submitScore, fetchScores } from '../leaderboard.js';

export class GameOverScreen {
  constructor(onRestart) {
    this._el       = document.getElementById('gameover-screen');
    this._statsEl  = document.getElementById('go-stats');
    this._scoreEl  = document.getElementById('go-score');
    this._nameEl   = document.getElementById('go-name-input');
    this._submitEl = document.getElementById('go-submit-btn');
    this._statusEl = document.getElementById('go-lb-status');
    this._lbEl     = document.getElementById('go-leaderboard');
    this._formEl   = document.getElementById('go-lb-form');
    this._retryBtn = document.getElementById('go-retry-btn');

    this._currentScore = 0;

    this._retryBtn.addEventListener('click', () => {
      this.setVisible(false);
      onRestart();
    });

    this._submitEl.addEventListener('click', () => this._doSubmit());
    this._nameEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._doSubmit();
    });
  }

  show(player, entities, playTime = 0) {
    this._currentScore = calcScore(player, entities, playTime);

    this._statsEl.innerHTML = [
      ['Level Reached',    player.level],
      ['Time Survived',    _fmtTime(playTime)],
      ['Enemies Defeated', entities.enemiesDefeated],
      ['XP Collected',     player.totalXpCollected],
    ].map(([label, val]) =>
      `<div class="go-stat">
        <span class="go-stat-label">${label}</span>
        <span class="go-stat-val">${val}</span>
      </div>`
    ).join('');

    this._scoreEl.textContent  = this._currentScore.toLocaleString();
    this._statusEl.textContent = '';
    this._nameEl.value         = '';
    this._nameEl.disabled      = false;
    this._submitEl.disabled    = false;
    this._submitEl.textContent = 'Submit Score';
    this._lbEl.innerHTML       = '';
    this._formEl.style.display = '';

    this.setVisible(true);
    setTimeout(() => this._nameEl.focus(), 60);
  }

  async _doSubmit() {
    if (this._submitEl.disabled) return;
    const name = this._nameEl.value.trim() || 'Anonymous';
    this._nameEl.disabled      = true;
    this._submitEl.disabled    = true;
    this._submitEl.textContent = 'Submitting…';
    this._statusEl.textContent = '';

    try {
      await submitScore(name, this._currentScore);
      this._formEl.style.display = 'none';
      this._statusEl.textContent = '✓ Score submitted!';
      await this._loadLeaderboard();
    } catch (_) {
      this._statusEl.textContent = 'Could not submit — check your Dreamlo keys in src/leaderboard.js';
      this._nameEl.disabled      = false;
      this._submitEl.disabled    = false;
      this._submitEl.textContent = 'Try Again';
    }
  }

  async _loadLeaderboard() {
    this._statusEl.textContent = 'Loading leaderboard…';
    try {
      const scores = await fetchScores(10);
      this._statusEl.textContent = '';
      this._renderLeaderboard(scores);
    } catch (_) {
      this._statusEl.textContent = 'Could not load leaderboard.';
    }
  }

  _renderLeaderboard(scores) {
    if (!scores.length) {
      this._lbEl.innerHTML = '<p class="go-lb-empty">No scores yet.</p>';
      return;
    }
    const rows = scores.map((e, i) => {
      const isYou = e.score === this._currentScore;
      return `<tr class="go-lb-row${isYou ? ' go-lb-row--you' : ''}">
        <td class="go-lb-rank">${i + 1}</td>
        <td class="go-lb-name">${_esc(e.name)}${isYou ? ' ◀' : ''}</td>
        <td class="go-lb-score">${e.score.toLocaleString()}</td>
      </tr>`;
    }).join('');

    this._lbEl.innerHTML = `
      <h3 class="go-lb-title">Top Scores</h3>
      <table class="go-lb-table">
        <thead><tr><th>#</th><th>Name</th><th>Score</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  setVisible(v) {
    this._el.classList.toggle('screen--hidden', !v);
  }
}

function _fmtTime(playTime) {
  const s = Math.floor(playTime);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
