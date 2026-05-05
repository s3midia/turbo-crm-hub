import express from 'express';

const app = express();
app.use(express.json());

// Proxy para a API do Asaas
// Isso evita erros de CORS e protege a API KEY no servidor (Vercel)
app.post('/api/asaas', async (req, res) => {
    try {
        const { action, payload } = req.body;
        
        // A API Key deve estar configurada nas variáveis de ambiente do Vercel
        // Limpamos possíveis espaços em branco ou aspas acidentais
        const ASAAS_API_KEY = process.env.VITE_ASAAS_API_KEY?.trim().replace(/^["']|["']$/g, '');
        const IS_PRODUCTION = String(process.env.VITE_ASAAS_PRODUCTION).trim() === 'true';

        if (!ASAAS_API_KEY) {
            console.error('[Asaas Proxy] Erro: VITE_ASAAS_API_KEY não encontrada no process.env');
            return res.status(500).json({ error: 'Configuração de API Asaas (VITE_ASAAS_API_KEY) ausente no servidor Vercel.' });
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
            const { name, email, phone, cpfCnpj } = payload;

            // 1. Buscar cliente pelo e-mail
            const searchRes = await fetch(`${BASE_URL}/customers?email=${encodeURIComponent(email)}`, { headers });
            const searchData = await searchRes.json();
            
            if (searchData.data && searchData.data.length > 0) {
                const existingCustomer = searchData.data[0];
                const customerId = existingCustomer.id;

                // Se encontramos o cliente mas recebemos um CPF/CNPJ da UI, vamos garantir que ele esteja atualizado
                if (cpfCnpj && existingCustomer.cpfCnpj !== cpfCnpj) {
                    const updateRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ cpfCnpj })
                    });
                    const updateData = await updateRes.json();
                    if (!updateRes.ok) {
                         throw new Error(updateData.errors?.[0]?.description || 'Erro ao atualizar CPF/CNPJ do cliente existente. O CPF pode ser inválido.');
                    }
                }

                return res.status(200).json({ customerId });
            } else {
                // 2. Criar cliente se não existir
                const createRes = await fetch(`${BASE_URL}/customers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        cpfCnpj: cpfCnpj || undefined, // Envia o CPF/CNPJ
                        notificationDisabled: false
                    })
                });
                
                const customer = await createRes.json();
                if (!createRes.ok) throw new Error(customer.errors?.[0]?.description || 'Erro ao criar cliente. Verifique se o CPF/CNPJ é válido.');
                
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
