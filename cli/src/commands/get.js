/**
 * Get Command - Fetch snippet by ID
 */

import fs from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import { fetchSnippetById } from '../lib/api.js'

export async function get(id, options) {
  const spinner = ora('Fetching snippet...').start()
  
  try {
    const snippet = await fetchSnippetById(id)
    
    if (!snippet) {
      spinner.fail(chalk.red('Snippet not found'))
      return
    }
    
    spinner.succeed(chalk.green('Snippet fetched!'))
    
    // Save to file if --output specified
    if (options.output) {
      fs.writeFileSync(options.output, snippet.code)
      console.log(chalk.green(`\n✓ Saved to: ${options.output}`))
      return
    }
    
    // Copy to clipboard if --copy specified
    if (options.copy) {
      try {
        const { execSync } = await import('child_process')
        
        // Cross-platform clipboard
        if (process.platform === 'win32') {
          execSync(`echo ${snippet.code.replace(/"/g, '\\"')} | clip`, { stdio: 'ignore' })
        } else if (process.platform === 'darwin') {
          execSync(`echo "${snippet.code}" | pbcopy`, { stdio: 'ignore' })
        } else {
          execSync(`echo "${snippet.code}" | xclip -selection clipboard`, { stdio: 'ignore' })
        }
        
        console.log(chalk.green('\n✓ Copied to clipboard!'))
      } catch (e) {
        console.log(chalk.yellow('\n⚠ Could not copy to clipboard'))
      }
    }
    
    // Display snippet info and code
    console.log('')
    console.log(chalk.gray('═'.repeat(60)))
    console.log(chalk.bold.cyan(`📝 ${snippet.title}`))
    console.log(chalk.gray('═'.repeat(60)))
    console.log(`${chalk.gray('Language:')} ${chalk.yellow(snippet.language)}`)
    console.log(`${chalk.gray('Public:')}   ${snippet.is_public ? '🌍 Yes' : '🔒 No'}`)
    if (snippet.description) {
      console.log(`${chalk.gray('Desc:')}     ${snippet.description}`)
    }
    if (snippet.tags && snippet.tags.length > 0) {
      console.log(`${chalk.gray('Tags:')}     ${snippet.tags.map(t => chalk.blue(`#${t}`)).join(' ')}`)
    }
    console.log(chalk.gray('─'.repeat(60)))
    console.log('')
    console.log(snippet.code)
    console.log('')
    console.log(chalk.gray('─'.repeat(60)))
    console.log(chalk.gray(`Stats: ❤️ ${snippet.like_count || 0} likes | 📋 ${snippet.copy_count || 0} copies`))
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch snippet'))
    console.log(chalk.red(`Error: ${error.message}`))
  }
}
