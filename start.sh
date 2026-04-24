#!/bin/bash

# ============================================
# AI Digital Twin Platform - Start Script
# ============================================
# This script:
# 1. Cleans up used ports
# 2. Sets up the database
# 3. Seeds data into PostgreSQL
# 4. Starts backend with hot reload
# 5. Starts frontend with hot reload
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════╗"
echo "║     AI Digital Twin Platform                 ║"
echo "║     Starting up...                           ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found! Please create one.${NC}"
    exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================
# Step 1: Clean up used ports
# ============================================
echo -e "\n${YELLOW}▸ Step 1: Cleaning up ports ${BACKEND_PORT} and ${FRONTEND_PORT}...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${CYAN}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "  ${GREEN}✓ Port $port cleared${NC}"
    else
        echo -e "  ${GREEN}✓ Port $port is already free${NC}"
    fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ============================================
# Step 2: Install dependencies
# ============================================
echo -e "\n${YELLOW}▸ Step 2: Installing dependencies...${NC}"

if [ ! -d "server/node_modules" ]; then
    echo -e "  ${CYAN}Installing server dependencies...${NC}"
    cd "$PROJECT_DIR/server" && npm install
    echo -e "  ${GREEN}✓ Server dependencies installed${NC}"
else
    echo -e "  ${GREEN}✓ Server dependencies already installed${NC}"
fi

cd "$PROJECT_DIR"

if [ ! -d "client/node_modules" ]; then
    echo -e "  ${CYAN}Installing client dependencies...${NC}"
    cd "$PROJECT_DIR/client" && npm install
    echo -e "  ${GREEN}✓ Client dependencies installed${NC}"
else
    echo -e "  ${GREEN}✓ Client dependencies already installed${NC}"
fi

cd "$PROJECT_DIR"

# ============================================
# Step 3: Setup Database
# ============================================
echo -e "\n${YELLOW}▸ Step 3: Setting up PostgreSQL database...${NC}"

DB_NAME=${DB_NAME:-ai_digital_twin}

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "  ${CYAN}Starting PostgreSQL...${NC}"
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 2
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "  ${CYAN}Creating database '$DB_NAME'...${NC}"
    createdb "$DB_NAME" 2>/dev/null || true
    echo -e "  ${GREEN}✓ Database created${NC}"
else
    echo -e "  ${GREEN}✓ Database '$DB_NAME' already exists${NC}"
fi

# ============================================
# Step 4: Seed Database
# ============================================
echo -e "\n${YELLOW}▸ Step 4: Seeding database with sample data...${NC}"

cd "$PROJECT_DIR/server"
node seed.js
echo -e "${GREEN}✓ Database seeded successfully${NC}"

cd "$PROJECT_DIR"

# ============================================
# Step 5: Start Services with Hot Reload
# ============================================
echo -e "\n${YELLOW}▸ Step 5: Starting services with hot reload...${NC}"

# Trap to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    cleanup_port $BACKEND_PORT
    cleanup_port $FRONTEND_PORT
    # Kill all child processes
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend with nodemon (hot reload)
echo -e "  ${CYAN}Starting backend on port ${BACKEND_PORT} (with nodemon hot reload)...${NC}"
cd "$PROJECT_DIR/server"
npx nodemon --watch . --ext js,json --ignore node_modules index.js &
BACKEND_PID=$!

cd "$PROJECT_DIR"

# Start frontend with Vite (hot reload built-in)
echo -e "  ${CYAN}Starting frontend on port ${FRONTEND_PORT} (with Vite HMR)...${NC}"
cd "$PROJECT_DIR/client"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!

cd "$PROJECT_DIR"

# Wait for services to start
sleep 3

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     AI Digital Twin Platform is running!     ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║  Frontend:  http://localhost:${FRONTEND_PORT}            ║"
echo "║  Backend:   http://localhost:${BACKEND_PORT}            ║"
echo "║                                              ║"
echo "║  Login:     admin@digitaltwin.com / admin123 ║"
echo "║                                              ║"
echo "║  Hot reload is active for both services.     ║"
echo "║  Press Ctrl+C to stop.                       ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for background processes
wait
