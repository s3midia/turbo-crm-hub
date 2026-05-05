const https = require('https');

const data = JSON.stringify({
  cpfCnpj: '05168951503'
});

const options = {
  hostname: 'api.asaas.com',
  port: 443,
  path: '/v3/customers/cus_000065326955', // An existing customer from the earlier curl
  method: 'POST',
  headers: {
    'access_token': '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjEzMDUxMDZjLTViZGUtNDk3Yi1hYTU1LWY2Yzk0Y2U3NTNiMDo6JGFhY2hfYjA3ZDE2N2QtYjVkYS00YjFmLThkZGYtZTFhMWRlMjE1NDdk',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => { console.log(res.statusCode, body); });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
