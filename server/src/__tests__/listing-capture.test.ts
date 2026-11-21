import {expect,it,vi} from 'vitest'
import {PlaywrightManager} from '../playwright-manager.js'
it.each(['https://www.mercadolivre.com.br/vendas','https://www.mercadolivre.com.br/minha-conta','https://myaccount.mercadolivre.com.br/p/MLB123','https://example.com/MLB-123'])('rejects non-public listing before reading page %s',async url=>{
 const manager=new PlaywrightManager()
 const evaluate=vi.fn()
 vi.spyOn(manager,'getPage').mockResolvedValue({url:()=>url,evaluate} as any)
 await expect(manager.captureAvantproListing()).rejects.toThrow('página pública')
 expect(evaluate).not.toHaveBeenCalled()
})
it('does not extract when AvantPro requires authentication',async()=>{
 const manager=new PlaywrightManager()
 const evaluate=vi.fn()
 vi.spyOn(manager,'getPage').mockResolvedValue({url:()=> 'https://www.mercadolivre.com.br/produto/p/MLB123',evaluate} as any)
 vi.spyOn(manager,'waitForAvantproData').mockResolvedValue('not_authenticated')
 await expect(manager.captureAvantproListing()).rejects.toThrow('Autentique')
 expect(evaluate).not.toHaveBeenCalled()
})
