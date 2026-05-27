import datetime

# -- Project information -----------------------------------------------------

master_doc = 'index'
project = 'Code-Cookbook'
copyright = '2020-{}, roohom'.format(datetime.datetime.now().year)
author = 'roohom'
release = '0.2'


# -- General configuration ---------------------------------------------------

extensions = [
    'myst_parser',
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.todo',
    'sphinx.ext.autosectionlabel',
    'sphinxcontrib.mermaid',
    'sphinxemoji.sphinxemoji',
]

templates_path = ['_templates']
language = 'zh_CN'

exclude_patterns = [
    '_build',
    'requirements.txt',
    'requirements/*.txt',
    'Thumbs.db',
    '.DS_Store',
]

source_suffix = {
    '.rst': 'restructuredtext',
    '.txt': 'markdown',
    '.md': 'markdown',
}

myst_fence_as_directive = ['mermaid']
autosectionlabel_prefix_document = True


# -- Options for LaTeX output ------------------------------------------------

latex_elements = {
    'preamble': r'''
\hypersetup{unicode=true}
\usepackage{CJKutf8}
\AtBeginDocument{\begin{CJK}{UTF8}{gbsn}}
\AtEndDocument{\end{CJK}}
''',
}


# -- Options for HTML output -------------------------------------------------

html_theme = 'sphinx_rtd_theme'

html_js_files = [
    'js/theme-toggle.js',
    'js/expand_tabs.js',
    'js/code_blocks.js',
    'js/home_motion.js',
    'js/sidebar.js',
]

html_css_files = [
    'css/custom.css',
]

html_title = "Roohom's Code-Cookbook"
html_short_title = 'Code-Cookbook'

html_theme_options = {
    'rightsidebar': 'true',
    'relbarbgcolor': 'black',
    'body_max_width': '90%',
}

html_static_path = ['_static']
mermaid_d3_zoom = True

notfound_context = {
    'title': 'Page Not Found',
    'body': '''
<h1>Page Not Found</h1>

<p>Sorry, we couldn't find that page.</p>

<p>Try using the search box or go to the homepage.</p>
''',
}


def setup(app):
    app.add_js_file(
        None,
        body=(
            '(function(){'
            'var t=localStorage.getItem("cc-theme");'
            'var d=t?t==="dark":matchMedia("(prefers-color-scheme:dark)").matches;'
            'if(d)document.documentElement.classList.add("cc-dark");'
            '})()'
        ),
    )
