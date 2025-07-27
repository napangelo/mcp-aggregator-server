import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import crypto from 'crypto';
dotenv.config();

class ToolVectorDB {
    constructor() {
        this.indexName = process.env.PINECONE_INDEX_NAME || 'mcp-tools';
        this.client = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            //environment: process.env.PINECONE_ENVIRONMENT,
        });

        this.index = this.client.Index(this.indexName);
        this.embedder = null;

        this.init();
    }

    async init() {
        const rawIndexes = await this.client.listIndexes();
        const indexes = Array.isArray(rawIndexes) ? rawIndexes : rawIndexes.indexes || [];
        const found = indexes.find(i => i.name === this.indexName);

        if (!found) {
            console.log(`[Pinecone] Index "${this.indexName}" not found. Creating...`);
            await this.client.createIndex({
                name: this.indexName,
                dimension: 384,
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`[Pinecone] Index "${this.indexName}" created.`);
        } else {
            console.log(`[Pinecone] Index "${this.indexName}" already exists`);
        }

        this.index = this.client.Index(this.indexName);
        //await this.index.deleteAll();
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    }


    async encode(text) {
        const result = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }

    async addTool(name, description, endpoint) {
        const vector = await this.encode(description);

        const deterministicId = this._generateIdFrom(endpoint);
        await this.index.upsert([
            {
                id: deterministicId,
                values: vector,
                metadata: { name, description, endpoint },
            },
        ]);
    }

    _generateIdFrom(value) {
        return crypto.createHash('sha1').update(value).digest('hex');
    }


    async searchTools(query, topK = 3) {
        const vector = await this.encode(query);
        const result = await this.index.query({
            vector,
            topK,
            includeMetadata: true,
        });

        return result.matches.map((m) => m.metadata);
    }
}

export default ToolVectorDB;
