# Requirements & Setup

This project is a static web app with a couple of PowerShell build helpers. The steps below set up Node for a local dev server and explain where required data files live.

## Prerequisites
- Node.js: use an active LTS version (the repo includes `.nvmrc` set to `lts/*`).
- npm: comes with Node.
- PowerShell: Windows PowerShell 5.1+ or PowerShell 7+.

## Install
1. From the repo root, install Node dependencies:

   ```powershell
   npm install
   ```

## Run the app locally
1. Start the local server:

   ```powershell
   npm run dev
   ```

2. Open the printed URL in your browser (default is `http://localhost:5173`).

## Build generated assets
Some game data is generated from CSV sources.

1. Put the required CSVs in `requirements/data/`:
   - `country_codes.csv`
   - `forenames.csv`
   - `surnames.csv`

2. Run the build scripts:

   ```powershell
   npm run build:assets
   ```

This writes:
- `src/js/app/name-data.js`
- `src/js/app/world-map-inline.js`

## Notes
- If you prefer to keep CSVs at the repo root, the build script will fall back to `./country_codes.csv`, `./forenames.csv`, and `./surnames.csv`.
