/**
 * List Command - List user snippets
 */

import chalk from 'chalk'
import ora from 'ora'
import { fetchMySnippets } from '../lib/api.js'
import { isLoggedIn } from '../lib/config.js'

export async function list(options) {
  // Check login
  if (!isLoggedIn()) {
    console.log(chalk.red('✗ Not logged in. Run: codehaven login'))
    return
  }
  
  const spinner = ora('Fetching your snippets...').start()
  
  try {
    const snippets = await fetchMySnippets({
      language: options.language,
      limit: options.limit,
      isPublic: options.public ? true : undefined
    })
    
    spinner.stop()
    
    if (snippets.length === 0) {
      console.log(chalk.yellow('\n📭 No snippets found.'))
      console.log(chalk.gray('Create your first snippet: codehaven push <file>'))
      return
    }
    
    // JSON output
    if (options.json) {
      console.log(JSON.stringify(snippets, null, 2))
      return
    }
    
    // Table output
    console.log('')
    console.log(chalk.bold.cyan(`📚 Your Snippets (${snippets.length})`))
    console.log(chalk.gray('─'.repeat(80)))
    console.log(
      chalk.gray('ID'.padEnd(38)) +
      chalk.gray('Title'.padEnd(25)) +
      chalk.gray('Lang'.padEnd(12)) +
      chalk.gray('Vis')
    )
    console.log(chalk.gray('─'.repeat(80)))
    
    snippets.forEach(s => {
      const visibility = s.is_public ? chalk.green('🌍') : chalk.gray('🔒')
      const truncatedTitle = s.title.length > 22 ? s.title.slice(0, 22) + '...' : s.title
      
      console.log(
        chalk.gray(s.id.padEnd(38)) +
        chalk.white(truncatedTitle.padEnd(25)) +
        chalk.yellow(s.language.padEnd(12)) +
        visibility
      )
    })
    
    console.log(chalk.gray('─'.repeat(80)))
    console.log(chalk.gray(`\nShowing ${snippets.length} snippets. Use --limit to see more.`))
    console.log(chalk.gray('View snippet: lumbung get <id>'))
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch snippets'))
    console.log(chalk.red(`Error: ${error.message}`))
  }
}

