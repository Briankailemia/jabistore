const http = require('http');

const testPlaceholder = (width, height) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3003/api/placeholder/${width}x${height}`, (res) => {
      console.log(`Testing ${width}x${height}: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });

    req.on('error', (error) => {
      console.error(`Error testing ${width}x${height}:`, error.message);
      resolve(false);
    });
  });
};

const runTests = async () => {
  const tests = [
    { width: 400, height: 300 },
    { width: 800, height: 600 },
    { width: 1200, height: 800 },
  ];

  for (const test of tests) {
    const success = await testPlaceholder(test.width, test.height);
    if (!success) {
      console.error(`❌ Test failed for ${test.width}x${test.height}`);
      process.exit(1);
    }
  }

  console.log('✅ All tests passed!');
};

runTests();
