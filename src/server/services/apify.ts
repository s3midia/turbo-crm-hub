import { ApifyClient } from 'apify-client';

// We fall back to the placeholder for now if it's not present, 
// though it should be populated via VITE_APIFY_API_KEY.
const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_KEY || '';

const apifyClient = new ApifyClient({
    token: APIFY_API_TOKEN,
});

/**
 * Triggers an Apify actor and waits for it to finish.
 *
 * @param actorId The ID of the Apify Actor to run (e.g. 'compass/google-maps-extractor')
 * @param input The input object for the actor
 * @returns The dataset items from the actor run
 */
export async function runApifyActor(actorId: string, input: any) {
    try {
        console.log(`Starting Apify actor ${actorId}...`);
        
        // Start the actor
        const run = await apifyClient.actor(actorId).call(input);
        
        console.log(`Actor ${actorId} finished with status: ${run.status}`);
        
        if (run.status !== 'SUCCEEDED') {
            throw new Error(`Actor ${actorId} failed with status: ${run.status}`);
        }
        
        // Fetch and return the results from the dataset
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        return items;
    } catch (error) {
        console.error(`Error running Apify actor ${actorId}:`, error);
        throw error;
    }
}
