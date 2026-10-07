#!/usr/bin/env node
// One-shot Play Console release: uploads the AAB, sets the track, pushes
// store listing text (ka-GE + en-US) and images via the Play Developer API.
// Does NOT touch Data Safety or Content Rating — Google only exposes those
// through the Play Console UI, there is no API for either.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { google } from 'googleapis';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { track: 'internal', package: 'ge.thera.app' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--key') opts.key = args[++i];
    else if (a === '--aab') opts.aab = args[++i];
    else if (a === '--assets') opts.assets = args[++i];
    else if (a === '--track') opts.track = args[++i];
    else if (a === '--package') opts.package = args[++i];
    else if (a === '--copy') opts.copy = args[++i];
  }
  return opts;
}

async function resolveAab(aabPathOrUrl, destDir) {
  if (!/^https?:\/\//.test(aabPathOrUrl)) return aabPathOrUrl;
  const dest = path.join(destDir, 'app-release.aab');
  const res = await fetch(aabPathOrUrl);
  if (!res.ok) throw new Error(`Failed to download AAB: ${res.status} ${res.statusText}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

async function uploadImage(publisher, { packageName, editId, language, imageType, filePath }) {
  console.log(`  uploading ${imageType} (${language}): ${path.basename(filePath)}`);
  await publisher.edits.images.upload({
    packageName,
    editId,
    language,
    imageType,
    media: { mimeType: 'image/png', body: fs.createReadStream(filePath) },
  });
}

async function main() {
  const opts = parseArgs();
  if (!opts.key || !opts.aab || !opts.assets) {
    console.error(
      'Usage: node publish.mjs --key <service-account.json> --aab <path-or-url> --assets <dir> [--track internal|production] [--package ge.thera.app] [--copy <listing-copy.json>]',
    );
    process.exit(1);
  }

  const copyPath = opts.copy ?? path.join(import.meta.dirname, 'listing-copy.json');
  const copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));
  const packageName = opts.package;

  const auth = new google.auth.GoogleAuth({
    keyFile: opts.key,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const publisher = google.androidpublisher({ version: 'v3', auth });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'play-release-'));
  const aabLocalPath = await resolveAab(opts.aab, tmpDir);

  console.log('Creating edit...');
  const { data: edit } = await publisher.edits.insert({ packageName });
  const editId = edit.id;

  console.log('Uploading AAB...');
  const { data: bundle } = await publisher.edits.bundles.upload({
    packageName,
    editId,
    media: { mimeType: 'application/octet-stream', body: fs.createReadStream(aabLocalPath) },
  });
  const versionCode = bundle.versionCode;
  console.log(`  versionCode ${versionCode}`);

  console.log(`Setting "${opts.track}" track...`);
  await publisher.edits.tracks.update({
    packageName,
    editId,
    track: opts.track,
    requestBody: {
      track: opts.track,
      releases: [{ versionCodes: [String(versionCode)], status: 'completed' }],
    },
  });

  for (const [locale, fields] of Object.entries(copy)) {
    console.log(`Updating listing text for ${locale}...`);
    await publisher.edits.listings.update({
      packageName,
      editId,
      language: locale,
      requestBody: fields,
    });
  }

  console.log('Uploading images...');
  const primaryLocale = Object.keys(copy)[0];

  const iconPath = path.join(opts.assets, 'icon-512.png');
  if (fs.existsSync(iconPath)) {
    await uploadImage(publisher, { packageName, editId, language: primaryLocale, imageType: 'icon', filePath: iconPath });
  }

  const featureGraphicPath = path.join(opts.assets, 'feature-graphic.png');
  if (fs.existsSync(featureGraphicPath)) {
    await uploadImage(publisher, { packageName, editId, language: primaryLocale, imageType: 'featureGraphic', filePath: featureGraphicPath });
  }

  const screenshotsDir = path.join(opts.assets, 'screenshots');
  if (fs.existsSync(screenshotsDir)) {
    const files = fs
      .readdirSync(screenshotsDir)
      .filter((f) => /\.(png|jpe?g)$/i.test(f))
      .sort();
    for (const file of files) {
      await uploadImage(publisher, {
        packageName,
        editId,
        language: primaryLocale,
        imageType: 'phoneScreenshots',
        filePath: path.join(screenshotsDir, file),
      });
    }
  }

  console.log('Committing edit...');
  await publisher.edits.commit({ packageName, editId });

  console.log(`\nDone. Release is on the "${opts.track}" track — review it in Play Console before promoting.`);
  console.log('Reminder: Data Safety and Content Rating still need to be filled in manually in Play Console.');
}

main().catch((err) => {
  console.error(err?.response?.data ?? err);
  process.exit(1);
});
