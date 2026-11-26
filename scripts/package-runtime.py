"""Package runnable source without optional original PNGs, private data or old downloads."""
from pathlib import Path
import zipfile,hashlib,json
root=Path(__file__).resolve().parent.parent
out=root/'downloads';version='v0.9.1';prefix='AFTER_YOU_Source_'+version
files=[root/n for n in ['.gitignore','.node-version','README.md','START_HERE_KO.md','index.html','package.json','package-lock.json','vite.config.js','playwright.config.js','playwright.online.config.js','playwright.cloudflare.config.js','wrangler.jsonc']]
for folder in ['src','server','cloudflare','deploy/windows','scripts','tests','docs','tools/idle-review','assets/runtime/art-20261121','assets/runtime/idle-20261124','assets/runtime/poses-20261124','assets/runtime/integration-20261126','dist']:
 files.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
source=root/'assets/source/art-20261121'
files.extend(p for p in source.rglob('*') if p.is_file() and p.suffix.lower() in {'.md','.json','.html','.svg','.css','.txt'})
files=sorted(set(files));dest=out/f'{prefix}.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:
  assert not p.is_symlink(),p
  z.write(p,prefix+'/'+p.relative_to(root).as_posix())
 z.write(out/f'AFTER_YOU_Playtest_{version}.html',prefix+'/playtest/'+f'AFTER_YOU_Playtest_{version}.html')
 z.writestr(prefix+'/SOURCE_SHA256.json',json.dumps({p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2)+'\n')
assert dest.stat().st_size<32*1024*1024
with zipfile.ZipFile(dest) as z:assert z.testzip() is None
print(f'{dest}: {dest.stat().st_size:,} bytes; CRC OK')
