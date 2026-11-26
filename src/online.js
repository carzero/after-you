export async function api(path, input) {
  const response = await fetch(`/api/${path}`, {method: input ? 'POST' : 'GET', headers: input ? {'Content-Type':'application/json'} : {}, body: input ? JSON.stringify(input) : undefined, signal: AbortSignal.timeout(8000)});
  const data = await response.json();
  if (!response.ok) throw new Error('온라인 도전을 이용할 수 없어요. 잠시 후 다시 시도해 주세요.');
  return data;
}
