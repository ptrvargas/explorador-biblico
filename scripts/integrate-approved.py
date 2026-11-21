from pathlib import Path
import json, hashlib, collections, sys
src = Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'approved-sources'
dst = Path('dist/banks')
dst.mkdir(exist_ok=True)
types = {'PREGUNTA':'pregunta','CITA':'cita','COMPLETAR':'completar','EMOJI':'emoji','ORDEN':'orden','QUESTION':'pregunta','REFERENCE':'cita','COMPLETE':'completar','ORDER':'orden'}
receipts = {}
for lang, file in [('es','Banco_Maestro_ES_V2.0.txt'), ('en','Master_Challenge_Bank_EN_V2.0.txt')]:
    raw = (src/file).read_bytes()
    cards = []
    for line in raw.decode('utf-8-sig').splitlines():
        if not line.startswith('BIB-'): continue
        parts = [p.strip() for p in line.split('|')]
        assert len(parts) == 11, (file, line)
        id, points, type, question, a, b, c, d, answer, reference, explanation = parts
        cards.append(dict(id=id, points=int(points), type=types[type], question=question, options=[a,b,c,d], correctAnswer=answer, reference=reference, explanation=explanation, status='available'))
    assert len(cards) == 100
    assert collections.Counter(c['points'] for c in cards) == {100:30,200:28,300:24,500:18}
    assert all(c['correctAnswer'] in c['options'] for c in cards)
    (dst/('master-'+lang+'.json')).write_text(json.dumps(cards, ensure_ascii=False, indent=2)+'\n')
    receipts[file] = hashlib.sha256(raw).hexdigest()
    print(lang, len(cards), dict(collections.Counter(c['points'] for c in cards)))
prompt = (src/'Prompt_Generador_Banco.txt').read_bytes()
Path('dist/downloads/Prompt_Generador_Banco.txt').write_bytes(prompt)
receipts['Prompt_Generador_Banco.txt'] = hashlib.sha256(prompt).hexdigest()
Path('scripts/approved-source-hashes.json').write_text(json.dumps(receipts,indent=2)+'\n')
