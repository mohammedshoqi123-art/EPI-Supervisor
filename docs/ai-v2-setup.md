# 🤖 AI v2 Setup Guide — HuggingFace + MiMo Integration

## Architecture Overview

```
User Query
    ↓
┌──────────────────────────────────────┐
│         AI Router (Dart)             │
├──────────────────────────────────────┤
│                                      │
│  ┌─────────┐  ┌──────────┐  ┌─────┐ │
│  │ Intent  │  │   RAG    │  │ DB  │ │
│  │ Classif │  │ Search   │  │Query│ │
│  │(HFace)  │  │(Embedd.) │  │(Fn) │ │
│  └────┬────┘  └────┬─────┘  └──┬──┘ │
│       └────────────┼───────────┘    │
│                    ↓                │
│           ┌──────────────┐          │
│           │  MiMo LLM    │          │
│           │  (Response)   │          │
│           └──────────────┘          │
│                    ↓                │
│           ┌──────────────┐          │
│           │ Local Fallback│          │
│           │ (Offline AI)  │          │
│           └──────────────┘          │
└──────────────────────────────────────┘
```

## Models Used

| Model | Task | Source | Cost |
|-------|------|--------|------|
| `intfloat/multilingual-e5-large` | Embeddings (1024-dim) | HuggingFace | Free |
| `facebook/bart-large-mnli` | Intent Classification | HuggingFace | Free |
| `deepset/xlm-roberta-base-squad2` | Question Answering | HuggingFace | Free |
| `facebook/bart-large-cnn` | Summarization | HuggingFace | Free |
| `mimo-v2-pro` | Chat / Report Generation | MiMo API | Paid |

## Setup Steps

### 1. Get HuggingFace Token (Free)

1. Go to https://huggingface.co/settings/tokens
2. Create a new token with `Read` + `Inference` permissions
3. Copy the token (starts with `hf_`)

### 2. Add Secrets to Supabase

```bash
supabase secrets set HF_API_TOKEN=hf_your_token_here
```

### 3. Add Secrets to GitHub

Go to your repo → Settings → Secrets → Actions:
- Add `HF_API_TOKEN` with your HuggingFace token

### 4. Deploy Edge Functions

```bash
supabase functions deploy ai-chat-v2
```

### 5. Update Mobile App

The mobile app automatically detects the `HF_API_TOKEN` via `--dart-define`:

```bash
flutter run --dart-define=HF_API_TOKEN=hf_your_token_here
```

### 6. Test the System

```bash
# Test embeddings
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat-v2 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "كم إرسالية اليوم؟"}'
```

## Features

### Intent Classification (HuggingFace)
- Zero-shot classification using BART-MNLI
- Detects user intent from Arabic text
- Routes to appropriate handler

### Function Calling
- AI understands what data user wants
- Automatically queries Supabase
- Returns formatted results

### RAG (Retrieval-Augmented Generation)
- Semantic search in EPI knowledge base
- Relevant context injected into LLM
- Better, more accurate responses

### Enhanced Local AI (Offline)
- Rule-based analysis with confidence scores
- Statistical analysis (trend, anomaly detection)
- Works 100% offline

## Troubleshooting

### "Model not supported by provider"
Some models aren't available on the free Inference API. Use the models listed above.

### Rate Limiting (429)
Free tier: ~30 requests/minute. The system caches responses and implements backoff.

### Embeddings Timeout
First request to a model may take 20-30s (cold start). Subsequent requests are fast.
