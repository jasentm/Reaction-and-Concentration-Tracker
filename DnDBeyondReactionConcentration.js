// ==UserScript==
// @name         DnDBeyond Concentration and Reaction Tracker
// @description  Adds a popup with checkboxes to track Concentration and Reaction on DnDBeyond character sheets.
// @version      1.4
// @author       YourName
// @match        https://www.dndbeyond.com/*characters/*
// @match        https://www.dndbeyond.com/characters
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    'use strict';
  
    // Function to create and show the popup
    const createPopup = () => {
        // Retrieve character ID from the URL
        const characterId = location.pathname.split('/').pop();
      
        // Check if character ID is available
        if (!characterId) {
          console.error('Character ID not found in URL');
          return;
        }
      
        // Create a unique storage key for this character
        const storageKey = `dndbeyond_${characterId}_checkboxes`;
      
        // Retrieve the state of checkboxes from local storage
        const savedCheckboxes = JSON.parse(localStorage.getItem(storageKey)) || {};
        const savedReaction = savedCheckboxes.reaction || false;
        const savedConcentration = savedCheckboxes.concentration || false;
      
        // Create the popup container
        const popup = document.createElement('div');
        popup.id = 'cr-popup';
        popup.style.position = 'fixed';
        popup.style.bottom = '10px';  // Position from the bottom of the screen
        popup.style.right = '10px';   // Position from the right side of the screen
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
              <input type="checkbox" id="reactionCheckbox" ${savedReaction ? 'checked' : ''}>
              Reaction
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" id="concentrationCheckbox" ${savedConcentration ? 'checked' : ''}>
              Concentration
            </label>
          </div>
        `;
      
        // Append the popup to the body
        document.body.appendChild(popup);
      
        // Add event listeners to checkboxes to update local storage
        const reactionCheckbox = document.getElementById('reactionCheckbox');
        const concentrationCheckbox = document.getElementById('concentrationCheckbox');
        reactionCheckbox.addEventListener('change', () => {
          const checkboxes = { ...savedCheckboxes, reaction: reactionCheckbox.checked };
          localStorage.setItem(storageKey, JSON.stringify(checkboxes));
        });
        concentrationCheckbox.addEventListener('change', () => {
          const checkboxes = { ...savedCheckboxes, concentration: concentrationCheckbox.checked };
          localStorage.setItem(storageKey, JSON.stringify(checkboxes));
        });
      };
    
    
        // Function to create and show the custom alert box
        const showAlert = (message) => {
        // Create the modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'cr-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = 2000;
    
        // Create the modal box
        const modal = document.createElement('div');
        modal.className = 'cr-modal';
        modal.style.position = 'absolute';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.padding = '20px';
        modal.style.backgroundColor = '#fff';
        modal.style.border = '1px solid #000';
        modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    
        // Create the message
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
    
        // Create the "Okay" button
        const button = document.createElement('button');
        button.textContent = 'Okay';
        button.addEventListener('click', () => {
            // Remove the modal overlay
            overlay.remove();
        });
    
        // Append elements to modal
        modal.appendChild(messageElement);
        modal.appendChild(button);
    
        // Append modal to overlay
        overlay.appendChild(modal);
    
        // Append overlay to body
        document.body.appendChild(overlay);
        };
  
    // Function to add event listener to the damage button
    const addDamageListener = () => {
        const damageButton = document.querySelector('.ct-health-summary__adjuster-button--damage');
        const damageInput = document.querySelector('.ct-health-summary__adjuster-field-input');
      
        if (damageButton && damageInput) {
          damageButton.addEventListener('click', () => {
            // Check if an alert is already being displayed
            if (document.querySelector('.cr-overlay')) {
              return;
            }
      
            const concentrationCheckbox = document.getElementById('concentrationCheckbox');
            if (concentrationCheckbox && concentrationCheckbox.checked) {
              const damage = parseInt(damageInput.value, 10);
              if (!isNaN(damage) && damage > 0) {
                const dc = Math.max(10, Math.floor(damage / 2));
                showAlert(`Make a Concentration check (Constitution Saving Throw)! The DC is ${dc}.`);
              } else {
                showAlert('Invalid damage value.');
              }
            }
          });
        }
      };
  
    // Function to observe changes in the DOM and add event listeners when elements are available
    const observeDOM = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            addDamageListener();
          }
        });
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };
  
    // Check if we are on a character sheet page and create the popup
    const init = () => {
      if (location.pathname.includes('/characters/')) {
        createPopup();
        observeDOM();
      }
    };
  
    // Run the init function after the page loads
    window.addEventListener('load', init);
  })();
