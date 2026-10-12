import { cleanup } from '../lib/cleanup';
cleanup()
  .then((r) => {
    console.log(r);
    process.exit(r.failed ? 1 : 0);
  })
  .catch(() => {
    console.error('Cleanup failed. Check database and storage configuration.');
    process.exit(1);
  });
