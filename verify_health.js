const fs = require('fs');

async function testLog(name, logContent) {
  console.log(`\n--- Testing ${name} ---`);
  try {
    const res = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: logContent })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Request failed:', data);
      return;
    }
    console.log(`Status: ${res.status}`);
    console.log(`Title: ${data.data.title}`);
    console.log(`Severity: ${data.data.severity}`);
    console.log(`Root Cause: ${data.data.rootCause.substring(0, 50)}...`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function runTests() {
  const cleanLog = '2024-03-15T14:23:45.123Z INFO [app] Server started on port 3000\n2024-03-15T14:23:46.123Z INFO [app] All systems nominal.\n';
  
  const warnLog = '2024-03-15T14:23:45.123Z INFO [app] Server started\n2024-03-15T14:23:46.123Z WARNING [auth] Deprecated token format used by client 12.0.0.1.\n';
  
  const errorLog = '2024-03-15T14:23:45.123Z INFO [app] Server started\n2024-03-15T14:23:46.123Z ERROR [db] Failed to insert record.\n';
  
  const stackLog = '2024-03-15T14:23:45.123Z INFO [app] Request received\n  at Controller.handle (/app/src/index.js:45)\n  at async handleRequest (/app/src/server.js:10)\n';

  await testLog('Clean Log', cleanLog);
  await testLog('WARN Log', warnLog);
  await testLog('ERROR Log', errorLog);
  await testLog('Stack Trace Log', stackLog);
}

runTests();
