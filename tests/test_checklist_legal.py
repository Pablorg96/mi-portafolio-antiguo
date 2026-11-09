#!/usr/bin/env python3
"""Test de la checklist legal (LSSI / RGPD / LOPDGDD) y de seguridad del portafolio.

Uso:  python3 tests/test_checklist_legal.py  [ruta_del_sitio]
- Levanta un servidor local para comprobar que los enlaces no dan 404.
- Analiza el HTML con la librería estándar (sin dependencias).
Resultado: OK = cumplido, FALLO = hay que corregir, MANUAL = lo tienes que confirmar tú.
"""
import functools, http.server, re, sys, threading, urllib.error, urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent)
EMAIL = "pablorg16@gmail.com"
results = []


def check(point, name, ok, detail=""):
    results.append((point, "OK" if ok else "FALLO", name, detail))


def manual(point, name, detail):
    results.append((point, "MANUAL", name, detail))


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.inputs, self.forms, self.iframes, self.text = [], [], [], [], []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style"):
            self._skip += 1
        if tag == "a":
            self.links.append(a)
        elif tag == "input":
            self.inputs.append(a)
        elif tag == "form":
            self.forms.append(a)
        elif tag == "iframe":
            self.iframes.append(a)

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.text.append(data)

    @property
    def plain(self):
        return re.sub(r"\s+", " ", " ".join(self.text))


def parse(name):
    p = Parser()
    p.feed((ROOT / name).read_text(encoding="utf-8"))
    return p


# ---------- servidor local para comprobar 404 ----------
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


handler = functools.partial(Quiet, directory=str(ROOT))
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{srv.server_port}/"


def status(path):
    try:
        return urllib.request.urlopen(urllib.request.Request(BASE + path, method="HEAD")).status
    except urllib.error.HTTPError as e:
        return e.code


index = parse("index.html")
footer_hrefs = [l.get("href") for l in index.links]

# ---------- 1. Aviso legal ----------
check("1", "aviso-legal.html existe y responde 200", status("aviso-legal.html") == 200)
av = parse("aviso-legal.html").plain
check("1", "Nombre completo del titular", "Pablo Romero Garduño" in av)
nif = re.search(r"\b(NIF|NIE|DNI)\b[^:]*:\s*([0-9XYZ]\d{7}[A-Z])", av)
if nif:
    check("1", "NIF / NIE visible (art. 10 LSSI)", True)
else:
    manual("1", "NIF / NIE (art. 10 LSSI)",
           "No se muestra: decisión del titular (portfolio personal, sin actividad económica propia)")
check("1", "Domicilio profesional o localidad", "Sevilla" in av and "España" in av)
check("1", f"Email de contacto {EMAIL}", EMAIL in av)
check("1", "Condiciones de uso", "Condiciones de uso" in av)
check("1", "Propiedad intelectual sobre proyectos y marcas", "Propiedad intelectual" in av and "clientes" in av)
check("1", "Footer de index.html enlaza a aviso-legal.html (sin 404)",
      "aviso-legal.html" in footer_hrefs and status("aviso-legal.html") == 200)

# ---------- 2. Política de privacidad ----------
check("2", "privacidad.html existe y responde 200", status("privacidad.html") == 200)
pv = parse("privacidad.html").plain
check("2", "Responsable del tratamiento", "Responsable" in pv and "Pablo Romero Garduño" in pv and EMAIL in pv)
check("2", "Finalidad: consultas y presupuestos", "Finalidad" in pv and "presupuesto" in pv)
check("2", "Base jurídica: consentimiento (6.1.a) y precontractual (6.1.b)", "6.1.a" in pv and "6.1.b" in pv)
check("2", "Plazo de conservación", "conservación" in pv.lower() and "obligaciones" in pv)
check("2", "Destinatarios: GitHub Pages / Microsoft + Data Privacy Framework",
      "GitHub Pages" in pv and "Microsoft" in pv and "Marco de Privacidad de Datos UE-EE. UU." in pv)
check("2", "Destinatarios: FormSubmit declarado (el formulario lo usa)", "FormSubmit" in pv)
derechos = ["acceso", "rectificación", "supresión", "oposición", "limitación"]
check("2", "Derechos ARCO+ con instrucciones por email",
      all(d in pv.lower() for d in derechos) and "Escríbeme" in pv)
check("2", "Reclamación ante la AEPD", "Agencia Española de Protección de Datos" in pv)
check("2", "Footer de index.html enlaza a privacidad.html (sin 404)", "privacidad.html" in footer_hrefs)

# ---------- 3. Política de cookies ----------
check("3", "cookies.html existe y responde 200", status("cookies.html") == 200)
ck = parse("cookies.html").plain
check("3", "Declara que no hay cookies analíticas, publicitarias ni de seguimiento",
      "no utiliza cookies analíticas, de perfilado publicitario ni de seguimiento de terceros" in ck)
