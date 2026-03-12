document.addEventListener('DOMContentLoaded', () => {
    const themesInput = document.getElementById('themes') as HTMLInputElement;
    const blockNsfwCheckbox = document.getElementById('blockNsfw') as HTMLInputElement;
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    chrome.storage.sync.get(['oc_themes', 'oc_block_nsfw'], (result) => {
        if (result.oc_themes) themesInput.value = result.oc_themes;
        if (result.oc_block_nsfw) blockNsfwCheckbox.checked = result.oc_block_nsfw;
    });

    saveBtn?.addEventListener('click', () => {
        const themes = themesInput.value;
        const blockNsfw = blockNsfwCheckbox.checked;

        chrome.storage.sync.set({
            oc_themes: themes,
            oc_block_nsfw: blockNsfw
        }, () => {
            if (statusDiv) {
                statusDiv.style.display = 'block';
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 2000);
            }
            // Notify background script to reload intents
            chrome.runtime.sendMessage({ type: 'INTENTS_UPDATED' });
        });
    });
});
