import json, pathlib
root = pathlib.Path(__file__).parent
src = root / "src"
data = json.loads((root.parent / "research" / "gcc-dataset.json").read_text(encoding="utf-8"))
blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
shell = (src / "shell.part.html").read_text(encoding="utf-8").replace("__DATASET__", blob)
js = (src / "data.part.js").read_text(encoding="utf-8") + (src / "app.part.js").read_text(encoding="utf-8")
page = shell + "<script>\n" + js + "</script>\n"
# index.html is what GitHub Pages serves at the site root; gcc-atlas.html keeps the old link working
for name in ("index.html", "gcc-atlas.html"):
    (root / name).write_text(page, encoding="utf-8")
print("built", len(shell) + len(js), "chars")
