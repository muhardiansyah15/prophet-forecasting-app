Prophet and CmdStan setup instructions
====================================

This project uses Facebook Prophet (the `prophet` Python package). Prophet uses a Stan backend (CmdStan via `cmdstanpy`) to fit models. On many systems you must install a small set of system packages and then install CmdStan before Prophet will work.

Two recommended approaches
-------------------------

1) Native Python + CmdStan (recommended if you can install system packages)

- Install system build tools (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y build-essential make g++ python3-dev
```

- Upgrade pip and install Python packages in your backend venv:

```bash
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
```

- Install CmdStan using cmdstanpy (runs as the current user and downloads CmdStan sources and builds them):

```bash
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()"
```

This will download CmdStan (~200MB) and run `make build`. Building requires the `make` and `g++` tools installed above. After completion, `cmdstanpy.cmdstan_path()` should return a valid path.

2) Use conda-forge (simpler on some platforms)

If you use conda (Miniconda/Anaconda) you can install Prophet and its dependencies from conda-forge which includes prebuilt components:

```bash
conda create -n prophet-env -c conda-forge python=3.10 prophet
conda activate prophet-env
# Then install other backend deps (fastapi, uvicorn, pandas, etc.) into the same env
pip install -r requirements.txt
```

Notes and troubleshooting
------------------------
- If you see an error like "'Prophet' object has no attribute 'stan_backend'" or import errors referencing Stan/CmdStan, it means the Stan backend (CmdStan) is missing or incompatible.
- Running `python -c "import cmdstanpy; print(cmdstanpy.cmdstan_path())"` should print the path to an installed CmdStan. If it prints `None` or raises, then CmdStan is not installed.
- On CI or headless servers you may need additional system libs; the key packages are `make`, `g++` (or clang), and Python headers (`python3-dev`).
- If you prefer not to install system build tools, use the conda approach above.

After following either approach, restart the backend and call the `/api/prophet_status` endpoint to verify availability.

Example check (after starting backend):

```
GET http://localhost:8001/api/prophet_status

Response: {
  "prophet_imported": true,
  "cmdstanpy_available": true,
  "cmdstan_installed": true,
  "cmdstan_path": "/home/you/.cmdstan/cmdstan-2.x.x"
}
```

If `prophet_imported` is false, check Python packages (pip list). If `cmdstan_installed` is false, run the `cmdstanpy.install_cmdstan()` command shown above.

If you need help with a specific error message, include the exact traceback when asking for help.
