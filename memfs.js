import { createFsFromVolume, Volume } from 'memfs-browser'
import { dirname, resolve, basename } from 'pathe'
import untar from 'js-untar'

export class MemfsWithPackageInstaller {
  constructor() {
    this.vol = new Volume()
    this.memfs = createFsFromVolume(this.vol)
  }

  async installPackage(packageName, version = 'latest') {
    await this.#downloadPackageToMemory(packageName, version)
  }

  getFile(path) {
    return this.vol.readFileSync(path)
  }

  writeFile(path, content) {
    this.vol.writeFileSync(path, content)
  }

  fileExists(path) {
    return this.vol.existsSync(path)
  }

  async #downloadPackageToMemory(packageName, version = 'latest') {
    try {
      const packageData = await this.#fetchPackageMetadata(packageName)
      const packageVersion = this.#resolveVersion(packageData, version)
      const tarballUrl = packageVersion.dist.tarball

      console.log(`Downloading ${packageName}@${packageVersion.version}...`)
      const files = await this.#downloadAndExtractTarball(tarballUrl)

      this.#installFiles(files, packageName)
      console.log(`Package ${packageName}@${packageVersion.version} installed successfully`)

    } catch (error) {
      console.error('Package installation failed:', error.message)
      throw error
    }
  }

  async #fetchPackageMetadata(packageName) {
    console.log(`Fetching metadata for ${packageName}...`)
    const registryUrl = `https://registry.npmjs.org/${packageName}`
    const response = await fetch(registryUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch package metadata: ${response.statusText}`)
    }

    return await response.json()
  }

  #resolveVersion(packageData, version) {
    return packageData.versions[version] ||
           packageData.versions[packageData['dist-tags'].latest]
  }

  async #downloadAndExtractTarball(tarballUrl) {
    console.log(`Downloading tarball from ${tarballUrl}...`)
    const response = await fetch(tarballUrl)

    if (!response.ok) {
      throw new Error(`Failed to download tarball: ${response.statusText}`)
    }

    const decompressed = await this.#decompressTarball(response.body)
    return await untar(decompressed)
  }

  async #decompressTarball(stream) {
    const decompressionStream = new DecompressionStream('gzip')
    const decompressedStream = stream.pipeThrough(decompressionStream)
    const response = new Response(decompressedStream)
    return await response.arrayBuffer()
  }

  #installFiles(files, packageName) {
    console.log('Installing files to memory file system...')
    const decoder = new TextDecoder('utf-8')

    files.forEach(file => {
      const content = decoder.decode(file.buffer)
      const packageDir = resolve('/', 'node_modules', packageName)
      const fileName = this.#normalizeFileName(file.name)
      const filePath = resolve(packageDir, fileName)

      this.#ensureDirectoryExists(packageDir)
      this.memfs.writeFileSync(filePath, content)
    })
  }

  #normalizeFileName(fileName) {
    return fileName.startsWith('package/') ?
           fileName.replace('package/', '') :
           basename(fileName)
  }

  #ensureDirectoryExists(dir) {
    try {
      this.memfs.mkdirSync(dir, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error('Failed to create directory:', error)
        throw error
      }
    }
  }
}
