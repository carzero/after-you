import catalog from './integration-catalog.json';
export const audioTracks=catalog.audio;
const files=import.meta.glob('../assets/runtime/integration-20261126/audio/*.mp3',{eager:true,query:'?url',import:'default'});
export const audioUrls=Object.fromEntries(audioTracks.map(e=>[e.id,files[`../assets/runtime/integration-20261126/audio/${e.id}.mp3`]]));
