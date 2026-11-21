"""Source/runtime handoff + independent <32MiB original-art ZIPs; never private run data."""
import pathlib, zipfile, hashlib, json, sys
root=pathlib.Path(__file__).resolve().parent.parent
out=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/shared/downloads');out.mkdir(parents=True,exist_ok=True)
prefix='AFTER_YOU_Source_v0.6'; source=root/'assets/source/art-20261121'
manifest=json.loads((source/'ASSET_MANIFEST.json').read_text())
for e in manifest:
    assert hashlib.sha256((source/e['file']).read_bytes()).hexdigest()==e['sha256'],e['file']
# Limit uncompressed chunk sizes so uploaded archives also stay below the attachment limit.
groups=[];group=[];size=0
for e in manifest:
    p=source/e['file'];n=p.stat().st_size
    if group and size+n>28*1024*1024:groups.append(group);group=[];size=0
    group.append(p);size+=n
groups.append(group);parts=[]
for i,group in enumerate(groups,1):
    dest=out/f'AFTER_YOU_Original_Art_{i}_20261121.zip'
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in group:z.write(p,prefix+'/'+p.relative_to(root).as_posix())
    with zipfile.ZipFile(dest) as z:assert z.testzip() is None
    assert dest.stat().st_size<32*1024*1024
    parts.append({'file':dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'png_files':[p.relative_to(source).as_posix() for p in group]})
    print(f'Original art {i}/{len(groups)}: {dest.stat().st_size:,} bytes; CRC OK',flush=True)
index=json.dumps({'version':'20261121','parts':parts},ensure_ascii=False,indent=2)+'\n'
(root/'downloads').mkdir(exist_ok=True)
(root/'downloads/ORIGINAL_ART_PARTS_20261121.json').write_text(index)
files=[root/n for n in ['.gitignore','README.md','START_HERE_KO.md','index.html','package.json','package-lock.json','vite.config.js','playwright.config.js','playwright.online.config.js']]
for folder in ['src','server','scripts','tests','docs','assets/runtime/art-20261121','dist']:
    files.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
files.extend(p for p in source.rglob('*') if p.is_file() and p.suffix.lower() in {'.md','.json','.html','.svg','.css','.txt'})
main=out/'AFTER_YOU_Source_v0.6_2026-11-21.zip'
with zipfile.ZipFile(main,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(set(files)):
        assert not p.is_symlink(),str(p)
        z.write(p,prefix+'/'+p.relative_to(root).as_posix())
    z.write(out/'AFTER_YOU_Playtest_v0.6.html',prefix+'/playtest/AFTER_YOU_Playtest_v0.6.html')
    z.writestr(prefix+'/ORIGINAL_ART_PARTS.json',index)
    hashes={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))}
    z.writestr(prefix+'/SOURCE_SHA256.json',json.dumps(hashes,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(main) as z:assert z.testzip() is None
assert main.stat().st_size<32*1024*1024
base='https://github.com/carzero/after-you/raw/refs/heads/handoff/v0.4/downloads/'
text='# 최신 다운로드 · 게임 v0.6 / 원화 통합 2026-11-21\n\n파일을 열어 **Download raw file**을 누르거나 직접 링크를 사용하세요.\n\n'
for label,name in [('최신 실행 소스 ZIP',main.name),('브라우저 연습 게임 HTML','AFTER_YOU_Playtest_v0.6.html'),('Node 온라인 서버 배포 ZIP','AFTER_YOU_Server_v0.6.zip')]:text+=f'- [{label}]({base}{name})\n'
text+='\n다음 에이전트에게는 소스 ZIP을 전달하고 START_HERE_KO.md부터 읽도록 하세요. 실행용 WebP 124개/SVG 24개·서버·테스트·빌드·연습 HTML을 포함합니다. 게임 규칙은 그대로이며 새 배경은 설정 → 배경 테마에서 볼 수 있습니다. 공개 온라인 호스팅 배포 완료를 뜻하지 않습니다.\n\n## 원본 아트\n\n원본 PNG 재가공 때만 아래 ZIP을 모두 받아 **같은 상위 폴더**에 풀면 소스 ZIP과 합쳐집니다. 각 32MiB 미만의 독립 ZIP이며 ZIP/Z01 병합은 필요 없습니다.\n\n'
for i,p in enumerate(parts,1):text+=f'- [원본 아트 {i}/{len(parts)} · {p["bytes"]/1048576:.1f}MiB]({p["file"]})\n'
text+='\n파일/해시 목록: ORIGINAL_ART_PARTS_20261121.json. 이전 버전 다운로드도 이 폴더에 보존합니다. 원화는 초안이며 실제 음원은 임시 합성음입니다. 개인 순위·자격증명·캐시는 포함하지 않습니다.\n'
(root/'downloads/README.md').write_text(text)
print(f'Source: {main.stat().st_size:,} bytes; CRC OK. Original PNGs: {len(manifest)} in {len(parts)} parts.',flush=True)
