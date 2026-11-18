"""Package source/runtime and three optional raw-art archives; excludes private runtime data."""
import pathlib, zipfile, hashlib, json
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path('/workspace/shared/downloads'); out.mkdir(parents=True, exist_ok=True)
prefix = 'AFTER_YOU_Source_v0.5'
files = [root / n for n in ['.gitignore','README.md','START_HERE_KO.md','index.html','package.json','package-lock.json','vite.config.js','playwright.config.js','playwright.online.config.js']]
for folder in ['src','server','scripts','tests','docs','assets/runtime/art-v03','dist']:
    files.extend(p for p in (root / folder).rglob('*') if p.is_file())
source = root / 'assets/source/art-v03'
files.extend(p for p in source.iterdir() if p.is_file())
manifest = json.loads((source/'ASSET_MANIFEST.json').read_text())
for entry in manifest:
    assert hashlib.sha256((source/entry['file']).read_bytes()).hexdigest() == entry['sha256'], entry['file']
main = out / 'AFTER_YOU_Source_v0.5_2026-11-18.zip'
with zipfile.ZipFile(main,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(set(files)):
        assert not p.is_symlink(), str(p)
        z.write(p, prefix + '/' + p.relative_to(root).as_posix())
    z.write(out/'AFTER_YOU_Playtest_v0.5.html',prefix+'/playtest/AFTER_YOU_Playtest_v0.5.html')
    hashes={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))}
    z.writestr(prefix+'/SOURCE_SHA256.json',json.dumps(hashes,indent=2,ensure_ascii=False)+'\n')
archives=[main]
for index, categories in [(1,{'potato','pigeon'}),(2,{'duck','rabbit'}),(3,{'environment','rescue','concept','vfx'})]:
    name=out/f'AFTER_YOU_Original_Art_{index}_v0.3.zip'
    with zipfile.ZipFile(name,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for entry in manifest:
            p=source/entry['file']
            if any(part in categories for part in p.relative_to(source/'assets').parts[:-1]):
                z.write(p,prefix+'/'+p.relative_to(root).as_posix())
    archives.append(name)
for archive in archives:
    with zipfile.ZipFile(archive) as z: assert z.testzip() is None
    assert archive.stat().st_size < 32*1024*1024, str(archive)
    print(f'{archive.name}: {archive.stat().st_size:,} bytes; CRC OK')
