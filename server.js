import express from 'express';
import Redis from 'ioredis';

const app = express();

// Configura o Redis com tratamento de erro para não derrubar o app
const redis = new Redis({
    retryStrategy: times => Math.min(times * 50, 2000), // Tenta reconectar devagar
    maxRetriesPerRequest: null
});

redis.on('error', (err) => {
    // Apenas avisa no console em vez de travar tudo
    if (err.code === 'ECONNREFUSED') {
        console.log('[Aviso] Redis não encontrado. O servidor continuará rodando, mas não salvará dados.');
    } else {
        console.error('[Redis Erro]', err);
    }
});

app.use(express.json());

app.post('/webhook/connection', async (req, res) => {
    try {
        const { instance, status, updatedAt } = req.body;

        if (!instance) return res.status(400).json({ error: 'Instance não informada' });

        const chave = `conexao:${instance}`;
        const dados = JSON.stringify({ status, updatedAt });

        // Tenta salvar somente se o Redis estiver conectado
        if (redis.status === 'ready') {
            await redis.set(chave, dados);
            console.log(`[Redis] Salvo: ${chave} -> ${status}`);
        } else {
            console.log(`[Simulação] Recebido (Redis offline): ${instance} -> ${status}`);
        }

        return res.status(200).send('Recebido');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Erro interno');
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});