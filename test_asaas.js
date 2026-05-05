const fetch = require('node-fetch');

async function testKey(key) {
    console.log('Testando chave:', key.substring(0, 15) + '...');
    const res = await fetch('https://api.asaas.com/v3/customers?limit=1', {
        headers: {
            'access_token': key
        }
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Resposta:', data);
}

const key1 = "aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjEzMDUxMDZjLTViZGUtNDk3Yi1hYTU1LWY2Yzk0Y2U3NTNiMDo6JGFhY2hfYjA3ZDE2N2QtYjVkYS00YjFmLThkZGYtZTFhMWRlMjE1NDdk";
const key2 = "$" + key1;

async function run() {
    await testKey(key1);
    console.log('---');
    await testKey(key2);
}

run();
