# OpenAI readiness checklist

Use this checklist before enabling cloud AI in production.

## 1) Security and secrets

- [ ] `OPENAI_API_KEY` is configured via environment variables, never hardcoded.
- [ ] API keys are rotated and scoped by environment (dev/staging/prod).
- [ ] Logging is reviewed to avoid leaking prompts, keys, or sensitive user data.

## 2) Data quality for fine-tuning

- [ ] Training data is in JSONL format and validated locally.
- [ ] Examples are consistent in tone, policy, and answer style.
- [ ] Personal data (PII) and confidential content are removed or anonymized.
- [ ] Validation split is created separately from training examples.

## 3) Runtime behavior

- [ ] Timeout and retry strategy are defined for OpenAI calls.
- [ ] Fallback behavior exists when cloud AI is unavailable.
- [ ] Model name is configurable (`OPENAI_MODEL`) without code changes.

## 4) Product and policy alignment

- [ ] Safety rules are documented for prohibited content and risky advice.
- [ ] Responses include practical, non-deceptive guidance for renters.
- [ ] Escalation path exists for legal/financial/high-risk questions.

## 5) Monitoring and operations

- [ ] Track AI request count, latency, and error rates.
- [ ] Track token usage and budget thresholds.
- [ ] Keep sample transcripts for periodic quality review.

## Quick commands

```bash
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/train.example.jsonl
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/validation.example.jsonl
```
