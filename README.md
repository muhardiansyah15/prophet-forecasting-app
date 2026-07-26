# Prophet Forecast Studio

Upload an Excel/CSV time series and get a full forecast **dashboard** —
KPI tiles, an uncertainty-band forecast chart, Prophet's trend/seasonality
decomposition, and a downloadable forecast table.

- **Frontend:** React + TypeScript + Chart.js — https://muhardiansyah15.github.io/prophet-forecasting-app/
- **Backend:** FastAPI + [Facebook Prophet](https://facebook.github.io/prophet/) (v1.3) — https://prophet-forecasting-app-zlfw.onrender.com

## What you get

1. **Upload** — drag & drop `.xlsx`, `.xls`, or `.csv` (max 10MB). Columns
   named `ds`/`y` (Prophet's convention) are used directly; otherwise the
   date and value columns are auto-detected. A sample dataset is one click
   away.
2. **Configure** — forecast horizon (7–365 days), method (Prophet
   recommended; linear trend, moving average, exponential smoothing as
   fallbacks), seasonalities, country holidays (incl. Indonesia), and
   Prophet priors under "Advanced".
3. **Dashboard** —
   - KPI tiles: predicted average & total for the horizon, growth vs the
     same-length recent window, backtest MAPE/MAE/RMSE (last-20% holdout);
   - forecast chart with the model's uncertainty interval band;
   - **decomposition**: long-term trend (with detected changepoints),
     weekly pattern, and yearly pattern — the signature Prophet feature;
   - forecast table with CSV export.

## Run locally

Backend (Python 3.10+):

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8001
```

Frontend:

```bash
npm install
npm start          # expects the API at http://localhost:8001
```

Set `REACT_APP_API_URL` to point the frontend at a different backend.

## API

| Endpoint | Description |
|---|---|
| `POST /api/upload` | multipart file → parsed `[{ds, y}]` points |
| `POST /api/forecast` | data + config → historical, in-sample fit, forecast with bounds, holdout metrics, components (trend/weekly/yearly), changepoints |
| `GET /api/prophet_status` | Prophet availability diagnostics |

Interactive docs at `/docs` (Swagger UI).

## Notes

- Prophet ≥1.1 wheels bundle a precompiled Stan model — no separate CmdStan
  install is needed. The old `stan_backend` failure was fixed by upgrading
  to prophet 1.3.0 (see `backend/requirements.txt`).
- The frontend deploys to GitHub Pages via GitHub Actions; the `homepage`
  field in `package.json` keeps asset paths correct.

---

Built by [Muhardiansyah](https://muhardiansyah.netlify.app/).
