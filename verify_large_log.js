const fs = require('fs');

async function testLargeLog() {
  // Generate a ~2.3 MB log file
  let logContent = 'Starting application...\n';
  const normalLine = '2024-03-15T14:23:45.123Z INFO [app] Processing incoming web request for user /api/data... everything is going well so far.\n';
  
  // 1 line = ~115 bytes. 20,000 lines = ~2.3 MB
  for (let i = 0; i < 20000; i++) {
    logContent += normalLine;
  }
  
  // Insert an error somewhere in the middle
  logContent += '2024-03-15T14:24:00.000Z ERROR [db-pool] Connection timeout reached.\n';
  logContent += '  at Pool.connect (/app/node_modules/pg-pool/index.js:45:11)\n';
  logContent += '  at async OrderService.getOrders (/app/services/order.js:127:20)\n';
  
  // Add some more normal lines
  for (let i = 0; i < 500; i++) {
    logContent += normalLine;
  }
  
  console.log(`Log size: ${(logContent.length / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    const res = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: logContent })
    });
    
    if (!res.ok) {
      console.error('Request failed with status:', res.status);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const data = await res.json();
    console.log('Success:', data.success);
    console.log('Title:', data.data.title);
    console.log('Root Cause:', data.data.rootCause);
  } catch (err) {
    console.error('Error during request:', err);
  }
}

testLargeLog();
