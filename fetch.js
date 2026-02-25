import https from 'https';

const data = new URLSearchParams({
  cpf: '12345678909' // invalid cpf, but let's see if it rejects or what
}).toString();

const options = {
  hostname: 'gasdopovo.mds.gov.br',
  port: 443,
  path: '/consultar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', responseData);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
