import './style.css'
import { Bundler } from './bundle.js'
import { MemfsWithPackageInstaller } from './memfs.js'

const memfs = new MemfsWithPackageInstaller()


const inputElement = document.querySelector('#input')
const bundleButton = document.querySelector('#bundle')
const installButton = document.querySelector('#install')
const outputElement = document.querySelector('#output')

// Default example code
inputElement.value = `export function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('Rolldown'))`

bundleButton.addEventListener('click', async () => {
  try {
    bundleButton.disabled = true
    bundleButton.textContent = 'Bundling...'
    outputElement.innerHTML = '<p>Processing...</p>'
    memfs.writeFile('/main.js', inputElement.value)
    console.log(`memfs.getFile('/main.js'): `, memfs.getFile('/main.js'))
    let bundler = new Bundler(memfs)
    const output = await bundler.build(); 


    const bundledCode = output[0].code

    outputElement.innerHTML = `
      <h3>Bundled Output:</h3>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>${bundledCode}</code></pre>
    `
  } catch (error) {
    console.log(`error: `, error)
    outputElement.innerHTML = `
      <h3>Error:</h3>
      <pre style="background: #ffe6e6; padding: 10px; border-radius: 4px; color: #d00;"><code>${error.message}</code></pre>
    `
  } finally {
    bundleButton.disabled = false
    bundleButton.textContent = 'Bundle with Rolldown'
  }
})

installButton.addEventListener('click', async () => {
  const packageName = prompt('Enter package name to install (leave blank to cancel):')
  
  if (!packageName || packageName.trim() === '') {
    return
  }

  try {
    installButton.disabled = true
    installButton.textContent = 'Installing...'
    outputElement.innerHTML = '<p>Installing package...</p>'
    
    await memfs.installPackage(packageName.trim())
    
    outputElement.innerHTML = `
      <h3>Package Installed Successfully:</h3>
      <p style="background: #e6ffe6; padding: 10px; border-radius: 4px; color: #008000;">Package "${packageName.trim()}" has been installed and is now available in your code.</p>
    `
  } catch (error) {
    console.log(`Installation error: `, error)
    outputElement.innerHTML = `
      <h3>Installation Error:</h3>
      <pre style="background: #ffe6e6; padding: 10px; border-radius: 4px; color: #d00;"><code>${error.message}</code></pre>
    `
  } finally {
    installButton.disabled = false
    installButton.textContent = 'Install Package'
  }
})
