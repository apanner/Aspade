#!/bin/bash

# Oracle Cloud Infrastructure Utility Scripts
# Collection of useful commands for managing your deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check service status
check_status() {
    print_header "Service Status Check"
    
    if command -v pm2 &> /dev/null; then
        print_status "PM2 processes:"
        pm2 status
        echo ""
        
        print_status "PM2 logs (last 5 lines):"
        pm2 logs --lines 5
    else
        print_error "PM2 not found"
    fi
    
    echo ""
    print_status "Port usage:"
    if command -v netstat &> /dev/null; then
        netstat -tlpn | grep -E ':300[01]'
    else
        ss -tlpn | grep -E ':300[01]'
    fi
    
    echo ""
    print_status "Memory usage:"
    free -h
    
    echo ""
    print_status "Disk usage:"
    df -h /
}

# Function to view logs
view_logs() {
    print_header "Application Logs"
    
    if [ "$1" = "backend" ]; then
        print_status "Backend logs:"
        pm2 logs aspade-backend --lines 20
    elif [ "$1" = "frontend" ]; then
        print_status "Frontend logs:"
        pm2 logs aspade-frontend --lines 20
    else
        print_status "All logs:"
        pm2 logs --lines 20
    fi
}

# Function to restart services
restart_services() {
    print_header "Restarting Services"
    
    if [ "$1" = "backend" ]; then
        print_status "Restarting backend..."
        pm2 restart aspade-backend
    elif [ "$1" = "frontend" ]; then
        print_status "Restarting frontend..."
        pm2 restart aspade-frontend
    else
        print_status "Restarting all services..."
        pm2 restart all
    fi
    
    sleep 3
    pm2 status
}

# Function to stop services
stop_services() {
    print_header "Stopping Services"
    
    if [ "$1" = "backend" ]; then
        print_status "Stopping backend..."
        pm2 stop aspade-backend
    elif [ "$1" = "frontend" ]; then
        print_status "Stopping frontend..."
        pm2 stop aspade-frontend
    else
        print_status "Stopping all services..."
        pm2 stop all
    fi
    
    pm2 status
}

# Function to update application
update_app() {
    print_header "Updating Application"
    
    print_status "Pulling latest changes from git..."
    git pull origin master
    
    print_status "Running deployment script..."
    ./deploy-oracle-complete.sh
}

# Function to backup data
backup_data() {
    print_header "Backing Up Data"
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    print_status "Backing up data to $BACKUP_DIR..."
    cp -r data/* "$BACKUP_DIR/" 2>/dev/null || true
    cp -r logs/* "$BACKUP_DIR/" 2>/dev/null || true
    
    print_status "Creating archive..."
    tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
    rm -rf "$BACKUP_DIR"
    
    print_status "Backup created: ${BACKUP_DIR}.tar.gz"
}

# Function to monitor resources
monitor_resources() {
    print_header "Resource Monitoring"
    
    print_status "CPU and Memory usage:"
    top -bn1 | grep -E "load average|Tasks:|Cpu|Mem|Swap|PID.*COMMAND" | head -7
    
    echo ""
    print_status "Node.js processes:"
    ps aux | grep -E "node|npm" | grep -v grep
    
    echo ""
    print_status "Network connections:"
    netstat -tlpn | grep -E ':300[01]'
}

# Function to show help
show_help() {
    echo "Oracle Cloud Infrastructure Utility Scripts"
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  status              - Check service status"
    echo "  logs [service]      - View logs (backend, frontend, or all)"
    echo "  restart [service]   - Restart services (backend, frontend, or all)"
    echo "  stop [service]      - Stop services (backend, frontend, or all)"
    echo "  update              - Update application from git"
    echo "  backup              - Backup data and logs"
    echo "  monitor             - Monitor system resources"
    echo "  help                - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status           - Check all services"
    echo "  $0 logs backend     - View backend logs"
    echo "  $0 restart frontend - Restart frontend only"
    echo "  $0 update           - Update and redeploy"
}

# Main script logic
case "$1" in
    status)
        check_status
        ;;
    logs)
        view_logs "$2"
        ;;
    restart)
        restart_services "$2"
        ;;
    stop)
        stop_services "$2"
        ;;
    update)
        update_app
        ;;
    backup)
        backup_data
        ;;
    monitor)
        monitor_resources
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 