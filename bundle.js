import { resolve } from 'pathe'

export class Bundler {
  constructor(memoryfs) {
    /** @type {import('./memfs.js').MemfsWithPackageInstaller} */
    this.memoryfs = memoryfs
  }

  async build() {
    const rolldown = await import('@rolldown/browser')
    let ctx = this;
    const build = await rolldown.rolldown({
      input: {
        main: '/main.js'
      },
      cwd: '/',

      plugins: (
        {
          name: 'browser-plugin',
          resolveId(source, importer) {
            if (source[0] === '/' || source[0] === '.') {
              const p = resolve(importer || '/', '..', source)
              console.log(`p: `, p)
              return p;
            } else {
              // assume it is from 'node_modules'
              // 1. load the package.json to find the "module" field of related package
              let packageDir = resolve('/', 'node_modules', source)
              let packageJsonPath = resolve(packageDir, 'package.json')
              if (!ctx.memoryfs.fileExist(packageJsonPath)) {
                return;
              }
              const pkg = JSON.parse(ctx.memoryfs.getFile(packageJsonPath))
              const entry = pkg.module || pkg.main || 'index.js'
              const abEntryPath = resolve(packageDir, entry)
              if (!ctx.memoryfs.fileExist(abEntryPath)) {
                return;
              }
              return resolve(packageDir, entry)
            }
          },
          load(id) {
            if (ctx.memoryfs.fileExist(id)) return ctx.memoryfs.getFile(id).toString()
          }
        }
      )
    })

    const { output } = await build.generate({
      format: 'es'
    })

    return output
  }

}
