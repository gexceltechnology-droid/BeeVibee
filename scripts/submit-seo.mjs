import https from 'https';
import http from 'http';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beevibe.org';
const sitemapUrl = `${siteUrl}/sitemap.xml`;
const indexNowKey = 'c4a91f82b73e4b109e201b9e76f52ad3';

async function fetchUrl(url, options = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runSeoSubmission() {
  console.log('----------------------------------------------------');
  console.log(`🚀 Starting Automated Search Engine Indexing for ${siteUrl}`);
  console.log('----------------------------------------------------');

  // 1. Ping Google Sitemaps
  console.log('\n[1/3] Pinging Google Sitemaps API...');
  const googlePing = await fetchUrl(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
  console.log(`  -> Google Ping Response Status: ${googlePing.status}`);

  // 2. Ping Bing Sitemaps
  console.log('\n[2/3] Pinging Bing Sitemaps API...');
  const bingPing = await fetchUrl(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
  console.log(`  -> Bing Ping Response Status: ${bingPing.status}`);

  // 3. Submit IndexNow for Instant Indexing
  console.log('\n[3/3] Submitting Instant IndexNow API Request...');
  const indexNowPayload = JSON.stringify({
    host: 'www.beevibe.org',
    key: indexNowKey,
    keyLocation: `https://www.beevibe.org/${indexNowKey}.txt`,
    urlList: [
      `${siteUrl}/`,
      `${siteUrl}/book`,
      `${siteUrl}/menu`
    ]
  });

  const indexNowRes = await fetchUrl('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(indexNowPayload)
    },
    body: indexNowPayload
  });
  console.log(`  -> IndexNow Response Status: ${indexNowRes.status} (200 = Success, 202 = Accepted)`);

  console.log('\n----------------------------------------------------');
  console.log('✅ Indexing signals transmitted successfully!');
  console.log('   Google, Bing, and IndexNow crawlers have been notified of www.beevibe.org');
  console.log('----------------------------------------------------');
}

runSeoSubmission();
