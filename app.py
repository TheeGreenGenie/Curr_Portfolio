import os
import re
import json
from flask import Flask, render_template, abort

app = Flask(__name__)


def load_json(filename):
    path = os.path.join(app.root_path, 'data', filename)
    with open(path, encoding='utf-8') as f:
        return json.load(f)


# ── Project screenshots ──────────────────────────────────────────────────────

SCREENSHOT_EXTS = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg')


def _static_image_path(rel):
    return os.path.join(app.static_folder, 'images', *rel.split('/'))


def resolve_screenshots(project):
    """Attach the ordered screenshot list to a project.

    Screenshot files live in ``static/images/<folder>``, where <folder>
    defaults to ``projects/<project id>`` (override with "screenshot_folder").

    The JSON "screenshots" list controls display order — reorder it any time.
    The first entry becomes the project's display picture. Any file sitting in
    the folder that isn't listed is appended alphabetically, so dropping a new
    screenshot in works without touching the JSON.
    """
    folder = (project.get('screenshot_folder') or 'projects/' + project['id']).strip('/')
    abs_dir = os.path.join(app.static_folder, 'images', *folder.split('/'))

    ordered = []
    for name in project.get('screenshots') or []:
        name = name.strip().strip('/')
        if not name:
            continue
        # A bare filename is relative to the project folder; a path is
        # relative to static/images.
        rel = name if '/' in name else folder + '/' + name
        if rel not in ordered:
            ordered.append(rel)

    if os.path.isdir(abs_dir):
        for name in sorted(os.listdir(abs_dir)):
            if not name.lower().endswith(SCREENSHOT_EXTS):
                continue
            rel = folder + '/' + name
            if rel not in ordered:
                ordered.append(rel)

    # Never render an entry with no file behind it
    ordered = [rel for rel in ordered if os.path.isfile(_static_image_path(rel))]

    project['screenshot_folder'] = folder
    project['screenshots'] = ordered

    # First screenshot is the display picture; fall back to preview_image, but
    # only if that file actually exists. Empty means "draw the placeholder".
    preview = (project.get('preview_image') or '').strip()
    if preview and not os.path.isfile(_static_image_path(preview)):
        preview = ''
    project['display_image'] = ordered[0] if ordered else preview
    # Gallery = screenshots first, then any legacy hand-listed images
    project['gallery'] = ordered + [
        img for img in (project.get('images') or []) if img and img not in ordered
    ]
    return project


# ── Theme detection ──────────────────────────────────────────────────────────

_THEME_KEYWORDS = {
    'Memory & Time': [
        'memory', 'remember', 'archive', 'past', 'old', 'once', 'before',
        'yesterday', 'forget', 'forgotten', 'history', 'time', 'year',
        'measure', 'clock', 'calendar', 'age', 'era', 'moment', 'long ago',
    ],
    'Nature & Light': [
        'sky', 'sun', 'moon', 'light', 'dark', 'shadow', 'tree', 'river',
        'rain', 'wind', 'earth', 'morning', 'night', 'star', 'cloud',
        'leaf', 'snow', 'water', 'ocean', 'flower', 'bird', 'season',
        'storm', 'heat', 'cold', 'dawn', 'dusk', 'sunset', 'sunrise',
        'shore', 'field', 'hill', 'forest', 'wood', 'stone', 'soil',
    ],
    'Longing & Loss': [
        'lost', 'gone', 'absence', 'miss', 'grief', 'mourn', 'sorrow',
        'ache', 'hurt', 'pain', 'lonely', 'alone', 'empty', 'hollow',
        'leave', 'left', 'away', 'never', 'without', 'missing', 'fade',
        'silent', 'end', 'break', 'apart', 'distance', 'far',
    ],
    'Quiet & Stillness': [
        'silence', 'quiet', 'still', 'hush', 'pause', 'wait', 'slow',
        'breath', 'breathe', 'gentle', 'soft', 'calm', 'peace', 'rest',
        'exhale', 'suspended', 'lull', 'drift', 'float',
    ],
    'Place & Distance': [
        'home', 'house', 'room', 'city', 'street', 'place', 'map', 'window',
        'door', 'country', 'town', 'travel', 'journey', 'latitude',
        'cartography', 'geography', 'direction', 'road', 'path',
        'somewhere', 'nowhere', 'border', 'horizon', 'ground', 'land',
        'neighborhood', 'corner', 'building', 'bridge',
    ],
    'Wonder & Ordinary': [
        'ordinary', 'simple', 'small', 'everything', 'nothing', 'something',
        'day', 'find', 'notice', 'wonder', 'unit', 'strange', 'curious',
        'question', 'understand', 'realize', 'discover', 'see', 'look',
        'watch', 'observe', 'think', 'know', 'feel', 'sense', 'touch',
    ],
}


def _slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


# ── Documents (resume / CV) ──────────────────────────────────────────────────

DOCUMENTS = {
    'resume': {
        'title':    'Resume',
        'keywords': ('resume', 'résumé'),
        'blurb':    'A one-page overview of my experience, education, and technical background.',
    },
    'cv': {
        'title':    'CV',
        'keywords': ('cv', 'curriculum', 'vitae'),
        'blurb':    'The long-form version — full history of projects, education, and work.',
    },
}


