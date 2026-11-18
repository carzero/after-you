export async function api(path, input) {
  const response = await fetch(`/api/${path}`, {method: input ? 'POST' : 'GET', headers: input ? {'Content-Type':'application/json'} : {}, body: input ? JSON.stringify(input) : undefined, signal: AbortSignal.timeout(8000)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '온라인 서버에 연결할 수 없습니다.');
  return data;
}
