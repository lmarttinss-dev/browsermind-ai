import { describe, it, expect, vi } from "vitest";
import { PlaywrightManager } from "../playwright-manager.js";

function setup(existing = false) {
  const url = "chrome-extension://avantpro/login-panel.html";
  const page = { url: () => url, goto: vi.fn(), evaluate: vi.fn(), bringToFront: vi.fn(), close: vi.fn().mockResolvedValue(undefined) };
  const productPage = { url: () => "about:blank" };
  const context = { pages: () => existing ? [productPage, page] : [productPage], newPage: vi.fn().mockResolvedValue(page) };
  const manager = new PlaywrightManager();
  Object.assign(manager, { context, page: productPage });
  vi.spyOn(manager, "evaluateInServiceWorker").mockResolvedValue("7.38.6");
  return { manager, context, page, productPage, url };
}

describe("AvantPro official login", () => {
  it("opens and initializes login without changing the selected product page", async () => {
    const { manager, page, productPage, url } = setup();
    await manager.openAvantproLogin("avantpro");
    expect(page.goto).toHaveBeenCalledWith(url, expect.any(Object));
    expect(await manager.getPage()).toBe(productPage);
    expect(page.bringToFront).toHaveBeenCalledOnce();
    expect(manager.evaluateInServiceWorker).not.toHaveBeenCalled();
    const initialize = page.evaluate.mock.calls[0][0];
    const sendMessage = vi.fn().mockResolvedValue({ success: true, data: { started: true } });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    try {
      await initialize();
      expect(sendMessage).toHaveBeenCalledWith({ action: "AUTH_HYDRA_RETRY" });
      sendMessage.mockResolvedValue({ success: false });
      await expect(initialize()).rejects.toThrow("Não foi possível iniciar");
    } finally { vi.unstubAllGlobals(); }
  });

  it("reuses the login tab", async () => {
    const { manager, context, page } = setup(true);
    await manager.openAvantproLogin("avantpro");
    expect(context.newPage).not.toHaveBeenCalled();
    expect(page.goto).not.toHaveBeenCalled();
  });

  it("closes a new tab if login cannot start", async () => {
    const { manager, page } = setup();
    page.evaluate.mockRejectedValue(new Error("Login unavailable"));
    await expect(manager.openAvantproLogin("avantpro")).rejects.toThrow("Login unavailable");
    expect(page.close).toHaveBeenCalledOnce();
  });

  it("checks real session status and closes only a temporary extension tab", async () => {
    const { manager, page } = setup();
    page.evaluate.mockResolvedValue({ authenticated: false });
    expect(await manager.getAvantproAuthStatus("avantpro")).toEqual({ authenticated: false });
    const inspect = page.evaluate.mock.calls[0][0];
    const sendMessage = vi.fn().mockResolvedValue({ success: true, data: { authenticated: false } });
    vi.stubGlobal("chrome", { runtime: { sendMessage }, storage: { local: {
      get: vi.fn().mockResolvedValue({ avantpro_auth: { accessToken: "obsolete", email: "test@example.com" } })
    } } });
    try {
      expect(await inspect()).toMatchObject({ authenticated: false });
      expect(sendMessage).toHaveBeenCalledWith({ action: "AUTH_STATUS" });
      sendMessage.mockResolvedValue({ success: true, data: { authenticated: true } });
      expect(await inspect()).toMatchObject({ authenticated: true });
    } finally { vi.unstubAllGlobals(); }
    expect(page.close).toHaveBeenCalledOnce();
    const existing = setup(true);
    await existing.manager.getAvantproAuthStatus("avantpro");
    expect(existing.page.close).not.toHaveBeenCalled();
  });

  it("explains how to recover a stale extension worker", async () => {
    const { manager, page } = setup();
    page.evaluate.mockRejectedValue(new Error("Ação não suportada: AUTH_HYDRA_RETRY"));
    await expect(manager.openAvantproLogin("avantpro")).rejects.toThrow("Feche e inicie o Browser");
    expect(page.close).toHaveBeenCalledOnce();
  });

  it("requires a running browser", async () => {
    await expect(new PlaywrightManager().openAvantproLogin("avantpro")).rejects.toThrow("Inicie o browser");
  });
});
