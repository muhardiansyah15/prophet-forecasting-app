# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Quick Setup
```bash
cd /home/muhardiansyah/Documents/prophet-forecasting-app
./start.sh
```

This script will:
- Set up Python virtual environment
- Install all dependencies
- Start both frontend and backend servers
- Create sample data files

### Step 2: Open the App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Step 3: Test with Sample Data
Use one of the generated sample files:
- `sample_timeseries.xlsx` - Generic time series data
- `sample_sales_data.xlsx` - E-commerce sales data
- `sample_website_traffic.xlsx` - Website analytics data

## Manual Setup (Alternative)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
npm install
npm start
```

## Testing the Application

1. **Upload Data**: Drag and drop an Excel file or use sample data
2. **Configure Forecast**: Adjust parameters like forecast periods and seasonality
3. **Generate Forecast**: Click "Generate Forecast" to see predictions
4. **Analyze Results**: View interactive charts and accuracy metrics

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill processes on ports 3000 and 8000
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

### Prophet Installation Issues
```bash
# On Ubuntu/Debian
sudo apt-get install python3-dev

# Using conda (recommended)
conda install -c conda-forge prophet
```

### File Upload Errors
- Ensure your Excel file has columns named exactly "ds" and "y"
- Dates should be in YYYY-MM-DD format
- Values should be numeric

## What's Included

✅ **Frontend** (React + TypeScript)
- File upload with drag & drop
- Interactive forecasting charts
- Configurable parameters
- Responsive design

✅ **Backend** (FastAPI + Prophet)
- Excel file processing
- Prophet forecasting engine
- RESTful API endpoints
- Automatic validation

✅ **Sample Data**
- Three different datasets
- Ready-to-use Excel files
- Various time series patterns

✅ **Documentation**
- Complete setup guide
- API documentation
- Troubleshooting tips

## Next Steps

- Customize the UI styling in `src/index.css`
- Add new forecast models in `backend/main.py`
- Extend file format support (CSV, JSON)
- Deploy to cloud platforms (Heroku, AWS, etc.)

Happy forecasting! 🔮📊