# Code-Cookbook

Code-Cookbook is a personal technical blog built with Sphinx, MyST Markdown,
and the Read the Docs theme.

## Local development

Create a virtual environment and install the documentation dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r source/requirements.txt
```

Build the static site:

```bash
make html
```

The generated site entry is:

```text
build/html/index.html
```

To preview it locally:

```bash
python -m http.server 8000 -d build/html
```

Then open:

```text
http://localhost:8000
```
