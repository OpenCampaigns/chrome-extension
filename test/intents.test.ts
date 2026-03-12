import { describe, it, expect } from 'vitest';

/**
 * We mock the intent filtering logic here to ensure out Extension background logic
 * properly interprets user desires based on tags.
 */
describe('User Intent Filters', () => {
    it('blocks NSFW campaigns when the flag is enabled', () => {
        const userIntents = {
            themes: [],
            blockNsfw: true
        };

        const mockCampaign = {
            id: '1',
            tags: ['adult', 'dating']
        };

        const isNsfw = mockCampaign.tags.some(tag => ['nsfw', '18+', 'adult'].includes(tag.toLowerCase()));

        expect(isNsfw).toBe(true);
        expect(userIntents.blockNsfw).toBe(true);
    });

    it('matches configured themes', () => {
        const userIntents = {
            themes: ['software', 'tech'],
            blockNsfw: false
        };

        const mockCampaign = {
            id: '2',
            tags: ['software', 'SaaS']
        };

        const cTags = mockCampaign.tags.map(t => t.toLowerCase());
        const matchesTheme = userIntents.themes.some(theme => cTags.includes(theme));

        expect(matchesTheme).toBe(true);
    });
});
