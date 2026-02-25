import express from "express";
import { createServer as createViteServer } from "vite";
import https from "https";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/consultar", async (req, res) => {
    const { cpf } = req.body;

    if (!cpf) {
      return res.status(400).json({ error: "CPF é obrigatório" });
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

    const reqMds = https.request(options, (resMds) => {
      let responseData = '';
      resMds.on('data', (chunk) => {
        responseData += chunk;
      });
      resMds.on('end', () => {
        try {
          const $ = cheerio.load(responseData);
          
          // Check for errors
          const dangerMessage = $('.br-message.danger').text().trim();
          if (dangerMessage && dangerMessage.includes('CPF não encontrado')) {
            return res.json({ status: 'not_found', message: 'CPF não encontrado na base de dados do Gás do Povo.' });
          }
          
          if (dangerMessage && dangerMessage.includes('inválido')) {
             return res.json({ status: 'invalid', message: 'CPF inválido.' });
          }

          if (dangerMessage) {
            return res.json({ status: 'error', message: dangerMessage.replace(/\s+/g, ' ') });
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

          // If no specific cards found but there's a success message or other data
          if (beneficios.length === 0) {
             const successMessage = $('.br-message.success').text().trim();
             if (successMessage) {
                return res.json({ status: 'success', message: successMessage.replace(/\s+/g, ' '), beneficios: [] });
             }
             
             // Fallback: just extract all dado-items from the page
             const details: Record<string, string> = {};
             $('.dado-item').each((j, item) => {
                const label = $(item).find('.dado-label').text().trim().replace(':', '');
                const value = $(item).find('.dado-valor').text().trim();
                if (label && value) {
                  details[label] = value;
                }
             });
             
             if (Object.keys(details).length > 0) {
                 return res.json({ status: 'success', beneficios: [{ details }] });
             }

             return res.json({ status: 'unknown', message: 'Não foi possível interpretar a resposta do servidor.', html: responseData });
          }

          return res.json({ status: 'success', beneficios });
        } catch (e) {
          console.error(e);
          res.status(500).json({ error: "Erro ao processar a resposta" });
        }
      });
    });

    reqMds.on('error', (error) => {
      console.error(error);
      res.status(500).json({ error: "Erro ao conectar com o servidor do Gás do Povo" });
    });

    reqMds.write(data);
    reqMds.end();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
