# YesPlan API Proof of Concept

This folder contains a Python script to fetch data from YesPlan's REST API.

## Setup

1. Install dependencies using `uv`:

```bash
uv pip install -r requirements.txt
```

Or sync dependencies (if using uv project):

```bash
uv sync
```

## Usage

Run the script:

```bash
python fetch_yesplan_data.py
```

Or with `uv`:

```bash
uv run fetch_yesplan_data.py
```

The script will:

- Fetch data from various YesPlan endpoints (events, resources, contacts, locations, labels)
- Display previews of the fetched data
- Save all results to `yesplan_data.json`

## Configuration

The script uses the API credentials from `docs/yesplan.md`:

- Base URL: `https://neuf.yesplan.be`
- API Key: Configured in the script

## API Documentation

For more information about YesPlan's API, see:
https://manual.yesplan.be/en/developers/rest-api/
