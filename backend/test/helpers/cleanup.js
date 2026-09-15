import './testEnv.js';
import { supabase } from '../../src/db/index.js';

// node --test may run separate test files concurrently (each its own
// subprocess), so every file gets its own fixture network id rather than
// sharing one "test" network — otherwise one file's cleanup could delete
// another file's in-progress rows.
export async function resetTestNetwork(networkId) {
  // devices.network_id has a FK into networks(id), so the fixture network
  // must exist before any test device can be inserted into it.
  const { error: networkError } = await supabase.from('networks').upsert({ id: networkId, name: `Test (${networkId})` });
  if (networkError) throw networkError;

  const { error } = await supabase.from('devices').delete().eq('network_id', networkId);
  if (error) throw error;
}
