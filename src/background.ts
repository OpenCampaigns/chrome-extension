import {
    NostrRelayClient,
    fetchAndValidateIdentity,
    type Campaign
} from '@opencampaigns/sdk';

let client: NostrRelayClient | null = null;
let activeCampaigns: any[] = [];
let userIntents = {
    themes: [] as string[],
    excluded: [] as string[],
    blockNsfw: false
};

async function loadIntents() {
    return new Promise<void>((resolve) => {
        chrome.storage.sync.get(['oc_themes', 'oc_excluded_tags', 'oc_block_nsfw'], (result) => {
            if (result.oc_themes) {
                userIntents.themes = result.oc_themes.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
            }
            if (result.oc_excluded_tags) {
                userIntents.excluded = result.oc_excluded_tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
            }
            userIntents.blockNsfw = !!result.oc_block_nsfw;
            resolve();
        });
    });
}

async function startNostrDiscovery() {
    if (client) {
        client.close();
        activeCampaigns = [];
    }

    client = new NostrRelayClient(['wss://relay.damus.io']);

    client.subscribeToCampaigns(async (event) => {
        try {
            const domainTag = event.tags?.find((t: string[]) => t[0] === 'domain');
            if (!domainTag || !domainTag[1]) return;
            const domain = domainTag[1];

            const config = await fetchAndValidateIdentity(domain);
            if (config.publisher.pubkey !== event.pubkey) return;

            // Apply User Intents locally on the browser side before any UI renders
            const filtered = config.campaigns.filter(c => {
                const cTags = c.tags?.map(t => t.toLowerCase()) || [];

                // Rule 1: NSFW intent
                const isNsfw = cTags.some(tag => ['nsfw', '18+', 'adult'].includes(tag));
                if (userIntents.blockNsfw && isNsfw) return false;

                // Rule 2: Explicit Exclusions
                if (userIntents.excluded.length > 0) {
                    if (userIntents.excluded.some(ex => cTags.includes(ex))) return false;
                }

                // Rule 3: Theme intent (Inclusive matching)
                if (userIntents.themes.length > 0) {
                    const matchesTheme = userIntents.themes.some(theme => cTags.includes(theme));
                    if (!matchesTheme && c.type !== 'system') return false;
                }

                return true;
            });

            const mapped = filtered.map(c => ({
                ...c,
                publisherDomain: domain,
                publisherName: config.publisher.name
            }));

            // Push into our active pool
            activeCampaigns.push(...mapped);

            // Keep pool from growing infinitely
            if (activeCampaigns.length > 50) {
                activeCampaigns.splice(0, activeCampaigns.length - 50);
            }
        } catch (e) {
            console.error('Validation failure on background worker:', e);
        }
    });
}

// Re-init when user changes settings
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INTENTS_UPDATED') {
        loadIntents().then(() => startNostrDiscovery());
    } else if (message.type === 'GET_CAMPAIGNS') {
        sendResponse({ campaigns: activeCampaigns });
    }
});

// Start the service worker script
loadIntents().then(() => startNostrDiscovery());
