# Prophet Forecasting Web Application

A full-stack web application for time series forecasting using Facebook Prophet. Upload Excel files and generate interactive forecasts with customizable parameters.

![Prophet Forecasting App](https://img.shields.io/badge/Tech-React%20%2B%20FastAPI%20%2B%20Prophet-blue)

## Features

- 📊 **Excel File Upload**: Support for .xls and .xlsx files
- 🔮 **Prophet Forecasting**: Advanced time series forecasting using Facebook Prophet
- 📈 **Interactive Charts**: Beautiful, interactive visualizations using Chart.js
- ⚙️ **Configurable Parameters**: Customize seasonality, trend flexibility, and holidays
- 📊 **Forecast Metrics**: MAE, RMSE, and MAPE accuracy metrics
- 🌍 **Holiday Support**: Built-in holiday calendars for multiple countries
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Chart.js** for data visualization
- **React Dropzone** for file uploads
- **Axios** for API communication

### Backend
- **FastAPI** for high-performance API
- **Facebook Prophet** for forecasting
- **Pandas** for data processing
- **Uvicorn** ASGI server

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   python main.py
   ```
   
   The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to project root directory:**
   ```bash
   cd ..
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```
   
   The frontend will be available at `http://localhost:3000`

## Usage

### 1. Prepare Your Data

Your Excel file should contain two columns:
- **ds**: Date column (YYYY-MM-DD format preferred)
- **y**: Numeric values to forecast

Example data structure:
| ds         | y   |
|------------|-----|
| 2023-01-01 | 100 |
| 2023-01-02 | 105 |
| 2023-01-03 | 98  |

### 2. Upload Your File

1. Open the application at `http://localhost:3000`
2. Drag and drop your Excel file or click to select
3. Preview your data to ensure it's correctly formatted

### 3. Configure Forecast Parameters

- **Forecast Periods**: Number of future periods to predict
- **Seasonality**: Enable yearly, weekly, or daily patterns
- **Trend Flexibility**: Control how much the trend can change
- **Country Holidays**: Include country-specific holidays

### 4. Generate Forecast

Click "Generate Forecast" to create your prediction. The results will include:
- Interactive chart with historical data and forecast
- Confidence intervals (upper and lower bounds)
- Accuracy metrics (MAE, RMSE, MAPE)

## API Documentation

### Endpoints

#### `POST /api/upload`
Upload and parse Excel files.

**Request**: Multipart form data with Excel file
**Response**: 
```json
{
  "message": "Successfully uploaded and parsed N data points",
  "data": [{"ds": "2023-01-01", "y": 100}, ...]
}
```

#### `POST /api/forecast`
Generate Prophet forecast.

**Request**:
```json
{
  "data": [{"ds": "2023-01-01", "y": 100}, ...],
  "config": {
    "periods": 30,
    "yearly_seasonality": true,
    "weekly_seasonality": true,
    "daily_seasonality": false,
    "changepoint_prior_scale": 0.05,
    "seasonality_prior_scale": 10.0,
    "holidays_prior_scale": 10.0,
    "country_holidays": "US"
  }
}
```

**Response**:
```json
{
  "historical": [{"ds": "2023-01-01", "y": 100}, ...],
  "forecast": [{"ds": "2023-02-01", "yhat": 105, "yhat_lower": 95, "yhat_upper": 115}, ...],
  "metrics": {"mae": 5.2, "rmse": 7.1, "mape": 4.8}
}
```

## Configuration Options

### Prophet Parameters

- **periods**: Number of future periods to forecast
- **yearly_seasonality**: Fit yearly seasonal component
- **weekly_seasonality**: Fit weekly seasonal component
- **daily_seasonality**: Fit daily seasonal component
- **changepoint_prior_scale**: Trend flexibility (0.001-0.5)
- **seasonality_prior_scale**: Seasonality strength (0.01-50)
- **holidays_prior_scale**: Holiday effect strength
- **country_holidays**: Country code for holidays (US, UK, DE, etc.)

### Supported Countries for Holidays

US, UK, DE, FR, IT, ES, CA, AU, JP, CN, IN, BR, and more.

## Troubleshooting

### Common Issues

1. **"Cannot find module 'react'" errors**
   - Run `npm install` to install dependencies
   - Ensure Node.js version is 16 or higher

2. **Prophet installation issues**
   - Install Microsoft C++ Build Tools (Windows)
   - Use conda: `conda install -c conda-forge prophet`

3. **File upload errors**
   - Ensure Excel file has 'ds' and 'y' columns
   - Check date format (YYYY-MM-DD preferred)
   - Verify numeric values in 'y' column

4. **CORS errors**
   - Ensure backend is running on port 8000
   - Check frontend API URLs point to correct backend

### Performance Tips

- For large datasets (>10k points), consider data aggregation
- Reduce forecast periods for faster processing
- Use daily_seasonality=False for datasets with periods longer than days

## Development

### Project Structure
```
prophet-forecasting-app/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── App.tsx            # Main App component
│   └── index.tsx          # Entry point
├── backend/               # FastAPI backend
│   ├── main.py           # API server
│   └── requirements.txt  # Python dependencies
├── public/               # Static assets
└── package.json         # Node.js dependencies
```

### Adding New Features

1. **Frontend**: Add components in `src/components/`
2. **Backend**: Extend API endpoints in `backend/main.py`
3. **Styling**: Update CSS in `src/index.css`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Create an issue on GitHub

---

**Built with ❤️ using React, FastAPI, and Facebook Prophet**