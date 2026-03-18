#!/bin/bash

# CORTEGE Local Development Stopper
# Kills processes running on ports 3001 (backend) and 5173 (frontend)

echo "🛑 Stopping CORTEGE servers..."
echo ""

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local name=$2
    
    # Find PIDs using the port
    pids=$(lsof -ti :$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
        echo "✓ No process found on port $port ($name)"
    else
        echo "🔪 Killing process(es) on port $port ($name)..."
        echo "   PIDs: $pids"
        kill -9 $pids 2>/dev/null
        
        # Verify it's killed
        sleep 1
        if lsof -ti :$port >/dev/null 2>&1; then
            echo "⚠️  Warning: Process may still be running on port $port"
        else
            echo "✓ Successfully stopped $name"
        fi
    fi
    echo ""
}

# Kill backend (port 3001)
kill_port 3001 "Backend Server"

# Kill frontend (port 5173)
kill_port 5173 "Frontend Dev Server"

echo "=================================="
echo "✅ Cleanup complete"
echo "=================================="
