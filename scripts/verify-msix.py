"""Independent MSIX CRC, block-hash, manifest and Windows binary verification."""
import sys,zipfile,hashlib,base64,xml.etree.ElementTree as ET,json,struct
from pathlib import Path
p=Path(sys.argv[1]);identity=json.loads(Path('deploy/microsoft-store/identity.json').read_text())
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None
 manifest=ET.fromstring(z.read('AppxManifest.xml'));ns={'p':'http://schemas.microsoft.com/appx/manifest/foundation/windows10'}
 i=manifest.find('p:Identity',ns)
 for k,v in {'Name':identity['name'],'Publisher':identity['publisher'],'Version':identity['packageVersion'],'ProcessorArchitecture':'x64'}.items():assert i.get(k)==v,(k,i.get(k),v)
 bits=''.join(f'{b:08b}' for b in hashlib.sha256(identity['publisher'].encode('utf-16le')).digest()[:8])+'0'
 alphabet='0123456789abcdefghjkmnpqrstvwxyz'
 publisher_id=''.join(alphabet[int(bits[n:n+5],2)] for n in range(0,65,5))
 assert identity['name']+'_'+publisher_id=='Carzero.44873CDC3E8F_28zrs787qra7r'
 assert manifest.find('p:Properties/p:DisplayName',ns).text==identity['displayName']=='먼저 가세요'
 app=manifest.find('p:Applications/p:Application',ns)
 visual=app.find('{http://schemas.microsoft.com/appx/manifest/uap/windows10}VisualElements')
 assert visual.get('DisplayName')==identity['displayName']
 exe=app.get('Executable').replace('\\','/');data=z.read(exe)
 assert data[:2]==b'MZ';pe=struct.unpack_from('<I',data,0x3c)[0];assert data[pe:pe+4]==b'PE\0\0';assert struct.unpack_from('<H',data,pe+4)[0]==0x8664
 bm=ET.fromstring(z.read('AppxBlockMap.xml'));count=0
 for file in bm:
  content=z.read(file.get('Name').replace('\\','/'));assert len(content)==int(file.get('Size'))
  for n,block in enumerate(file):assert hashlib.sha256(content[n*65536:(n+1)*65536]).digest()==base64.b64decode(block.get('Hash'))
  count+=1
 assert 'App/Web/index.html' in z.namelist()
 assert b'content="0.10.1"' in z.read('App/Web/index.html')
 assert z.read('App/identity.json')==Path('deploy/microsoft-store/identity.json').read_bytes()
 print(json.dumps({'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'verified_files':count,'package':i.attrib,'family':identity['name']+'_'+publisher_id,'signed':'AppxSignature.p7x' in z.namelist()},ensure_ascii=False,indent=2))
