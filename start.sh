#!/bin/bash
set -e

cd "$(dirname "$0")"

# Start backend
echo "🚀 Starting backend..."
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
pnpm dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
