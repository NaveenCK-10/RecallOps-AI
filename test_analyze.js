async function testAnalyze() {
  try {
    const res = await fetch('https://recallops-ai-production.up.railway.app/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: 'oom heap crash' })
    });
    console.log(res.status, await res.text());
  } catch (err) {
    console.error(err);
  }
}
testAnalyze();
