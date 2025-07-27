# MCP Aggregator Server (Express + Pinecone)

Questo progetto è un server che indicizza tool da manifest MCP e permette di cercarli tramite embedding.

---

## 🚀 Come avviare il progetto

1. Installa le dipendenze:

```bash
npm install
```

2. Crea un file `.env` nella root:

```env
PORT=3000
MCP_SERVERS=http://localhost:3000/mock-mcps/mcp1,http://localhost:3000/mock-mcps/mcp2

PINECONE_API_KEY=la-tua-api-key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=mcp-tools
```

3. Avvia il server:

```bash
node aggregatorServer.js
```

---

## 🧪 Uso dei mock

Il progetto include due server MCP simulati (`mock-mcps/mcp1` e `mock-mcps/mcp2`) con manifest `.well-known/ai-plugin.json`.

Questi file vengono serviti localmente da Express, quindi non è necessario avere server esterni attivi.

Quando avvii il server, verranno letti i due manifest e i tool contenuti verranno indicizzati automaticamente.

Mock disponibili:

- `mcp1`: tool `joke_generator`
- `mcp2`: tool `quote_finder`

Puoi testare la ricerca con:

```
GET http://localhost:3000/tools/mcp_aggregator?search=programming
```

Puoi resettare indice con:

```
GET http://localhost:3000/tools/reset_index
```


---

## ✅ Requisiti

- Node.js ≥ 18
- Pinecone account con chiave API
