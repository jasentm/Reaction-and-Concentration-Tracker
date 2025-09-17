// ==UserScript==
// @name         DnDBeyond Concentration and Reaction Tracker
// @description  Adds a popup with checkboxes to track Concentration and Reaction on DnDBeyond character sheets.
// @version      1.1
// @author       jasentm
// @match        https://www.dndbeyond.com/*characters/*
// @match        https://www.dndbeyond.com/characters
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // ---- utils ----
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---- popup + storage ----
  const createPopup = () => {
    const characterId = location.pathname.split('/').pop();
    if (!characterId) {
      console.error('Character ID not found in URL');
      return;
    }

    const storageKey = `dndbeyond_${characterId}_checkboxes`;
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    const savedReaction = !!saved.reaction;
    const savedConcentration = !!saved.concentration;

    const popup = document.createElement('div');
    popup.id = 'cr-popup';
    Object.assign(popup.style, {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '130px',
      padding: '10px',
      backgroundColor: '#fff',
      border: '2px solid #000',
      zIndex: 1000,
      boxShadow: '0 4px 8px rgba(0,0,0,.1)',
      borderRadius: '6px',
      fontFamily: 'inherit',
      fontSize: '14px'
    });

    popup.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <input type="checkbox" id="reactionCheckbox" ${savedReaction ? 'checked' : ''}>
        <label for="reactionCheckbox">Reaction</label>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="checkbox" id="concentrationCheckbox" ${savedConcentration ? 'checked' : ''}>
        <label for="concentrationCheckbox">Concentration</label>
      </div>
    `;
    document.body.appendChild(popup);

    const reactionCheckbox = qs('#reactionCheckbox');
    const concentrationCheckbox = qs('#concentrationCheckbox');

    reactionCheckbox.addEventListener('change', () => {
      localStorage.setItem(storageKey, JSON.stringify({ ...saved, reaction: reactionCheckbox.checked }));
    });
    concentrationCheckbox.addEventListener('change', () => {
      localStorage.setItem(storageKey, JSON.stringify({ ...saved, concentration: concentrationCheckbox.checked }));
    });
  };

  const createToggleButton = () => {
    const button = document.createElement('button');
    button.textContent = 'Hide';
    button.id = 'cr-toggle-button';
    Object.assign(button.style, {
      position: 'fixed',
      border: '1px solid #000',
      bottom: '78px',
      right: '10px',
      zIndex: 1000,
      padding: '6px 10px',
      borderRadius: '6px',
      background: '#fff',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '13px'
    });
    button.addEventListener('click', () => {
      const popup = qs('#cr-popup');
      if (!popup) return;
      const nowHidden = popup.style.display !== 'none' ? 'none' : 'block';
      popup.style.display = nowHidden;
      button.textContent = nowHidden === 'none' ? 'Show' : 'Hide';
    });
    document.body.appendChild(button);
  };

  // ---- style sync to DDB border ----
  const applyBorderColor = () => {
    const svgPath = qs('.ddbc-initiative-box-svg path');
    if (!svgPath) return;
    const borderColor = svgPath.getAttribute('fill') || '#000';
    const popup = qs('#cr-popup');
    const button = qs('#cr-toggle-button');
    if (popup) popup.style.borderColor = borderColor;
    if (button) button.style.borderColor = borderColor;
  };

  const observeSVGChanges = () => {
    const svgEl = qs('.ddbc-initiative-box-svg');
    if (!svgEl) return;
    const mo = new MutationObserver(applyBorderColor);
    mo.observe(svgEl, { attributes: true, childList: true, subtree: true });
  };

  // ---- custom alert ----
  const showAlert = (message) => {
    if (qs('.cr-overlay')) return; // prevent stacking

    const overlay = document.createElement('div');
    overlay.className = 'cr-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0',
      backgroundColor: 'rgba(0,0,0,.5)',
      zIndex: 2000
    });

    const modal = document.createElement('div');
    modal.className = 'cr-modal';
    Object.assign(modal.style, {
      position: 'absolute',
      top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      padding: '16px 18px',
      backgroundColor: '#fff',
      border: '1px solid #000',
      boxShadow: '0 4px 8px rgba(0,0,0,.3)',
      borderRadius: '8px',
      maxWidth: '80%', textAlign: 'center', lineHeight: '1.4'
    });

    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.marginBottom = '12px';

    const btn = document.createElement('button');
    btn.textContent = 'Okay';
    Object.assign(btn.style, {
      border: '1px solid #000',
      background: '#fff',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: 'pointer'
    });
    btn.addEventListener('click', () => overlay.remove());

    modal.appendChild(msg);
    modal.appendChild(btn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    console.log(message);
  };

  // ---- damage / apply handler (robust, class-name-light) ----
  const hookAdjusterApply = () => {
    // Look for an open adjuster-like container
    const candidates = qsa('[class*="adjuster"], [data-testid*="adjuster"], [aria-label*="Adjust"]');
    let container = candidates.find(el =>
      /health|adjuster|damage/i.test(el.className + ' ' + (el.getAttribute('aria-label') || ''))
    ) || document.body;

    // Inside it, find a numeric input (damage value)
    const input =
      qs('.ct-health-summary__adjuster-field-input', container) ||
      qs('input[type="number"]', container) ||
      qs('input[pattern*="\\d"]', container);

    // Find an Apply-like button
    const applyBtn = qsa('button', container)
      .find(b => /apply|confirm|damage/i.test((b.textContent || '').trim()) && !b.dataset.crBound);

    if (applyBtn && input) {
      applyBtn.dataset.crBound = '1';
      applyBtn.addEventListener('click', () => {
        const conc = qs('#concentrationCheckbox');
        if (!conc || !conc.checked) return;

        const n = Number(input.value);
        if (!Number.isFinite(n) || n <= 0) {
          showAlert('Invalid damage value.');
          return;
        }
        const dc = Math.max(10, Math.floor(n / 2));
        showAlert(`Make a Concentration check! The DC is ${dc}.`);
      }, { capture: true });
    }
  };

  // Fallback: if the legacy selectors exist, also hook those directly
  const addLegacyDamageListener = () => {
    const damageButton = qs('.ct-health-summary__adjuster-button--damage');
    if (!damageButton) return;
    damageButton.addEventListener('click', () => {
      // Wait a tick for the adjuster UI to render, then hook Apply
      setTimeout(hookAdjusterApply, 0);
    });
  };

  // Observe DOM to (re)attach handlers as DDB renders/updates
  const observeDOM = () => {
    const mo = new MutationObserver(() => {
      applyBorderColor();
      hookAdjusterApply();
      addLegacyDamageListener();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  };

  // ---- init ----
  const init = () => {
    if (!location.pathname.includes('/characters/')) return;
    createPopup();
    createToggleButton();
    applyBorderColor(); // moved here so the button exists
    observeSVGChanges();
    observeDOM();
    // initial attempts
    hookAdjusterApply();
    addLegacyDamageListener();
  };

  window.addEventListener('load', init);
})();