check("3", "Justifica por qué no hace falta banner", "no se requiere un banner" in ck and "22.2" in ck)
check("3", "Declara el almacenamiento local 'theme' (modo noche)", "theme" in ck)
js = (ROOT / "script.js").read_text(encoding="utf-8")
all_html = "".join(p.read_text(encoding="utf-8") for p in ROOT.glob("*.html"))
trackers = re.findall(r"google-analytics|googletagmanager|gtag\(|fbq\(|hotjar|clarity\.ms|plausible|matomo",
                      js + all_html, re.I)
check("3", "El código no carga analítica ni píxeles de seguimiento", not trackers, ", ".join(set(trackers)))
check("3", "El código no crea cookies (document.cookie)", "document.cookie" not in js + all_html)
storage_keys = set(re.findall(r"localStorage\.setItem\(\s*['\"](\w+)['\"]", js + all_html))
check("3", "Todo lo guardado en el navegador está declarado en la política",
      storage_keys <= {"theme"}, f"claves encontradas: {storage_keys}")
yt = re.findall(r"youtube(?:-nocookie)?\.com/embed", js + all_html)
check("3", "Vídeos de YouTube en modo youtube-nocookie", all("nocookie" in u for u in yt))
check("3", "Footer de index.html enlaza a cookies.html (sin 404)", "cookies.html" in footer_hrefs)

# ---------- 4. Sección de contacto ----------
ip = index.plain
form = index.forms[0] if index.forms else {}
has_form = bool(form)
cta_ok = ("formulario" in ip and "email" in ip) if has_form else ("formulario" not in ip)
check("4", "Texto de llamada a la acción coherente (formulario + email)", has_form and cta_ok)
check("4", "Formulario envía por HTTPS (FormSubmit)", form.get("action", "").startswith("https://formsubmit.co/"))
info = re.search(r"Información básica sobre protección de datos(.*?)política de privacidad", ip)
check("4", "Primera capa informativa bajo el formulario (Responsable, Finalidad, Derechos)",
      bool(info) and all(k in info.group(1) for k in ("Responsable", "Finalidad", "Derechos")))
cb = next((i for i in index.inputs if i.get("type") == "checkbox"), None)
check("4", "Casilla de privacidad presente y obligatoria", bool(cb) and "required" in cb)
check("4", "Casilla desmarcada por defecto", bool(cb) and "checked" not in cb)
check("4", "La casilla enlaza a privacidad.html",
      re.search(r'id="contactoPrivacidad".*?href="privacidad\.html"',
                (ROOT / "index.html").read_text(encoding="utf-8"), re.S) is not None)
nxt = next((i.get("value", "") for i in index.inputs if i.get("name") == "_next"), "")
check("4", "Página de gracias tras el envío existe", nxt.endswith("gracias.html") and status("gracias.html") == 200)

# ---------- 5. Propiedad intelectual y seguridad ----------
logos = sorted(p.name for p in (ROOT / "logos").glob("*") if not p.name.startswith("._"))
manual("5", "Autorización para mostrar logos y trabajos de clientes",
       "Confirmada por el titular (9/11/2026): " + ", ".join(logos))
check("5", "El aviso legal aclara que las marcas son de sus propietarios",
      "pertenecen a sus respectivos propietarios" in av)
bad = []
for f in sorted(ROOT.glob("*.html")):
    for l in parse(f.name).links:
        href = l.get("href", "")
        external = href.startswith("http") or l.get("target") == "_blank"
        if external:
            rel = set((l.get("rel") or "").split())
            if l.get("target") != "_blank" or not {"noopener", "noreferrer"} <= rel:
                bad.append(f"{f.name}: {href}")
check("5", 'Enlaces externos con target="_blank" y rel="noopener noreferrer"', not bad, "; ".join(bad))
js_blank = re.findall(r"_blank", js)
check("5", "script.js no abre ventanas externas sin protección", not js_blank)
insecure = re.findall(r'(?:src|href|action)="http://[^"]+', all_html)
check("5", "Sin recursos cargados por http:// (contenido mixto)", not insecure, "; ".join(insecure))
broken = []
for f in sorted(ROOT.glob("*.html")):
    for l in parse(f.name).links:
        h = l.get("href", "")
        if h and not re.match(r"(https?:|mailto:|tel:|#)", h):
            target = h.split("#")[0].split("?")[0]
            if target and status(target) != 200:
                broken.append(f"{f.name} -> {h}")
check("5", "Ningún enlace interno da 404", not broken, "; ".join(broken))

srv.shutdown()

# ---------- informe ----------
icon = {"OK": "✅", "FALLO": "❌", "MANUAL": "⚠️"}
titles = {"1": "Aviso legal", "2": "Política de privacidad", "3": "Política de cookies",
          "4": "Sección de contacto", "5": "Propiedad intelectual y seguridad"}
last = None
for point, st, name, detail in results:
    if point != last:
        print(f"\n{point}. {titles[point]}")
        last = point
    print(f"  {icon[st]} {name}" + (f"  → {detail}" if detail and st != "OK" else ""))
n = {s: sum(r[1] == s for r in results) for s in icon}
print(f"\nTotal: {n['OK']} OK · {n['FALLO']} fallos · {n['MANUAL']} manuales ({len(results)} comprobaciones)")
sys.exit(1 if n["FALLO"] else 0)
