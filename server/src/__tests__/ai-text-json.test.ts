import {beforeEach,describe,expect,it,vi} from 'vitest'
vi.mock('../deepseek-client.js',()=>({postDeepSeek:vi.fn()}))
import {postDeepSeek} from '../deepseek-client.js'
import {generateText} from '../ai-text.js'
describe('DeepSeek JSON para relatório estruturado',()=>{
 beforeEach(()=>vi.clearAllMocks())
 it('solicita JSON nativo somente quando o contrato exige JSON',async()=>{
  vi.mocked(postDeepSeek).mockResolvedValue({data:{choices:[{message:{content:'{}'},finish_reason:'stop'}]}} as any)
  await generateText('deepseek-pro','JSON contrato', {keys:{deepseek:'test-key'},system:'JSON',jsonOutput:true})
  expect(postDeepSeek).toHaveBeenCalledWith(expect.objectContaining({model:'deepseek-v4-pro',max_tokens:32768,reasoning_effort:'low',response_format:{type:'json_object'}}),'test-key',{maxAttempts:1})
  vi.clearAllMocks()
  await generateText('deepseek-pro','Texto livre', {keys:{deepseek:'test-key'},system:'Texto'})
  expect(vi.mocked(postDeepSeek).mock.calls[0][0]).not.toHaveProperty('response_format')
  expect(vi.mocked(postDeepSeek).mock.calls[0][0]).not.toHaveProperty('reasoning_effort')
  expect(vi.mocked(postDeepSeek).mock.calls[0][0].max_tokens).toBe(16384)
 })
 it('informa o consumo retornado pelo provedor sem enviar novas chamadas',async()=>{
  const onUsage=vi.fn()
  vi.mocked(postDeepSeek).mockResolvedValue({data:{choices:[{message:{content:'{}'},finish_reason:'stop'}],usage:{prompt_tokens:1200,completion_tokens:300,prompt_cache_hit_tokens:700,completion_tokens_details:{reasoning_tokens:100}}}} as any)
  await generateText('deepseek-pro','JSON',{keys:{deepseek:'test-key'},system:'JSON',jsonOutput:true,onUsage})
  expect(onUsage).toHaveBeenCalledWith({inputTokens:1200,outputTokens:300,cachedInputTokens:700,reasoningTokens:100})
  expect(postDeepSeek).toHaveBeenCalledTimes(1)
 })
 it('devolve resposta vazia ao validador para a correção automática',async()=>{
  vi.mocked(postDeepSeek).mockResolvedValue({data:{choices:[{message:{content:''},finish_reason:'stop'}]}} as any)
  expect(await generateText('deepseek-pro','JSON',{keys:{deepseek:'test-key'},system:'JSON',jsonOutput:true})).toBe('')
 })
 it('não concatena dois objetos JSON quando uma resposta é truncada',async()=>{
  vi.mocked(postDeepSeek).mockResolvedValue({data:{choices:[{message:{content:'{"category":'},finish_reason:'length'}]}} as any)
  expect(await generateText('deepseek-pro','JSON', {keys:{deepseek:'test-key'},system:'JSON',jsonOutput:true})).toBe('{"category":')
  expect(postDeepSeek).toHaveBeenCalledTimes(1)
 })
})
