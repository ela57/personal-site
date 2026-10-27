# Ethan Lam's personal site

A static portfolio served from `index.html`, with no build step.

## Generate images

Run `generate_image.py` with Python 3.10 or newer. It uses the Python standard
library, so no dependency installation is needed. The script calls OpenAI's
Images API with **`gpt-image-2.5-sunburst`** and saves one PNG to `assets/`.
It is a command-line tool, not part of the website's browser code.

Provide `OPENAI_API_KEY` through the process environment. In Devin Cloud,
make the stored secret available under that environment variable before running.
Local Devin Desktop/CLI sessions do not automatically inherit Devin Cloud Secrets.
The script deliberately does not read keys from files or accept a key argument.
Do not paste keys into chat, source code, or shell commands/history.

```sh
python3 generate_image.py \
  "Pixel art of an orange astronaut cat floating among blue and violet stars, no text" \
  --output image-generation-test.png --quality low
```

Each invocation makes one billable API request. There are no automatic retries
or model substitutions. You need API billing and access to the requested model.

Options:

- `--output NAME.png`: filename in `assets/`; existing files are never overwritten.
  Omit it to use a unique timestamped filename.
- `--size`: `1024x1024` (default), `1536x1024`, `1024x1536`, or `auto`.
- `--quality`: `low`, `medium` (default), `high`, `xhigh`, `max`, or `auto`.

The script resolves `assets/` relative to itself, so it also works when invoked
from another directory. Only image bytes are saved; credentials, API responses,
and prompts are not written to logs or sidecar files. Generated images can be
reviewed and committed when ready to publish.

API failures produce a sanitized status message without printing response bodies
or authorization headers. Missing credentials are rejected before any request.

See the [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation).
