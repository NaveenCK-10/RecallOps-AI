async function test() {
  try {
    const health = await fetch('https://recallops-ai-production.up.railway.app/api/health');
    console.log('Health:', await health.json());
    
    const analyze = await fetch('https://recallops-ai-production.up.railway.app/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: 'test log' })
    });
    console.log('Analyze Status:', analyze.status);
    console.log('Analyze Response:', await analyze.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
