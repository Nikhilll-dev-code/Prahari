const http = require('http');
const config = require('./config');

async function classifyText(text, installation = null, reportType = null) {
  const url = `${config.ML_SERVICE_URL}/classify`;
  const body = JSON.stringify({
    text,
    installation,
    report_type: reportType
  });

  return new Promise((resolve) => {
    // 4.5s timeout to adhere to PERF-1 target (<= 5s)
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 4500
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve({ success: true, data: parsed });
            } catch (err) {
              resolve({ success: false, error: 'Malformed ML response' });
            }
          } else {
            resolve({ success: false, error: `ML Service returned status ${res.statusCode}` });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      console.warn('ML Service classification timed out (> 4.5s)');
      resolve({ success: false, error: 'ML Service timeout (> 4.5s)' });
    });

    req.on('error', (err) => {
      console.warn('ML Service connection error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(body);
    req.end();
  });
}

async function classifyBatch(items) {
  const url = `${config.ML_SERVICE_URL}/classify/batch`;
  const body = JSON.stringify({
    items: items.map(item => ({
      text: item.description,
      installation: item.installation,
      report_type: item.report_type
    }))
  });

  return new Promise((resolve) => {
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 20000
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve({ success: true, results: parsed.results });
            } catch (err) {
              resolve({ success: false, error: 'Malformed ML response' });
            }
          } else {
            resolve({ success: false, error: `ML Service returned ${res.statusCode}` });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'ML Service batch timeout' });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(body);
    req.end();
  });
}

module.exports = {
  classifyText,
  classifyBatch
};
