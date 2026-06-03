import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"

// Acessa o método privado via instância para teste
import { PlaywrightManager } from "../playwright-manager.js"

describe("resolveExtensionPath", () => {
  let tmpDir: string
  let manager: PlaywrightManager

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ext-test-"))
    manager = new PlaywrightManager()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  // Acessa método privado para teste unitário
  const resolve = (mgr: PlaywrightManager, extPath: string) =>
    (mgr as any).resolveExtensionPath(extPath)

  it("deve retornar o path direto se manifest.json existe", () => {
    const extDir = path.join(tmpDir, "7.2.1_0")
    fs.mkdirSync(extDir, { recursive: true })
    fs.writeFileSync(path.join(extDir, "manifest.json"), "{}")

    const result = resolve(manager, extDir)
    expect(result).toBe(extDir)
  })

  it("deve resolver para a versão mais recente se path original não existe", () => {
    const extensionId = "jdefnfmbnchmnjkcknaadaddgjbgephh"
    const extBase = path.join(tmpDir, extensionId)
    fs.mkdirSync(extBase, { recursive: true })

    // Cria múltiplas versões
    const v1 = path.join(extBase, "7.1.0_0")
    const v2 = path.join(extBase, "7.2.1_0")
    const v3 = path.join(extBase, "7.3.0_0")
    fs.mkdirSync(v1)
    fs.mkdirSync(v2)
    fs.mkdirSync(v3)
    fs.writeFileSync(path.join(v1, "manifest.json"), "{}")
    fs.writeFileSync(path.join(v2, "manifest.json"), "{}")
    fs.writeFileSync(path.join(v3, "manifest.json"), "{}")

    // Path antigo que não existe mais
    const oldPath = path.join(extBase, "7.0.0_0")
    const result = resolve(manager, oldPath)

    expect(result).toBe(v3)
  })

  it("deve retornar null se diretório pai não existe", () => {
    const fakePath = path.join(tmpDir, "nao-existe", "subdir", "1.0.0_0")
    const result = resolve(manager, fakePath)
    expect(result).toBeNull()
  })

  it("deve retornar null se nenhum subdiretório tem manifest.json", () => {
    const extBase = path.join(tmpDir, "ext-vazio")
    fs.mkdirSync(extBase, { recursive: true })

    // Cria diretório sem manifest
    const v1 = path.join(extBase, "1.0.0_0")
    fs.mkdirSync(v1)

    const badPath = path.join(extBase, "0.9.0_0")
    const result = resolve(manager, badPath)
    expect(result).toBeNull()
  })

  it("deve ordenar corretamente versões com números maiores", () => {
    const extBase = path.join(tmpDir, "ext-sort")
    fs.mkdirSync(extBase, { recursive: true })

    const versions = ["1.0.0_0", "2.0.0_0", "1.9.9_0", "10.0.0_0", "2.1.0_0"]
    for (const v of versions) {
      const dir = path.join(extBase, v)
      fs.mkdirSync(dir)
      fs.writeFileSync(path.join(dir, "manifest.json"), "{}")
    }

    const oldPath = path.join(extBase, "0.1.0_0")
    const result = resolve(manager, oldPath)
    expect(result).toBe(path.join(extBase, "10.0.0_0"))
  })

  it("deve ignorar diretórios sem manifest.json na resolução", () => {
    const extBase = path.join(tmpDir, "ext-mixed")
    fs.mkdirSync(extBase, { recursive: true })

    // Versão com manifest
    const v1 = path.join(extBase, "2.0.0_0")
    fs.mkdirSync(v1)
    fs.writeFileSync(path.join(v1, "manifest.json"), "{}")

    // Versão mais nova SEM manifest (diretório corrompido)
    const v2 = path.join(extBase, "3.0.0_0")
    fs.mkdirSync(v2)

    const oldPath = path.join(extBase, "1.0.0_0")
    const result = resolve(manager, oldPath)
    expect(result).toBe(v1)
  })

  it("deve expandir ~ para HOME", () => {
    const home = process.env.HOME || "/tmp"
    const extDir = path.join(home, ".test-ext-resolve")
    fs.mkdirSync(extDir, { recursive: true })
    fs.writeFileSync(path.join(extDir, "manifest.json"), "{}")

    try {
      const result = resolve(manager, "~/.test-ext-resolve")
      expect(result).toBe(extDir)
    } finally {
      fs.rmSync(extDir, { recursive: true, force: true })
    }
  })

  it("deve retornar null para path vazio após trim", () => {
    const result = resolve(manager, "   ")
    expect(result).toBeNull()
  })
})
