import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import ToolVectorDB from './vectorStore.js';

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;


const MCP_SERVERS = (process.env.MCP_SERVERS || '').split(',');
const vectorDB = new ToolVectorDB();


// ✅ Serve le cartelle mock
app.use('/mock-mcps', express.static('mock-mcps'));



app.get('/tools/mcp_aggregator', async (req, res) => {
    const search = req.query.search || '';
    const results = await vectorDB.searchTools(search);
    const output = [];

    for (const tool of results) {
        try {
            const response = await axios.get(tool.endpoint, {
                params: { query: search },
            });
            output.push({
                name: tool.name,
                description: tool.description,
                endpoint: tool.endpoint,
                response: response.data,
            });
        } catch (err) {
            output.push({
                name: tool.name,
                description: tool.description,
                endpoint: tool.endpoint,
                response: `Failed to call: ${err.message}`,
            });
        }
    }

    res.json({ matches: output });
});

app.get('/tools/reset_index', async (req, res) => {
    const results = await vectorDB.resetIndex();
    res.json({ result: true, message: 'Index reset successfully', details: results });
});

app.listen(port, async () => {
    // Attendi l'inizializzazione PRIMA di usarlo
    await vectorDB.init();

    for (const serverUrl of MCP_SERVERS) {
        try {
            // in un caso reale l'url sarebbe: `${serverUrl}/.well-known/ai-plugin.json`
            const res = await axios.get(`${serverUrl}/well-known/ai-plugin.json`);
            const tools = res.data?.tools || [];
            for (const tool of tools) {
                await vectorDB.addTool(tool.name, tool.description, `${serverUrl}/tools/${tool.name}`);
            }
        } catch (err) {
            console.error(`[!] Failed to connect to ${serverUrl}: ${err.message}`);
        }
    }

    console.log(`Aggregator server listening on port ${port}`);
});
