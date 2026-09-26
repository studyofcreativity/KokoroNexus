# KokoroNexus — Cloudflare D1

API: https://kokoronexus-api.study-of-creativity.workers.dev

## Limpieza automática
- Máximo **500 hilos**.
- A partir de **450** muestra aviso en la web.
- Al crear un hilo nuevo si ya hay 500, se borran los **más antiguos** automáticamente.

Para cambiar el límite, edita en el Worker:
```
const MAX_THREADS = 500;
const WARN_THREADS = 450;
```

## Actualizar el Worker
1. Edit code → pega el contenido de worker.js
2. Deploy

## Tabla D1
```sql
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  replies TEXT NOT NULL DEFAULT '[]'
);
```
