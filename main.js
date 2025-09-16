import './style.css'
import { Bundler } from './bundle.js'
import { MemfsWithPackageInstaller } from './memfs.js'

class RolldownDemo {
  constructor() {
    this.memfs = new MemfsWithPackageInstaller()
    this.initializeElements()
    this.setupEventListeners()
    this.setDefaultCode()
  }

  initializeElements() {
    this.inputElement = document.querySelector('#input')
    this.bundleButton = document.querySelector('#bundle')
    this.installButton = document.querySelector('#install')
    this.outputElement = document.querySelector('#output')
  }

  setDefaultCode() {
    this.inputElement.value = `export function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('Rolldown'))`
  }

  setupEventListeners() {
    this.bundleButton.addEventListener('click', () => this.handleBundle())
    this.installButton.addEventListener('click', () => this.handleInstall())
  }

  async handleBundle() {
    try {
      this.setBundleButtonState(true, 'Bundling...')
      this.setOutput('<p>Processing...</p>')

      this.memfs.writeFile('/main.js', this.inputElement.value)
      const bundler = new Bundler(this.memfs)
      const output = await bundler.build()

      const bundledCode = output[0].code
      this.displayBundleSuccess(bundledCode)

    } catch (error) {
      console.error('Bundle error:', error)
      this.displayError('Error:', error.message)
    } finally {
      this.setBundleButtonState(false, 'Bundle with Rolldown')
    }
  }

  async handleInstall() {
    const packageName = prompt('Enter package name to install (leave blank to cancel):')

    if (!packageName?.trim()) {
      return
    }

    try {
      this.setInstallButtonState(true, 'Installing...')
      this.setOutput('<p>Installing package...</p>')

      await this.memfs.installPackage(packageName.trim())
      this.displayInstallSuccess(packageName.trim())

    } catch (error) {
      console.error('Installation error:', error)
      this.displayError('Installation Error:', error.message)
    } finally {
      this.setInstallButtonState(false, 'Install Package')
    }
  }

  setBundleButtonState(disabled, text) {
    this.bundleButton.disabled = disabled
    this.bundleButton.textContent = text
  }

  setInstallButtonState(disabled, text) {
    this.installButton.disabled = disabled
    this.installButton.textContent = text
  }

  setOutput(html) {
    this.outputElement.innerHTML = html
  }

  displayBundleSuccess(code) {
    this.setOutput(`
      <h3>Bundled Output:</h3>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>${code}</code></pre>
    `)
  }

  displayInstallSuccess(packageName) {
    this.setOutput(`
      <h3>Package Installed Successfully:</h3>
      <p style="background: #e6ffe6; padding: 10px; border-radius: 4px; color: #008000;">Package "${packageName}" has been installed and is now available in your code.</p>
    `)
  }

  displayError(title, message) {
    this.setOutput(`
      <h3>${title}</h3>
      <pre style="background: #ffe6e6; padding: 10px; border-radius: 4px; color: #d00;"><code>${message}</code></pre>
    `)
  }
}

new RolldownDemo()
