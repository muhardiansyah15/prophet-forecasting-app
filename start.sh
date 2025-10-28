#!/bin/bash

# Prophet Forecasting App Startup Script

echo "🚀 Starting Prophet Forecasting App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Function to start backend
start_backend() {
    echo "🐍 Setting up Python backend..."
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install Python dependencies
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Start FastAPI server
    echo "🔄 Starting FastAPI server on http://localhost:8000..."
    python main.py &
    BACKEND_PID=$!
    
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "⚛️ Setting up React frontend..."
    
    # Install Node.js dependencies
    echo "📦 Installing Node.js dependencies..."
    npm install
    
    # Start React development server
    echo "🔄 Starting React app on http://localhost:3000..."
    npm start &
    FRONTEND_PID=$!
}

# Function to create sample data
create_sample_data() {
    echo "📊 Creating sample data files..."
    cd backend
    source venv/bin/activate
    cd ..
    python create_sample_data.py
}

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
echo "==========================================="
echo "🔮 Prophet Forecasting App Setup"
echo "==========================================="

# Start backend
start_backend

# Wait a moment for backend to start
sleep 3

# Start frontend
start_frontend

# Create sample data
create_sample_data

echo ""
echo "✅ Application started successfully!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Sample data files created:"
echo "   - sample_timeseries.xlsx"
echo "   - sample_sales_data.xlsx"
echo "   - sample_website_traffic.xlsx"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user input
wait