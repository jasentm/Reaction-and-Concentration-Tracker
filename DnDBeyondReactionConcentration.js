// ==UserScript==
// @name         DnDBeyond Concentration and Reaction Tracker
// @description  Adds a popup with checkboxes to track Concentration and Reaction on DnDBeyond character sheets
// @version      1.0
// @author       jasentm
// @match        https://www.dndbeyond.com/*characters/*
// @match        https://www.dndbeyond.com/characters
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    //Function to create and show popup
    const createPopup = () => {
        // create popup container
        const popup = document.createElement('div');
        popup.id = 'cr-popup';
        popup.style.postion = 'fixed';
        popup.style.top = '10px';
        popup.style.right = '10px';
        popup.style.width = '200px';
        popup.style.padding = '10px';
        popup.style.backgroundColor = '#fff';
        popup.style.border = '1px solid #000';
        popup.style.zIndex = 1000;
        popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

        // Create the content
        popup.innerHTML = `
        <div>
            <label>
            <input type="checkbox" id="reactionCheckbox">
            Reaction
            </label>
        </div>
        <div>
            <label>
            <input type="checkbox" id="concentrationCheckbox">
            Concentration
            </label>
        </div>
        `;

        // Append the popup to the body
        document.body.appendChild(popup);
    };

    // Check if we are on a character sheet page and create the popup
    const init = () => {
        if (location.pathname.includes('/characters/')) {
        createPopup();
        }
    };

    // Run the init function after the page loads
    window.addEventListener('load', init);
    })();
        
