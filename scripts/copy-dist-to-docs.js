import fs from 'fs-extra';
import path from 'path';

const root = path.resolve(process.cwd());
const dist = path.join(root, 'dist');
const docs = path.join(root, 'docs');

(async () => {
  try {
    if (!(await fs.pathExists(dist))) {
      console.error('dist directory not found. Run `npm run build` first.');
      process.exit(1);
    }

    await fs.remove(docs);
    await fs.copy(dist, docs);
    console.log('Copied dist -> docs (ready for GitHub Pages docs/ hosting)');
  } catch (err) {
    console.error('Error copying dist to docs:', err);
    process.exit(1);
  }
})();
