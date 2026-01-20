#!/bin/bash

# Git Flow Helper Script
# This script provides helper functions for the Git Flow branching model
# 
# Git Flow Branching Model:
# - main: Production-ready code (always deployable)
# - develop: Integration branch for features (default development branch)
# - feature/*: New features (branched from develop, merged back to develop)
# - release/*: Release preparation (branched from develop, merged to main and develop)
# - hotfix/*: Critical production fixes (branched from main, merged to main and develop)
#
# Usage examples:
#   ./scripts/git-flow.sh feature start my-feature
#   ./scripts/git-flow.sh feature finish my-feature
#   ./scripts/git-flow.sh release start 1.0.0
#   ./scripts/git-flow.sh hotfix start critical-bug

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Ensure we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository"
    exit 1
fi

# Ensure develop branch exists
ensure_develop() {
    if ! git show-ref --verify --quiet refs/heads/develop; then
        print_warn "develop branch does not exist. Creating it from main..."
        git checkout -b develop main
        print_info "Created develop branch"
    fi
}

# Start a feature branch
# Usage: feature start <feature-name>
feature_start() {
    local feature_name=$1
    if [ -z "$feature_name" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 feature start <feature-name>"
        exit 1
    fi
    
    ensure_develop
    git checkout develop
    git pull origin develop 2>/dev/null || true
    git checkout -b "feature/$feature_name" develop
    print_info "Created and switched to feature/$feature_name"
}

# Finish a feature branch
# Usage: feature finish <feature-name>
feature_finish() {
    local feature_name=$1
    if [ -z "$feature_name" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 feature finish <feature-name>"
        exit 1
    fi
    
    local branch="feature/$feature_name"
    if ! git show-ref --verify --quiet refs/heads/$branch; then
        print_error "Branch $branch does not exist"
        exit 1
    fi
    
    git checkout $branch
    git checkout develop
    git merge --no-ff $branch -m "Merge feature/$feature_name into develop"
    git branch -d $branch
    print_info "Merged and deleted $branch"
}

# Start a release branch
# Usage: release start <version>
release_start() {
    local version=$1
    if [ -z "$version" ]; then
        print_error "Version is required"
        echo "Usage: $0 release start <version>"
        exit 1
    fi
    
    ensure_develop
    git checkout develop
    git pull origin develop 2>/dev/null || true
    git checkout -b "release/$version" develop
    print_info "Created and switched to release/$version"
}

# Finish a release branch
# Usage: release finish <version>
release_finish() {
    local version=$1
    if [ -z "$version" ]; then
        print_error "Version is required"
        echo "Usage: $0 release finish <version>"
        exit 1
    fi
    
    local branch="release/$version"
    if ! git show-ref --verify --quiet refs/heads/$branch; then
        print_error "Branch $branch does not exist"
        exit 1
    fi
    
    git checkout $branch
    git checkout main
    git merge --no-ff $branch -m "Release $version"
    git tag -a "v$version" -m "Release version $version"
    
    git checkout develop
    git merge --no-ff $branch -m "Merge release/$version into develop"
    
    git branch -d $branch
    print_info "Merged release/$version to main and develop, created tag v$version"
}

# Start a hotfix branch
# Usage: hotfix start <hotfix-name>
hotfix_start() {
    local hotfix_name=$1
    if [ -z "$hotfix_name" ]; then
        print_error "Hotfix name is required"
        echo "Usage: $0 hotfix start <hotfix-name>"
        exit 1
    fi
    
    git checkout main
    git pull origin main 2>/dev/null || true
    git checkout -b "hotfix/$hotfix_name" main
    print_info "Created and switched to hotfix/$hotfix_name"
}

# Finish a hotfix branch
# Usage: hotfix finish <hotfix-name>
hotfix_finish() {
    local hotfix_name=$1
    if [ -z "$hotfix_name" ]; then
        print_error "Hotfix name is required"
        echo "Usage: $0 hotfix finish <hotfix-name>"
        exit 1
    fi
    
    local branch="hotfix/$hotfix_name"
    if ! git show-ref --verify --quiet refs/heads/$branch; then
        print_error "Branch $branch does not exist"
        exit 1
    fi
    
    git checkout $branch
    git checkout main
    git merge --no-ff $branch -m "Hotfix $hotfix_name"
    
    ensure_develop
    git checkout develop
    git merge --no-ff $branch -m "Merge hotfix/$hotfix_name into develop"
    
    git branch -d $branch
    print_info "Merged hotfix/$hotfix_name to main and develop"
}

# Main command handler
case "$1" in
    feature)
        case "$2" in
            start)
                feature_start "$3"
                ;;
            finish)
                feature_finish "$3"
                ;;
            *)
                print_error "Unknown feature command: $2"
                echo "Usage: $0 feature {start|finish} <name>"
                exit 1
                ;;
        esac
        ;;
    release)
        case "$2" in
            start)
                release_start "$3"
                ;;
            finish)
                release_finish "$3"
                ;;
            *)
                print_error "Unknown release command: $2"
                echo "Usage: $0 release {start|finish} <version>"
                exit 1
                ;;
        esac
        ;;
    hotfix)
        case "$2" in
            start)
                hotfix_start "$3"
                ;;
            finish)
                hotfix_finish "$3"
                ;;
            *)
                print_error "Unknown hotfix command: $2"
                echo "Usage: $0 hotfix {start|finish} <name>"
                exit 1
                ;;
        esac
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Usage: $0 {feature|release|hotfix} {start|finish} <name>"
        exit 1
        ;;
esac
