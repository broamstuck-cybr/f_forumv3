import { app } from './app.js';
import { ensureLocalEnvLoaded } from './quotaStore.js';

ensureLocalEnvLoaded();

const port = Number(process.env.PORT || 8787);

app.listen(port, () => {
  process.stdout.write(`F-FORUM v3 API server listening on http://localhost:${port}\n`);
});
