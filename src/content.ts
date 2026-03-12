/**
 * OpenCampaigns Content Injector
 * Finds generic ad placeholder slots and replaces them with an OpenCampaigns component.
 */

// Since we are compiling a content script, we can include the Display components dynamically
// ESBuild will bundle @opencampaigns/display here, ensuring the web component `<open-campaign>` is defined on the host window.
import '@opencampaigns/display';

function syncAttributes(adComponent: Element, res: { [key: string]: any }) {
    const tagsToSet = res.oc_themes || '';
    const excludedTagsToSet = res.oc_excluded_tags || '';

    if (tagsToSet) {
        adComponent.setAttribute('tags', tagsToSet);
    } else {
        adComponent.removeAttribute('tags');
    }

    if (excludedTagsToSet) {
        adComponent.setAttribute('excluded-tags', excludedTagsToSet);
    } else {
        adComponent.removeAttribute('excluded-tags');
    }
}

function initializeAds() {
    const slots = document.querySelectorAll('.opencampaigns-slot');
    if (slots.length === 0) return;

    chrome.storage.sync.get(['oc_themes', 'oc_excluded_tags', 'oc_block_nsfw'], (res) => {
        slots.forEach(slot => {
            if (slot.children.length === 0) {
                const adComponent = document.createElement('open-campaign');
                syncAttributes(adComponent, res);
                slot.appendChild(adComponent);
            }
        });
    });
}

// Listen for live updates from the extension popup
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        chrome.storage.sync.get(['oc_themes', 'oc_excluded_tags'], (res) => {
            const activeComponents = document.querySelectorAll('open-campaign');
            activeComponents.forEach(comp => {
                syncAttributes(comp, res);
            });
        });
    }
});

// Initial load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAds);
} else {
    initializeAds();
}

// Backup check for late-loading slots
setTimeout(initializeAds, 1000);
setTimeout(initializeAds, 3000);
