# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# import os
# import sys
# sys.path.insert(0, os.path.abspath('.'))
import datetime

# -- Project information -----------------------------------------------------
master_doc = 'index'
project = 'Code-Cookbook'
copyright = '2020-{}, roohom'.format(
    datetime.datetime.now().year
)
author = 'roohom'

# The full version, including alpha/beta/rc tags
release = '0.2'



# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
		# 'recommonmark',
		"myst_parser",
		'sphinx.ext.autodoc',
		'sphinx.ext.autosummary',
		'sphinx.ext.todo',
		'sphinx.ext.autosectionlabel',
]


# -- Options for LaTeX output ------------------------------------------------
 
latex_elements = {
# The paper size ('letterpaper' or 'a4paper').
#'papersize': 'letterpaper',
 
# The font size ('10pt', '11pt' or '12pt').
#'pointsize': '10pt',
 
# Additional stuff for the LaTeX preamble.
'preamble': '''
\\hypersetup{unicode=true}
\\usepackage{CJKutf8}
\\AtBeginDocument{\\begin{CJK}{UTF8}{gbsn}}
\\AtEndDocument{\\end{CJK}}
''',
}
 


# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# The language for content autogenerated by Sphinx. Refer to documentation
# for a list of supported languages.
#
# This is also used if you do content translation via gettext catalogs.
# Usually you set "language" from the command line for these cases.
language = 'zh_CN'

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = [
	'sphinx.ext.napoleon',
]


# ---------------Personal Settings---------------------
# 支持MarkDown
# source_suffix = '.rst'
# from recommonmark.parser import CommonMarkParser
# source_parsers = {
#     '.md': CommonMarkParser,
# }

import myst_parser

source_parsers = {
    '.md': myst_parser
}
source_suffix = ['.rst',
				 '.md',
				 'MD',
 ]

#source_suffix = ['.rst',
#				 '.md',
#				 '.MD'
# 
# ]
# -----------------------------------------------------


notfound_context = {
    'title': 'Page Not Found',
    'body': '''
<h1>Page Not Found</h1>

<p>Sorry, we couldn't find that page.</p>

<p>Try using the search box or go to the homepage.</p>
''',
}



# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = 'sphinx_rtd_theme'
#html_theme = 'alabaster'

html_js_files = ["js/expand_tabs.js"]

html_theme_options = {
    "rightsidebar": "true",
    "relbarbgcolor": "black",
    "body_max_width": "90%"
}


# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']
