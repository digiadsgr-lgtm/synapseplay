import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const distIndexHtmlPath = path.join(distDir, 'index.html');

async function prerenderAllRoutes() {
  if (!fs.existsSync(distIndexHtmlPath)) {
    throw new Error(`dist/index.html not found at ${distIndexHtmlPath}. Run vite build first.`);
  }

  const baseTemplate = fs.readFileSync(distIndexHtmlPath, 'utf-8');

  // Bundle src/utils/seoEngine.ts into a temporary ESM module so we can call getAllPrerenderRoutes & injectSeoIntoHtmlTemplate
  const tempBundlePath = path.join(distDir, '__seo_prerender_bundle.mjs');
  await esbuild.build({
    entryPoints: [path.join(projectRoot, 'src', 'utils', 'seoEngine.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempBundlePath,
  });

  try {
    const seoModule = await import(pathToFileURL(tempBundlePath).href);
    const routes = seoModule.getAllPrerenderRoutes();

    let generatedCount = 0;
    for (const route of routes) {
      const renderedHtml = seoModule.injectSeoIntoHtmlTemplate(baseTemplate, route);

      if (route === '/') {
        fs.writeFileSync(distIndexHtmlPath, renderedHtml, 'utf-8');
        generatedCount += 1;
        continue;
      }

      const relPath = route.replace(/^\/+/, '');
      const dirTarget = path.join(distDir, relPath);
      fs.mkdirSync(dirTarget, { recursive: true });
      fs.writeFileSync(path.join(dirTarget, 'index.html'), renderedHtml, 'utf-8');

      // Also write flat .html file (e.g., dist/articles/09-fine-motor-writing-readiness.html) for cleanUrls servers
      const parentDir = path.dirname(path.join(distDir, `${relPath}.html`));
      fs.mkdirSync(parentDir, { recursive: true });
      fs.writeFileSync(path.join(distDir, `${relPath}.html`), renderedHtml, 'utf-8');

      generatedCount += 1;
    }

    console.log(
      `[SEO Prerender] Successfully pre-rendered ${generatedCount} static HTML routes with self-referencing canonical tags.`
    );
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      fs.unlinkSync(tempBundlePath);
    }
  }
}

prerenderAllRoutes().catch((err) => {
  console.error('[SEO Prerender] Error:', err);
  process.exit(1);
});
