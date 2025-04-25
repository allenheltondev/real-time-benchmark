async function run() {
  const times = [];
  for(let i = 0; i < 100; i++){
  const response = await fetch('<METRICS ENDPOINT>');
  const now = Date.now();
  const data = await response.json();
  const diff = Math.abs(now - data.wsClock);
  console.log(diff);
  times.push(diff);
  }

  // calculate average time
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average time: ${avg}`);
}

run();
