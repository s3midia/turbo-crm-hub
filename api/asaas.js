import express from 'express';

const app = express();
app.use(express.json());

// Proxy para a API do Asaas
// Isso evita erros de CORS e protege a API KEY no servidor (Vercel)
app.post('/api/asaas', async (req, res) => {
    try {
        const { action, payload } = req.body;
        
        // A API Key deve estar configurada nas variáveis de ambiente do Vercel
        // Usamos VITE_ASAAS_API_KEY para consistência com o .env local
        const ASAAS_API_KEY = process.env.VITE_ASAAS_API_KEY;
        const IS_PRODUCTION = process.env.VITE_ASAAS_PRODUCTION === 'true';

        if (!ASAAS_API_KEY) {
            console.error('[Asaas Proxy] Erro: VITE_ASAAS_API_KEY não configurada no Vercel.');
            return res.status(500).json({ error: 'Configuração de API Asaas ausente no servidor.' });
        }

        const BASE_URL = IS_PRODUCTION 
            ? 'https://api.asaas.com/v3' 
            : 'https://api-sandbox.asaas.com/v3';

        const headers = {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
            'User-Agent': 'TurboCRM-Vercel-Proxy'
        };

        if (action === 'find_or_create_customer') {
            const { name, email, phone } = payload;

            // 1. Buscar cliente pelo e-mail
            const searchRes = await fetch(`${BASE_URL}/customers?email=${encodeURIComponent(email)}`, { headers });
            const searchData = await searchRes.json();
            
            if (searchData.data && searchData.data.length > 0) {
                return res.status(200).json({ customerId: searchData.data[0].id });
            } else {
                // 2. Criar cliente se não existir
                const createRes = await fetch(`${BASE_URL}/customers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        notificationDisabled: false
                    })
                });
                
                const customer = await createRes.json();
                if (!createRes.ok) throw new Error(customer.errors?.[0]?.description || 'Erro ao criar cliente');
                
                return res.status(200).json({ customerId: customer.id });
            }
        } 
        
        else if (action === 'create_boleto') {
            const { customerId, value, dueDate, description } = payload;

            // Formatar data DD/MM/YYYY → YYYY-MM-DD
            let formattedDate = dueDate;
            if (dueDate.includes('/')) {
                const [day, month, year] = dueDate.split('/');
                formattedDate = `${year}-${month}-${day}`;
            }

            const paymentRes = await fetch(`${BASE_URL}/payments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'BOLETO',
                    value: parseFloat(value),
                    dueDate: formattedDate,
                    description
                })
            });

            const payment = await paymentRes.json();
            if (!paymentRes.ok) throw new Error(payment.errors?.[0]?.description || 'Erro ao criar boleto');

            // Retornar os dados necessários para o frontend
            return res.status(200).json({
                id: payment.id,
                invoiceUrl: payment.invoiceUrl,
                bankSlipUrl: payment.bankSlipUrl,
                identificationField: payment.identificationField,
                status: payment.status
            });
        } 
        
        else {
            return res.status(400).json({ error: `Ação inválida: ${action}` });
        }

    } catch (error) {
        console.error(`[Asaas Proxy Error]: ${error.message}`);
        return res.status(500).json({ error: error.message || 'Erro interno no proxy do Asaas' });
    }
});

export default app;
