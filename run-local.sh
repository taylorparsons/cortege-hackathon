#!/bin/bash

# CORTEGE Local Development Runner
# This script sets up and runs the CORTEGE agent orchestration system locally
# Opens separate terminal windows for backend and frontend so you can monitor logs

set -e  # Exit on error

echo "🚀 CORTEGE Local Development Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm $(npm --version) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your ANTHROPIC_API_KEY"
    echo "   The app cannot run without a valid API key."
    echo ""
    read -p "Press Enter after you've added your API key to .env, or Ctrl+C to exit..."
fi

# Verify ANTHROPIC_API_KEY is set
source .env
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ]; then
    echo ""
    echo "❌ ANTHROPIC_API_KEY is not configured in .env"
    echo "   Please edit .env and add your Anthropic API key."
    exit 1
fi

echo "✓ Environment configured"

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    echo ""
    echo "📁 Creating data directory..."
    mkdir -p data
fi

echo ""
echo "=================================="
echo "🎯 Starting CORTEGE in separate terminals..."
echo "=================================="
echo ""
echo "Backend server: http://localhost:${PORT:-3001}"
echo "Frontend dev server: http://localhost:5173"
echo "API Documentation: http://localhost:${PORT:-3001}/api/docs"
echo ""
echo "To stop both servers, run: ./stop-local.sh"
echo ""

# Get the current directory
CURRENT_DIR=$(pwd)

# Detect terminal emulator and open separate windows
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use Terminal.app
    echo "🔧 Opening backend server in new Terminal window..."
    osascript <<EOF
tell application "Terminal"
    do script "cd '$CURRENT_DIR' && echo '🔧 CORTEGE Backend Server' && echo '=========================' && echo '' && node server/index.js"
    activate
end tell
EOF
    
    sleep 2
    
    echo "🎨 Opening frontend dev server in new Terminal window..."
    osascript <<EOF
tell application "Terminal"
    do script "cd '$CURRENT_DIR' && echo '🎨 CORTEGE Frontend Dev Server' && echo '==============================' && echo '' && npm run dev"
    activate
end tell
EOF
    
    echo ""
    echo "✅ Both servers started in separate Terminal windows"
    echo ""
    echo "Monitor the terminal windows for logs and errors."
    echo "To stop both servers, run: ./stop-local.sh"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try common terminal emulators
    if command -v gnome-terminal &> /dev/null; then
        echo "🔧 Opening backend server in new terminal..."
        gnome-terminal -- bash -c "cd '$CURRENT_DIR' && echo '🔧 CORTEGE Backend Server' && echo '=========================' && echo '' && node server/index.js; exec bash"
        
        sleep 2
        
        echo "🎨 Opening frontend dev server in new terminal..."
        gnome-terminal -- bash -c "cd '$CURRENT_DIR' && echo '🎨 CORTEGE Frontend Dev Server' && echo '==============================' && echo '' && npm run dev; exec bash"
        
    elif command -v xterm &> /dev/null; then
        echo "🔧 Opening backend server in new terminal..."
        xterm -e "cd '$CURRENT_DIR' && echo '🔧 CORTEGE Backend Server' && echo '=========================' && echo '' && node server/index.js" &
        
        sleep 2
        
        echo "🎨 Opening frontend dev server in new terminal..."
        xterm -e "cd '$CURRENT_DIR' && echo '🎨 CORTEGE Frontend Dev Server' && echo '==============================' && echo '' && npm run dev" &
        
    else
        echo "⚠️  Could not detect terminal emulator. Starting in background..."
        echo "   Check logs manually or run servers individually."
        node server/index.js > backend.log 2>&1 &
        npm run dev > frontend.log 2>&1 &
        echo "   Backend logs: tail -f backend.log"
        echo "   Frontend logs: tail -f frontend.log"
    fi
    
    echo ""
    echo "✅ Both servers started in separate terminal windows"
    echo ""
    echo "Monitor the terminal windows for logs and errors."
    echo "To stop both servers, run: ./stop-local.sh"
    
else
    echo "⚠️  Unsupported OS. Starting in background mode..."
    node server/index.js > backend.log 2>&1 &
    BACKEND_PID=$!
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    echo "Backend PID: $BACKEND_PID (logs: backend.log)"
    echo "Frontend PID: $FRONTEND_PID (logs: frontend.log)"
    echo ""
    echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
    echo "Or run: ./stop-local.sh"
fi
