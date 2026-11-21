from pathlib import Path
import shutil
root = Path(__file__).resolve().parent.parent
shutil.copytree(root / 'dist', root / 'docs', dirs_exist_ok=True)
(root / 'docs' / '.nojekyll').touch()
print('GitHub Pages synchronized from dist/')
