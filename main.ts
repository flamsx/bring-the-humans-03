import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

// Entrypoint (Node 22): copy VIDEO.json to the harness output dir.
// VIDEO.json holds the public TikTok URL of the posted video — fill it in
// after posting (see README.md), then this entry is ready to submit.
const destination = join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'VIDEO.json');
copyFileSync(new URL('./VIDEO.json', import.meta.url), destination);
console.log(`Copied VIDEO.json -> ${destination}`);
