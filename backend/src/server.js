import http from 'node:http';

const port = Number(process.env.PORT || 8787);
const jupiterBaseUrl = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function validateQuoteParams(searchParams) {
  const inputMint = searchParams.get('inputMint');
  const outputMint = searchParams.get('outputMint');
  const amount = Number(searchParams.get('amount'));
  const slippageBps = Number(searchParams.get('slippageBps') || 50);
  const swapMode = searchParams.get('swapMode') || 'ExactIn';

  if (!inputMint || inputMint.length < 32) return 'inputMint is required';
  if (!outputMint || outputMint.length < 32) return 'outputMint is required';
  if (!Number.isInteger(amount) || amount <= 0) return 'amount must be a positive integer';
  if (!Number.isInteger(slippageBps) || slippageBps < 1 || slippageBps > 5000) {
    return 'slippageBps must be an integer between 1 and 5000';
  }
  if (swapMode !== 'ExactIn' && swapMode !== 'ExactOut') return 'swapMode must be ExactIn or ExactOut';

  return null;
}

function validateSwapPayload(body) {
  if (!body || typeof body !== 'object') return 'body must be a JSON object';
  if (!body.quoteResponse || typeof body.quoteResponse !== 'object') return 'quoteResponse is required';
  if (!body.userPublicKey || String(body.userPublicKey).length < 32) return 'userPublicKey is required';
  return null;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Missing request URL' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'bundlefi-jupiter-backend' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/jupiter/quote') {
    const error = validateQuoteParams(url.searchParams);
    if (error) {
      sendJson(res, 400, { error });
      return;
    }

    try {
      const response = await fetch(`${jupiterBaseUrl}/quote?${url.searchParams.toString()}`);
      const text = await response.text();
      if (!response.ok) {
        sendJson(res, response.status, { error: 'Jupiter quote request failed', details: text });
        return;
      }
      sendJson(res, 200, JSON.parse(text));
      return;
    } catch (fetchError) {
      sendJson(res, 500, {
        error: 'Failed to fetch quote from Jupiter',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
      return;
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/jupiter/swap') {
    try {
      const body = await parseBody(req);
      const error = validateSwapPayload(body);
      if (error) {
        sendJson(res, 400, { error });
        return;
      }

      const payload = {
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
        ...body
      };

      const response = await fetch(`${jupiterBaseUrl}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      if (!response.ok) {
        sendJson(res, response.status, { error: 'Jupiter swap request failed', details: text });
        return;
      }
      sendJson(res, 200, JSON.parse(text));
      return;
    } catch (requestError) {
      sendJson(res, 500, {
        error: 'Failed to create Jupiter swap transaction',
        details: requestError instanceof Error ? requestError.message : 'Unknown error'
      });
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`BundleFi backend listening on http://localhost:${port}`);
});
