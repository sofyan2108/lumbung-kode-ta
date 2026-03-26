/**
 * Auth Commands - Login, Register & Logout
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { loginWithEmail, registerWithEmail } from '../lib/api.js'
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
    console.log(chalk.gray('If you don\'t have an account, run: lumbung register'))
  }
}

export async function register() {
  // Check if already logged in
  if (isLoggedIn()) {
    const { email } = getConfig()
    console.log(chalk.yellow(`Already logged in as ${chalk.bold(email)}`))
    
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to register a new account?',
      default: false
    }])
    
    if (!confirm) return
  }
  
  console.log(chalk.cyan('\n📝 Register to Lumbung Kode\n'))
  
  // Prompt for registration info
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'fullName',
      message: 'Full Name:',
      validate: (input) => {
        if (input.trim().length < 2) return 'Name must be at least 2 characters'
        return true
      }
    },
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
    },
    {
      type: 'password',
      name: 'confirmPassword',
      message: 'Confirm Password:',
      mask: '*',
      validate: (input, answers) => {
        if (input !== answers.password) return 'Passwords do not match'
        return true
      }
    }
  ])
  
  const spinner = ora('Creating account...').start()
  
  try {
    const { accessToken, refreshToken, user } = await registerWithEmail(
      answers.email, 
      answers.password,
      answers.fullName
    )
    
    if (accessToken) {
      // Auto-login after registration
      saveCredentials(accessToken, refreshToken, user.email, user.id)
      spinner.succeed(chalk.green(`Account created! Logged in as ${chalk.bold(user.email)}`))
      console.log(chalk.gray(`\nUser ID: ${user.id}`))
      console.log(chalk.gray('You are now ready to use Lumbung CLI.\n'))
    } else {
      spinner.succeed(chalk.green('Account created!'))
      console.log(chalk.yellow('\nPlease check your email to confirm your account, then run:'))
      console.log(chalk.cyan('  lumbung login\n'))
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Registration failed'))
    console.log(chalk.red(`Error: ${error.message}`))
    
    if (error.message.includes('already registered')) {
      console.log(chalk.gray('\nThis email is already registered. Run: lumbung login'))
    }
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
