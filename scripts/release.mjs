#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
  });

  return typeof output === 'string' ? output.trim() : '';
}

function tryRun(command, args) {
  try {
    return run(command, args);
  } catch {
    return '';
  }
}

function parseVersion(version) {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    return null;
  }

  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }

  return 0;
}

function formatVersion(version) {
  return version.join('.');
}

function incrementPatch(version) {
  return [version[0], version[1], version[2] + 1];
}

function getKnownTags() {
  const tags = new Set();
  const addTag = (tag) => {
    const cleanTag = tag.trim().replace(/\^\{\}$/, '');

    if (parseVersion(cleanTag)) {
      tags.add(cleanTag.startsWith('v') ? cleanTag : `v${cleanTag}`);
    }
  };

  for (const tag of tryRun('git', ['tag', '--list', 'v*']).split('\n')) {
    if (tag) {
      addTag(tag);
    }
  }

  for (const line of tryRun('git', ['ls-remote', '--tags', 'origin', 'refs/tags/v*']).split('\n')) {
    const ref = line.split(/\s+/)[1];

    if (ref) {
      addTag(ref.replace('refs/tags/', ''));
    }
  }

  return tags;
}

function getNextVersion(currentVersion, tags) {
  let nextVersion = currentVersion;

  for (const tag of tags) {
    const tagVersion = parseVersion(tag);

    if (tagVersion && compareVersions(tagVersion, nextVersion) >= 0) {
      nextVersion = incrementPatch(tagVersion);
    }
  }

  while (tags.has(`v${formatVersion(nextVersion)}`)) {
    nextVersion = incrementPatch(nextVersion);
  }

  return nextVersion;
}

const packageJson = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
const currentVersion = parseVersion(packageJson.version);

if (!currentVersion) {
  throw new Error(`Invalid package.json version: ${packageJson.version}`);
}

const tags = getKnownTags();
const nextVersion = formatVersion(getNextVersion(currentVersion, tags));
const nextTag = `v${nextVersion}`;

console.log(`Preparing ${nextTag}`);

if (packageJson.version !== nextVersion) {
  packageJson.version = nextVersion;
  writeFileSync(
    resolve(rootDir, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}

run('git', ['add', 'package.json', 'pnpm-lock.yaml', '.github/workflows/release.yml', 'scripts/release.mjs'], {
  stdio: 'inherit',
});

const hasStagedChanges = tryRun('git', ['diff', '--cached', '--name-only']);

if (!hasStagedChanges) {
  throw new Error('No release changes were staged.');
}

run('git', ['commit', '-m', `chore: prepare release ${nextTag}`], { stdio: 'inherit' });
run('git', ['tag', nextTag], { stdio: 'inherit' });
run('git', ['push', 'origin', 'HEAD'], { stdio: 'inherit' });
run('git', ['push', 'origin', nextTag], { stdio: 'inherit' });
console.log(`Published ${nextTag}`);
