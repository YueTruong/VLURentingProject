# Fine-tuning data scaffold

This folder provides starter JSONL files and a local validator for OpenAI fine-tuning prep.

## Files

- `train.example.jsonl`: small training set template.
- `validation.example.jsonl`: small validation set template.

## Validate JSONL format

From repository root:

```bash
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/train.example.jsonl
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/validation.example.jsonl
```

## Notes

- Keep one JSON object per line (JSONL).
- Each record should contain a `messages` array with at least one `user` and one `assistant` message.
- Avoid personal data and confidential details in training examples.
