/**
 * OpenCampaigns Content Injector
 * Finds generic ad placeholder slots and replaces them with an OpenCampaigns component.
 */

// Since we are compiling a content script, we can include the Display components dynamically
// ESBuild will bundle @opencampaigns/display here, ensuring the web component `<open-campaign>` is defined on the host window.
import '@opencampaigns/display';

// Listen to messages or request campaigns from the background script
function requestActiveCampaigns() {
    chrome.runtime.sendMessage({ type: 'GET_CAMPAIGNS' }, (response) => {
        if (response && response.campaigns && response.campaigns.length > 0) {
            injectAds(response.campaigns);
        }
    });
}

function injectAds(campaigns: any[]) {
    // Strategy: Look for specific elements we want to replace or fill.
    // E.g., a publisher might put <div class="opencampaigns-slot"></div>
    const adSlots = document.querySelectorAll('.opencampaigns-slot');

    adSlots.forEach((slot, index) => {
        // Only inject if empty
        if (slot.children.length === 0) {
            const adComponent = document.createElement('open-campaign');

            // By setting specific tags or simply taking one campaign randomly from the pool
            // Since the background worker already filtered by the User Intent, 
            // any campaign here is valid!

            // To pass pre-rendered static campaigns into the component without it calling Nostr itself
            // We would ideally want our Web Component to support local properties
            // But since our web component currently auto-discovers itself, we just inject it!

            // Currently, the `<open-campaign>` web component does its own Nostr discovery.
            // But wait, the extension is supposed to manage the intents.
            // If the Web component discovers naturally, we need to pass the user's tags down.

            chrome.storage.sync.get(['oc_themes', 'oc_block_nsfw'], (res) => {
                let tagsToSet = res.oc_themes || '';

                // If the component supports setting its `tags` property:
                if (tagsToSet) {
                    adComponent.setAttribute('tags', tagsToSet);
                }

                slot.appendChild(adComponent);
            });
        }
    });
}

// Give the page a moment to load and the background script a moment to fetch Nostr events
setTimeout(() => {
    // Instead of forcing the background to send us campaigns, 
    // we just inject the web component configured with the user's intents!

    // We look for slots
    const slots = document.querySelectorAll('.opencampaigns-slot');
    if (slots.length > 0) {
        chrome.storage.sync.get(['oc_themes', 'oc_block_nsfw'], (res) => {
            const tagsToSet = res.oc_themes || '';
            slots.forEach(slot => {
                if (slot.children.length === 0) {
                    const adComponent = document.createElement('open-campaign');
                    if (tagsToSet) adComponent.setAttribute('tags', tagsToSet);
                    // The component handles the rest!
                    slot.appendChild(adComponent);
                }
            });
        });
    }
}, 1000);
