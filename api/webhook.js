import express from 'express';
import Redis from 'ioredis';

const app = express();

// Configura o Redis com tratamento de erro para não derrubar o app
// Para Vercel, o ideal é usar uma URL de Redis externa (como Upstash)
const redis = new Redis(process.env.REDIS_URL || {
    retryStrategy: times => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null
});

redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.log('[Aviso] Redis não encontrado. O servidor continuará rodando, mas não salvará dados.');
    } else {
        console.error('[Redis Erro]', err);
    }
});

app.use(express.json());

app.post('/api/webhook', async (req, res) => {
    try {
        const webhookToken = process.env.WEBHOOK_SECRET || 'fallback-token-mudar-em-producao';
        const receivedToken = req.headers['x-webhook-token'];

        if (receivedToken !== webhookToken) {
            console.warn(`[Segurança] Tentativa de acesso não autorizado ao webhook de IP: ${req.ip}`);
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const { instance, status, updatedAt } = req.body;

        if (!instance || !status) {
            return res.status(400).json({ error: 'Dados incompletos (instance ou status ausentes)' });
        }

        const cleanInstance = String(instance).substring(0, 100);
        const cleanStatus = String(status).substring(0, 50);

        const chave = `conexao:${cleanInstance}`;
        const dados = JSON.stringify({ 
            status: cleanStatus, 
            updatedAt: updatedAt || new Date().toISOString() 
        });

        if (redis.status === 'ready') {
            await redis.set(chave, dados);
            console.log(`[Redis] Salvo: ${chave} -> ${cleanStatus}`);
        } else {
            console.log(`[Simulação] Recebido (Redis offline): ${cleanInstance} -> ${cleanStatus}`);
        }

        return res.status(200).send('Recebido');
    } catch (error) {
        console.error('[Erro Webhook]', error);
        return res.status(500).send('Erro interno');
    }
});

// Exporta para o Vercel
export default app;
