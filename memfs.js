import { createFsFromVolume, Volume } from 'memfs-browser'
import { dirname, resolve, basename } from 'pathe'

import untar from 'js-untar'



export class MemfsWithPackageInstaller {
  constructor() {
    this.vol = new Volume();
    this.memfs = createFsFromVolume(this.vol);
  }

  async installPackage(packageName, version = 'latest') {
    await downloadPackageToMemory(packageName, version, this.memfs);
  }

  getFile(path) {
    const content = this.vol.readFileSync(path)
    return content
  }

  writeFile(path, content) {
    this.vol.writeFileSync(path, content)
  }

  fileExist(path) {
    return this.vol.existsSync(path)
  }

}


/**
  * @param {string} packageName - The name of the npm package to download.
  * @param {string} version - The version of the npm package to download (default is 'latest').
  * @param {import('memfs-browser').IFs} memfs - An instance of a memory file system (from memfs).
  */
async function downloadPackageToMemory(packageName, version = 'latest', memfs) {
  try {
    // 1. Get package metadata from the npm registry
    console.log(`Fetching metadata for ${packageName}@${version}...`);
    const registryUrl = `https://registry.npmjs.org/${packageName}`;
    const response = await fetch(registryUrl);
    console.log(`response: `, response)
    const packageData = await response.json();
    const packageVersion = packageData.versions[version] || packageData.versions[packageData['dist-tags'].latest];
    const tarballUrl = packageVersion.dist.tarball;

    // 2. Download the tarball
    console.log(`Downloading tarball from ${tarballUrl}...`);
    const tarballResponse = await fetch(tarballUrl, {});
    const readableBodyStream = tarballResponse.body;


    // 3. Create an in-memory directory and extract the tarball
    console.log('Extracting files to memory file system...');


    const decompressionStream = new DecompressionStream('gzip');
    const decompressedStream = readableBodyStream.pipeThrough(decompressionStream);
    // let extractStream = new WritableStream(extract);
    const response2 = new Response(decompressedStream);
    const arrayBuffer = await response2.arrayBuffer();

    const files = await untar(arrayBuffer);
    let decoder = new TextDecoder('utf-8');
    files.forEach(file => {
      debugger
      const content = decoder.decode(file.buffer)
      let dir = dirname(file.name);
      // replace `package/` prefix
      if (dir.startsWith('package/')) {
        dir = dir.replace('package/', '')
      }
      const abDir = resolve('/', 'node_modules', packageName);
      let abFile = resolve(abDir, basename(file.name));
      try {
        memfs.mkdirSync(abDir, { recursive: true });
      } catch (e) {
        console.error(e)
        throw e;
        // Directory might already exist
      }
      memfs.writeFileSync(abFile, content)
    });

    console.log(`Package ${packageName}@${packageVersion.version} downloaded and extracted to memory.`);
  } catch (error) {
    console.error('An error occurred:', error.message);
    throw error;
  }
}
