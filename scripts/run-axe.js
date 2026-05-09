import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

async function run() {
  const distIndex = path.resolve('dist/index.html');
  if (!fs.existsSync(distIndex)) {
    console.error('Build not found. Run `npm run build` before running a11y scan.');
    process.exit(1);
  }

  const html = fs.readFileSync(distIndex, 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });

  // Wait briefly for scripts to load (best-effort)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const { window } = dom;

  // Inject axe into the jsdom window and run it inside that context.
  // Use `axe.source` to evaluate axe in the page scope so it has proper globals.
  if (axe && axe.source) {
    window.eval(axe.source);
  }

  const results = await new Promise((resolve) => {
    window.axe = window.axe || {};
    // call the axe instance attached to window
    window.axe.run(window.document, {}, (err, res) => {
      if (err) throw err;
      resolve(res);
    });
  });

  if (results.violations && results.violations.length > 0) {
    console.error('Accessibility violations found:');
    results.violations.forEach((v) => {
      console.error(`- ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
    });
    process.exit(2);
  }

  console.log('No accessibility violations found by axe-core (basic scan).');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
