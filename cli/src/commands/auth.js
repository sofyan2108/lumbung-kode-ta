/**
 * Auth Commands - Login & Logout
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { loginWithEmail } from '../lib/api.js'
import { saveCredentials, clearCredentials, isLoggedIn, getConfig } from '../lib/config.js'

export async function login() {
  // Check if already logged in
  if (isLoggedIn()) {
    const { email } = getConfig()
    console.log(chalk.yellow(`Already logged in as ${chalk.bold(email)}`))
    
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to login with a different account?',
      default: false
    }])
    
    if (!confirm) return
  }
  
  console.log(chalk.cyan('\n📧 Login to Lumbung Kode\n'))
  
  // Prompt for credentials
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      validate: (input) => {
        if (!input.includes('@')) return 'Please enter a valid email'
        return true
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*',
      validate: (input) => {
        if (input.length < 6) return 'Password must be at least 6 characters'
        return true
      }
    }
  ])
  
  const spinner = ora('Logging in...').start()
  
  try {
    const { accessToken, refreshToken, user } = await loginWithEmail(
      answers.email, 
      answers.password
    )
    
    // Save credentials locally
    saveCredentials(accessToken, refreshToken, user.email, user.id)
    
    spinner.succeed(chalk.green(`Logged in as ${chalk.bold(user.email)}`))
    console.log(chalk.gray(`\nUser ID: ${user.id}`))
    console.log(chalk.gray('Credentials saved to local config.\n'))
    
  } catch (error) {
    spinner.fail(chalk.red('Login failed'))
    console.log(chalk.red(`Error: ${error.message}`))
    console.log(chalk.gray('\nMake sure your email and password are correct.'))
    console.log(chalk.gray('If you don\'t have an account, register at https://lumbungkode.netlify.app'))
  }
}

export async function logout() {
  if (!isLoggedIn()) {
    console.log(chalk.yellow('Not logged in.'))
    return
  }
  
  const { email } = getConfig()
  
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Logout from ${email}?`,
    default: true
  }])
  
  if (confirm) {
    clearCredentials()
    console.log(chalk.green('✓ Logged out successfully.'))
  }
}


