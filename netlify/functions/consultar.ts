import https from 'https';
import * as cheerio from 'cheerio';

export const handler = async (event: any, context: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { cpf } = JSON.parse(event.body || '{}');

    if (!cpf) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "CPF é obrigatório" })
      };
    }

    const data = new URLSearchParams({
      cpf: cpf.replace(/\D/g, '')
    }).toString();

    const options = {
      hostname: 'gasdopovo.mds.gov.br',
      port: 443,
      path: '/consultar',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gasdopovo.mds.gov.br/',
        'Origin': 'https://gasdopovo.mds.gov.br'
      }
    };

    const responseData = await new Promise<string>((resolve, reject) => {
      const reqMds = https.request(options, (resMds) => {
        let body = '';
        resMds.on('data', (chunk) => { body += chunk; });
        resMds.on('end', () => resolve(body));
      });
      reqMds.on('error', reject);
      reqMds.write(data);
      reqMds.end();
    });

    const $ = cheerio.load(responseData);
    
    // Check for errors
    const dangerMessage = $('.br-message.danger').text().trim();
    if (dangerMessage && dangerMessage.includes('CPF não encontrado')) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'not_found', message: 'CPF não encontrado na base de dados do Gás do Povo.' }) };
    }
    
    if (dangerMessage && dangerMessage.includes('inválido')) {
       return { statusCode: 200, headers, body: JSON.stringify({ status: 'invalid', message: 'CPF inválido.' }) };
    }

    if (dangerMessage) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', message: dangerMessage.replace(/\s+/g, ' ') }) };
    }

    // Check for success data
    const beneficios: any[] = [];
    $('.beneficio-card').each((i, el) => {
      const title = $(el).find('.beneficio-header h3').text().trim();
      const isExpired = $(el).find('.badge-expirado').length > 0;
      const origin = $(el).find('.beneficio-origem').text().trim();
      
      const details: Record<string, string> = {};
      $(el).find('.dado-item').each((j, item) => {
        const label = $(item).find('.dado-label').text().trim().replace(':', '');
        const value = $(item).find('.dado-valor').text().trim();
        if (label && value) {
          details[label] = value;
        }
      });

      beneficios.push({
        title,
        isExpired,
        origin,
        details
      });
    });

    if (beneficios.length === 0) {
       const successMessage = $('.br-message.success').text().trim();
       if (successMessage) {
          return { statusCode: 200, headers, body: JSON.stringify({ status: 'success', message: successMessage.replace(/\s+/g, ' '), beneficios: [] }) };
       }
       
       const details: Record<string, string> = {};
       $('.dado-item').each((j, item) => {
          const label = $(item).find('.dado-label').text().trim().replace(':', '');
          const value = $(item).find('.dado-valor').text().trim();
          if (label && value) {
            details[label] = value;
          }
       });
       
       if (Object.keys(details).length > 0) {
           return { statusCode: 200, headers, body: JSON.stringify({ status: 'success', beneficios: [{ details }] }) };
       }

       return { statusCode: 200, headers, body: JSON.stringify({ status: 'unknown', message: 'Não foi possível interpretar a resposta do servidor.', html: responseData }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ status: 'success', beneficios }) };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erro ao conectar com o servidor do Gás do Povo" })
    };
  }
};
