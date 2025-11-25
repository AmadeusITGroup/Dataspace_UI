import { rm } from 'fs/promises';

await rm(process.argv[2], { recursive: true, force: true });
