/**
 * Git Integration - Local Git Operations
 * Execute git commands locally for autonomous agents
 */

import { ollama } from './ollama-client'

interface GitCommit {
  files: string[]
  message: string
  author?: string
}

interface GitBranch {
  name: string
  current: boolean
}

class GitIntegration {
  private repoPath: string

  constructor(repoPath = '.') {
    this.repoPath = repoPath
  }

  async status(): Promise<string> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('git status --short', { cwd: this.repoPath }, (err, stdout) => {
        resolve(err ? '' : stdout)
      })
    })
  }

  async diff(file?: string): Promise<string> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      const cmd = file ? `git diff ${file}` : 'git diff'
      exec(cmd, { cwd: this.repoPath }, (err, stdout) => {
        resolve(err ? '' : stdout)
      })
    })
  }

  async branch(): Promise<GitBranch[]> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('git branch', { cwd: this.repoPath }, (err, stdout) => {
        if (err) resolve([])
        const branches = stdout.split('\n')
          .filter(Boolean)
          .map(b => ({
            name: b.replace(/^\*?\s*/, ''),
            current: b.startsWith('*')
          }))
        resolve(branches)
      })
    })
  }

  async log(limit = 10): Promise<Array<{ hash: string; message: string; author: string }>> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec(`git log -${limit} --format="%H|%s|%an"`, { cwd: this.repoPath }, (err, stdout) => {
        if (err) resolve([])
        const commits = stdout.split('\n')
          .filter(Boolean)
          .map(line => {
            const [hash, message, author] = line.split('|')
            return { hash, message, author }
          })
        resolve(commits)
      })
    })
  }

  async add(files: string | string[]): Promise<boolean> {
    const { exec } = await import('child_process')
    const fileList = Array.isArray(files) ? files.join(' ') : files
    return new Promise(resolve => {
      exec(`git add ${fileList}`, { cwd: this.repoPath }, (err) => {
        resolve(!err)
      })
    })
  }

  async commit(message: string, author?: string): Promise<{ success: boolean; hash?: string }> {
    const { exec } = await import('child_process')
    const authorFlag = author ? `--author="${author}"` : ''
    return new Promise(resolve => {
      exec(`git commit -m "${message}" ${authorFlag}`, { cwd: this.repoPath }, (err, stdout, stderr) => {
        if (err) resolve({ success: false })
        const hash = stdout.match(/\[([a-f0-9]+)\]/)?.[1]
        resolve({ success: true, hash })
      })
    })
  }

  async push(remote = 'origin', branch = 'main'): Promise<boolean> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec(`git push ${remote} ${branch}`, { cwd: this.repoPath }, (err) => {
        resolve(!err)
      })
    })
  }

  async pull(remote = 'origin', branch = 'main'): Promise<boolean> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec(`git pull ${remote} ${branch}`, { cwd: this.repoPath }, (err) => {
        resolve(!err)
      })
    })
  }

  async aiCommit(message?: string): Promise<string> {
    const status = await this.status()
    const diff = await this.diff()

    if (!status.trim()) return 'No changes to commit'

    const prompt = `Analyze these git changes and suggest a good commit message:

Changed files:
${status}

Diff:
${diff.slice(0, 2000)}

Write a concise commit message (max 72 characters):`

    const suggested = await ollama.chat([
      { role: 'system', content: 'You are a git expert. Write concise commit messages.' },
      { role: 'user', content: prompt }
    ])

    return message || suggested.slice(0, 72)
  }
}

export const gitIntegration = new GitIntegration()