#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Usage: node scripts/validate-finetune-jsonl.mjs <path/to/file.jsonl>');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

const text = fs.readFileSync(resolvedPath, 'utf8');
const lines = text.split(/\r?\n/).filter(Boolean);

if (lines.length === 0) {
  console.error('Input file is empty.');
  process.exit(1);
}

let hasError = false;

function fail(lineIndex, message) {
  hasError = true;
  console.error(`Line ${lineIndex + 1}: ${message}`);
}

lines.forEach((line, lineIndex) => {
  let record;

  try {
    record = JSON.parse(line);
  } catch {
    fail(lineIndex, 'Invalid JSON.');
    return;
  }

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    fail(lineIndex, 'Top-level value must be an object.');
    return;
  }

  if (!Array.isArray(record.messages) || record.messages.length < 2) {
    fail(lineIndex, '`messages` must be an array with at least 2 items.');
    return;
  }

  let hasUser = false;
  let hasAssistant = false;

  record.messages.forEach((msg, msgIndex) => {
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
      fail(lineIndex, `messages[${msgIndex}] must be an object.`);
      return;
    }

    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      fail(lineIndex, `messages[${msgIndex}].role must be one of system|user|assistant.`);
    }

    if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
      fail(lineIndex, `messages[${msgIndex}].content must be a non-empty string.`);
    }

    if (msg.role === 'user') hasUser = true;
    if (msg.role === 'assistant') hasAssistant = true;
  });

  if (!hasUser || !hasAssistant) {
    fail(lineIndex, 'Each example must include at least one user and one assistant message.');
  }
});

if (hasError) {
  process.exit(1);
}

console.log(`OK: ${lines.length} JSONL example(s) validated in ${inputPath}`);
