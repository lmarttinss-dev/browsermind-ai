import {afterEach,describe,expect,it,vi} from 'vitest'
import {Product} from '../models/product.js'
import {persistGeneratedMarketReport} from '../market-report-persistence.js'
import {fullDocument} from './fixtures/full-market-fixture.js'
afterEach(()=>vi.restoreAllMocks())
describe('salvamento da nova análise no produto',()=>{
 it('persiste o documento e o texto antes de confirmar o produto salvo',async()=>{
  const save=vi.spyOn(Product,'findByIdAndUpdate').mockResolvedValue({_id:'produto'} as any)
  const result=await persistGeneratedMarketReport('produto',fullDocument)
  expect(result).toEqual({savedProductId:'produto',marketSaveError:null})
  const [id,update]=save.mock.calls[0] as any
  expect(id).toBe('produto');expect(update.$set.marketDocument.sections).toHaveLength(17);expect(update.$set.marketReport).toContain('Análise de Frete')
 })
 it('mantém a análise disponível e informa a falha quando o banco não salva',async()=>{
  vi.spyOn(Product,'findByIdAndUpdate').mockRejectedValue(new Error('Falha no banco'))
  expect(await persistGeneratedMarketReport('produto',fullDocument)).toMatchObject({savedProductId:null,marketSaveError:expect.stringContaining('não foi possível')})
 })
 it('não confirma sucesso para um produto removido durante a geração',async()=>{
  vi.spyOn(Product,'findByIdAndUpdate').mockResolvedValue(null)
  expect(await persistGeneratedMarketReport('produto',fullDocument)).toMatchObject({savedProductId:null,marketSaveError:expect.stringContaining('não foi encontrado')})
 })
 it('mantém análise sem vínculo sem gravar em produto arbitrário',async()=>{
  const save=vi.spyOn(Product,'findByIdAndUpdate')
  expect(await persistGeneratedMarketReport(undefined,fullDocument)).toEqual({savedProductId:null,marketSaveError:null})
  expect(save).not.toHaveBeenCalled()
 })
})
