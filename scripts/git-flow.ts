/**
 * Git Flow Helper - TypeScript Version
 * 
 * This module provides TypeScript utilities for working with the Git Flow branching model.
 * 
 * Git Flow Branching Model Overview:
 * ==================================
 * 
 * Branch Types:
 * - main: Production-ready code (always deployable, protected)
 * - develop: Integration branch for features (default development branch)
 * - feature/*: New features (branched from develop, merged back to develop)
 * - release/*: Release preparation (branched from develop, merged to main and develop)
 * - hotfix/*: Critical production fixes (branched from main, merged to main and develop)
 * 
 * Workflow:
 * 1. Features: develop -> feature/name -> develop
 * 2. Releases: develop -> release/version -> main + develop
 * 3. Hotfixes: main -> hotfix/name -> main + develop
 * 
 * Usage:
 * - Use the shell script (scripts/git-flow.sh) for command-line operations
 * - This TypeScript file provides programmatic access if needed
 */

import { execSync } from 'child_process';

/**
 * Git Flow Branch Types
 */
export enum BranchType {
    FEATURE = 'feature',
    RELEASE = 'release',
    HOTFIX = 'hotfix',
    FIX = 'fix',
    CHORE = 'chore',
    DOCS = 'docs',
    TEST = 'test',
    REFACTOR = 'refactor',
    PERF = 'perf',
    BUILD = 'build',
    CI = 'ci',
    CD = 'cd',
    VENDOR = 'vendor',
}

/**
 * Git Flow Operations
 */
export enum GitFlowOperation {
    START = 'start',
    FINISH = 'finish',
}

/**
 * Execute a git command and return the output
 */
function execGit(command: string): string {
    try {
        return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    } catch (error) {
        throw new Error(`Git command failed: ${command}`);
    }
}

/**
 * Check if a branch exists
 */
export function branchExists(branchName: string): boolean {
    try {
        execGit(`git show-ref --verify --quiet refs/heads/${branchName}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get current branch name
 */
export function getCurrentBranch(): string {
    return execGit('git rev-parse --abbrev-ref HEAD');
}

/**
 * Ensure develop branch exists, create if it doesn't
 */
export function ensureDevelopBranch(): void {
    if (!branchExists('develop')) {
        console.log('Creating develop branch from main...');
        execGit('git checkout -b develop main');
        console.log('✓ Created develop branch');
    }
}

/**
 * Start a feature branch
 * @param featureName - Name of the feature (without 'feature/' prefix)
 */
export function startFeature(featureName: string): void {
    ensureDevelopBranch();
    const branchName = `feature/${featureName}`;

    if (branchExists(branchName)) {
        throw new Error(`Feature branch ${branchName} already exists`);
    }

    execGit('git checkout develop');
    execGit(`git checkout -b ${branchName} develop`);
    console.log(`✓ Created and switched to ${branchName}`);
}

/**
 * Finish a feature branch (merge to develop and delete)
 * @param featureName - Name of the feature (without 'feature/' prefix)
 */
export function finishFeature(featureName: string): void {
    const branchName = `feature/${featureName}`;

    if (!branchExists(branchName)) {
        throw new Error(`Feature branch ${branchName} does not exist`);
    }

    execGit(`git checkout ${branchName}`);
    execGit('git checkout develop');
    execGit(`git merge --no-ff ${branchName} -m "Merge ${branchName} into develop"`);
    execGit(`git branch -d ${branchName}`);
    console.log(`✓ Merged and deleted ${branchName}`);
}

/**
 * Start a release branch
 * @param version - Version number (e.g., '1.0.0')
 */
export function startRelease(version: string): void {
    ensureDevelopBranch();
    const branchName = `release/${version}`;

    if (branchExists(branchName)) {
        throw new Error(`Release branch ${branchName} already exists`);
    }

    execGit('git checkout develop');
    execGit(`git checkout -b ${branchName} develop`);
    console.log(`✓ Created and switched to ${branchName}`);
}

/**
 * Finish a release branch (merge to main and develop, create tag)
 * @param version - Version number (e.g., '1.0.0')
 */
export function finishRelease(version: string): void {
    const branchName = `release/${version}`;

    if (!branchExists(branchName)) {
        throw new Error(`Release branch ${branchName} does not exist`);
    }

    execGit(`git checkout ${branchName}`);
    execGit('git checkout main');
    execGit(`git merge --no-ff ${branchName} -m "Release ${version}"`);
    execGit(`git tag -a v${version} -m "Release version ${version}"`);

    execGit('git checkout develop');
    execGit(`git merge --no-ff ${branchName} -m "Merge release/${version} into develop"`);
    execGit(`git branch -d ${branchName}`);
    console.log(`✓ Merged release/${version} to main and develop, created tag v${version}`);
}

/**
 * Start a hotfix branch
 * @param hotfixName - Name of the hotfix (without 'hotfix/' prefix)
 */
export function startHotfix(hotfixName: string): void {
    const branchName = `hotfix/${hotfixName}`;

    if (branchExists(branchName)) {
        throw new Error(`Hotfix branch ${branchName} already exists`);
    }

    execGit('git checkout main');
    execGit(`git checkout -b ${branchName} main`);
    console.log(`✓ Created and switched to ${branchName}`);
}

/**
 * Finish a hotfix branch (merge to main and develop)
 * @param hotfixName - Name of the hotfix (without 'hotfix/' prefix)
 */
export function finishHotfix(hotfixName: string): void {
    const branchName = `hotfix/${hotfixName}`;

    if (!branchExists(branchName)) {
        throw new Error(`Hotfix branch ${branchName} does not exist`);
    }

    execGit(`git checkout ${branchName}`);
    execGit('git checkout main');
    execGit(`git merge --no-ff ${branchName} -m "Hotfix ${hotfixName}"`);

    ensureDevelopBranch();
    execGit('git checkout develop');
    execGit(`git merge --no-ff ${branchName} -m "Merge hotfix/${hotfixName} into develop"`);
    execGit(`git branch -d ${branchName}`);
    console.log(`✓ Merged hotfix/${hotfixName} to main and develop`);
}
