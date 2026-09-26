# KokoroNexus — Foro (Cloudflare D1)

API: https://kokoronexus-api.study-of-creativity.workers.dev

## Uso
1. Abre index.html o súbelo a GitHub Pages.
2. Escribe tu nick → Guardar.
3. Crea hilos y responde.
4. Solo el navegador que creó un mensaje puede editarlo/borrarlo.

## Tabla D1 (si falta)
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

## Archivos
- index.html (~3 KB)
- styles.css (~5 KB)
- script.js (~9 KB)