def find_document(kind):
    """Return the filename of the resume/CV PDF, or None if it isn't there.

    Prefers the exact name (`cv.pdf`), but also accepts any PDF in
    static/files whose name contains a matching keyword — so
    "Solomon-CV.pdf" or "curriculum-vitae.pdf" are picked up too.
    """
    meta = DOCUMENTS.get(kind)
    if meta is None:
        return None

    files_dir = os.path.join(app.static_folder, 'files')
    if not os.path.isdir(files_dir):
        return None

    pdfs = sorted(f for f in os.listdir(files_dir) if f.lower().endswith('.pdf'))

    exact = kind + '.pdf'
    for name in pdfs:
        if name.lower() == exact:
            return name

    # Match a keyword as a whole word so "resume.pdf" never answers for "cv"
    for name in pdfs:
        stem = os.path.splitext(name)[0].lower()
        words = re.split(r'[^a-zé]+', stem)
        if any(kw in words for kw in meta['keywords']):
            return name

    return None


def detect_theme(content):
    """Return the best-matching theme name for a poem's content."""
    words = re.findall(r"[a-z']+", content.lower())
    word_set = set(words)
    # also check bigrams for 'long ago', 'no one', etc.
    bigrams = {words[i] + ' ' + words[i + 1] for i in range(len(words) - 1)}

    scores = {}
    for theme, keywords in _THEME_KEYWORDS.items():
        score = sum(
            1 for kw in keywords
            if (' ' in kw and kw in bigrams) or (' ' not in kw and kw in word_set)
        )
        scores[theme] = score

    best_theme, best_score = max(scores.items(), key=lambda x: x[1])
    return best_theme if best_score > 0 else 'Other'


@app.route('/')
def index():
    return render_template(
        'index.html',
        resume_file=find_document('resume'),
        cv_file=find_document('cv'),
    )


@app.route('/documents/<name>')
def document_view(name):
    """In-browser viewer for the resume / CV."""
    meta = DOCUMENTS.get(name)
    if meta is None:
        abort(404)

    filename = find_document(name)
    if filename is None:
        abort(404)

    # Offer a link to the other document when it exists
    other_key = 'cv' if name == 'resume' else 'resume'
    other_file = find_document(other_key)
    other = None
    if other_file:
        other = {'key': other_key, 'title': DOCUMENTS[other_key]['title']}

    return render_template('document.html', doc=meta, name=name,
                           filename=filename, other=other)


PROJECT_TYPE_LABELS = {
    'hackathon': 'Hackathon',
    'school':    'School',
    'personal':  'Personal',
}


@app.route('/projects')
def projects():
    all_projects = [resolve_screenshots(p) for p in load_json('projects.json')]

    # Best-illustrated projects first: most screenshots, then featured.
    # Projects with no pictures at all fall to the bottom.
    all_projects.sort(key=lambda p: (
        -len(p['gallery']),
        not p.get('featured', False),
        p['title'].lower(),
    ))

    categories = sorted(set(p['category'] for p in all_projects))

    # "Accomplishment" filters: project type, plus award winners if any exist
    present = {p.get('project_type') for p in all_projects}
    types = [
        {'value': key, 'label': label}
        for key, label in PROJECT_TYPE_LABELS.items() if key in present
    ]
    if any(p.get('hackathon_wins') for p in all_projects):
        types.append({'value': 'award', 'label': 'Award-Winning'})

    return render_template('projects.html', projects=all_projects,
                           categories=categories, types=types)


@app.route('/projects/<slug>')
def project_detail(slug):
    all_projects = load_json('projects.json')
    project = next((p for p in all_projects if p['id'] == slug), None)
    if project is None:
        abort(404)
    return render_template('project_detail.html', project=resolve_screenshots(project))


@app.route('/poetry')
def poetry():
    poems = load_json('poems.json')

    # Separate collected vs. uncollected
    collected   = [p for p in poems if p.get('collection', '').strip()]
    uncollected = [p for p in poems if not p.get('collection', '').strip()]

    # Build ordered list of unique collections (preserving first-seen order)
    seen = []
    for p in collected:
        c = p['collection']
        if c not in seen:
            seen.append(c)
    collections = [
        {'name': name, 'slug': _slugify(name),
         'poems': [p for p in collected if p['collection'] == name]}
        for name in seen
    ]

    # Group uncollected poems by auto-detected theme
    theme_map = {}
    for p in uncollected:
        theme = detect_theme(p['content'])
        theme_map.setdefault(theme, []).append(p)

    # Preserve theme order by _THEME_KEYWORDS definition, then 'Other'
    theme_order = list(_THEME_KEYWORDS.keys()) + ['Other']
    themed_groups = [
        {'theme': t, 'slug': _slugify(t), 'poems': theme_map[t]}
        for t in theme_order
        if t in theme_map
    ]

    return render_template(
        'poetry.html',
        all_poems=poems,
        collections=collections,
        themed_groups=themed_groups,
        has_general=bool(uncollected),
    )


@app.route('/poetry/<slug>')
def poem_detail(slug):
    poems = load_json('poems.json')
    poem = next((p for p in poems if p['id'] == slug), None)
    if poem is None:
        abort(404)
    idx = next(i for i, p in enumerate(poems) if p['id'] == slug)
    prev_poem = poems[idx - 1] if idx > 0 else None
    next_poem = poems[idx + 1] if idx < len(poems) - 1 else None
    return render_template('poem_detail.html', poem=poem, prev_poem=prev_poem, next_poem=next_poem)


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True)
