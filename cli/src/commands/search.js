/**
 * Search Command - Full-text search snippets
 */

import chalk from 'chalk'
import ora from 'ora'
import { searchSnippets } from '../lib/api.js'

export async function search(query, options) {
  if (query.length < 3) {
    console.log(chalk.yellow('⚠ Search query must be at least 3 characters'))
    return
  }
  
  const spinner = ora(`Searching for "${query}"...`).start()
  
  try {
    const snippets = await searchSnippets(query, {
      language: options.language,
      limit: options.limit,
      mine: options.mine,
      publicOnly: options.public
    })
    
    spinner.stop()
    
    if (snippets.length === 0) {
      console.log(chalk.yellow(`\n🔍 No results for "${query}"`))
      console.log(chalk.gray('Try different keywords or check spelling.'))
      return
    }
    
    // Display results
    console.log('')
    console.log(chalk.bold.cyan(`🔍 Search Results: "${query}" (${snippets.length} found)`))
    console.log(chalk.gray('─'.repeat(80)))
    
    snippets.forEach((s, i) => {
      const visibility = s.is_public ? chalk.green('🌍 Public') : chalk.gray('🔒 Private')
      
      console.log('')
      console.log(`${chalk.bold.white(`${i + 1}. ${s.title}`)}`)
      console.log(chalk.gray(`   ID: ${s.id}`))
      console.log(`   ${chalk.yellow(s.language)} | ${visibility} | ❤️ ${s.like_count || 0}`)
      
      if (s.description) {
        const desc = s.description.length > 60 ? s.description.slice(0, 60) + '...' : s.description
        console.log(chalk.gray(`   ${desc}`))
      }
      
      if (s.tags && s.tags.length > 0) {
        console.log(`   ${s.tags.map(t => chalk.blue(`#${t}`)).join(' ')}`)
      }
    })
    
    console.log('')
    console.log(chalk.gray('─'.repeat(80)))
    console.log(chalk.gray('Fetch snippet: lumbung get <id>'))
    
  } catch (error) {
    spinner.fail(chalk.red('Search failed'))
    console.log(chalk.red(`Error: ${error.message}`))
  }
}
