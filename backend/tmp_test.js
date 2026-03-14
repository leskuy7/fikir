async function test() {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mesajlar: [{ role: 'user', content: 'Yapay zeka asistanı' }],
      mod: 'fikir'
    })
  };
  console.log('Fetching...');
  const res = await fetch('https://fikir-production.up.railway.app/api/mesaj', params);
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

test();
