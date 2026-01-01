#!/usr/bin/env node

/**
 * CodeHaven CLI - Command Line Interface for CodeHaven Snippet Manager
 * 
 * Usage:
 *   codehaven login              Login to your account
 *   codehaven push <file>        Upload a snippet from file
 *   codehaven get <id>           Fetch a snippet by ID
 *   codehaven list               List your snippets
 *   codehaven search <query>     Search snippets
 *   codehaven logout             Logout from your account
 * 
 * Run 'codehaven --help' for more information.
 */

import { program } from 'commander'
import chalk from 'chalk'
import { login, logout } from '../src/commands/auth.js'
import { push } from '../src/commands/push.js'
import { get } from '../src/commands/get.js'
import { list } from '../src/commands/list.js'
import { search } from '../src/commands/search.js'
import { getConfig } from '../src/lib/config.js'

// ASCII Art Banner
const banner = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║   ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗ █████╗ ██╗   ██╗███████╗███╗   ██╗  ║
║  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║   ██║██╔════╝████╗  ██║  ║
║  ██║     ██║   ██║██║  ██║█████╗  ███████║███████║██║   ██║█████╗  ██╔██╗ ██║  ║
║  ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██║██╔══██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║  ║
║  ╚██████╗╚██████╔╝██████╔╝███████╗██║  ██║██║  ██║ ╚████╔╝ ███████╗██║ ╚████║  ║
║   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝  ║
║                                                                                ║
║                       Modern Snippet Manager - CLI Tool                        ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
`

program
  .name('codehaven')
  .description('CLI tool for CodeHaven - Modern Snippet Manager')
  .version('1.0.0')
  .hook('preAction', (thisCommand) => {
    // Only show banner for main help
    if (thisCommand.args.length === 0 && !process.argv.slice(2).length) {
      console.log(chalk.cyan(banner))
    }
  })

// Login command
program
  .command('login')
  .description('Login to your CodeHaven account')
  .action(login)

// Logout command
program
  .command('logout')
  .description('Logout from your account')
  .action(logout)

// Push command
program
  .command('push <file>')
  .description('Upload a snippet from a file')
  .option('-t, --title <title>', 'Snippet title (auto-detected if not provided)')
  .option('-l, --language <language>', 'Programming language (auto-detected from extension)')
  .option('-d, --description <description>', 'Snippet description')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--public', 'Make snippet public', false)
  .action(push)

// Get command
program
  .command('get <id>')
  .description('Fetch a snippet by ID')
  .option('-o, --output <file>', 'Save to file')
  .option('-c, --copy', 'Copy to clipboard')
  .action(get)

// List command
program
  .command('list')
  .description('List your snippets')
  .option('-l, --language <language>', 'Filter by language')
  .option('-n, --limit <number>', 'Limit results', '10')
  .option('--public', 'Show only public snippets')
  .option('--json', 'Output as JSON')
  .action(list)

// Search command
program
  .command('search <query>')
  .description('Search snippets using full-text search')
  .option('-l, --language <language>', 'Filter by language')
  .option('-n, --limit <number>', 'Limit results', '10')
  .option('--mine', 'Search only my snippets')
  .option('--public', 'Search only public snippets')
  .action(search)

// Whoami command (check login status)
program
  .command('whoami')
  .description('Show current logged in user')
  .action(() => {
    const config = getConfig()
    if (config.email) {
      console.log(chalk.green(`✓ Logged in as: ${chalk.bold(config.email)}`))
    } else {
      console.log(chalk.yellow('Not logged in. Run: codehaven login'))
    }
  })

// Parse and execute
program.parse()
