"""Self-contained Windows deployment bundle, without credentials or optional raw art."""
from pathlib import Path
import json,hashlib,zipfile
root=Path(__file__).resolve().parent.parent
out=root/'downloads/AFTER_YOU_Cloudflare_CMD_v0.9.zip'
prefix='AFTER_YOU_Cloudflare_CMD_v0.9/'
files=[root/name for name in ['.gitignore','.node-version','README.md','START_HERE_KO.md','index.html','package.json','package-lock.json','vite.config.js','wrangler.jsonc','playwright.config.js','playwright.online.config.js','playwright.cloudflare.config.js']]
for folder in ['src','server','cloudflare','deploy/windows','scripts','tests','docs','tools/idle-review','assets/runtime','dist']:
 files.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc' and not p.is_symlink())
# Old runtime art is not imported by the current game, and original PNGs are optional.
files=[p for p in files if not any(part in {'art-v02','art-v03'} for part in p.parts)]
contents={p.relative_to(root).as_posix():p.read_bytes() for p in sorted(set(files))}
for name in ['DEPLOY.cmd','READ_ME_KO.txt']:
 contents[name]=(root/'deploy/windows'/name).read_text().replace('\r\n','\n').replace('\n','\r\n').encode('utf-8')
contents['SOURCE_SHA256.json']=(json.dumps({name:hashlib.sha256(data).hexdigest() for name,data in contents.items()},indent=2)+'\n').encode()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,data in contents.items():z.writestr(prefix+name,data)
assert out.stat().st_size<32*1024*1024
with zipfile.ZipFile(out) as z:assert z.testzip() is None
print(f'{out}: {out.stat().st_size:,} bytes; CRC OK; {len(contents)} files')
