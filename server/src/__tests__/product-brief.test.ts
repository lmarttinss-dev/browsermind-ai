import {expect,it,vi} from 'vitest'
import {generateProductBrief,parseProductBrief,PRODUCT_BRIEF_PROMPT} from '../product-brief.js'
const brief={summary:'Luminária para leitura.',audience:null,characteristics:[{name:'Material',value:'Alumínio informado na descrição'}],benefits:[],concerns:[],questions:[],improvements:[],limitations:['Opiniões e perguntas não fornecidas.']}
it('preserves missing opinions and unanswered questions without fabricated counts',()=>{
 const result=parseProductBrief(JSON.stringify({...brief,questions:[{question:'É bivolt?',answer:null,evidence:'Pergunta fornecida pelo usuário'}]}))
 expect(result.benefits).toEqual([])
 expect(result.questions[0].answer).toBeNull()
 expect(PRODUCT_BRIEF_PROMPT).toContain('Não avalie vendedor')
})
it('rejects unsupported or incomplete fields',()=>{
 expect(()=>parseProductBrief(JSON.stringify({...brief,benefits:[{text:'Bom',evidence:'',frequency:12}]}))).toThrow()
 expect(()=>parseProductBrief(JSON.stringify({...brief,characteristics:null}))).toThrow()
})
it('corrects format once using the same evidence and returns server metadata',async()=>{
 const generate=vi.fn().mockResolvedValueOnce('{}').mockResolvedValueOnce(JSON.stringify(brief))
 const result=await generateProductBrief({sourceUrl:'https://example.com/produto',content:'Material: alumínio',userNotes:''},generate)
 expect(generate).toHaveBeenCalledTimes(2)
 expect(generate.mock.calls[1][0]).toContain('Material: alumínio')
 expect(result.version).toBe(1)
 expect(Number.isFinite(Date.parse(result.generatedAt))).toBe(true)
})
it('does not accept an invalid correction',async()=>{
 await expect(generateProductBrief({sourceUrl:'',content:'x',userNotes:''},vi.fn().mockResolvedValue('{}'))).rejects.toThrow()
})

it('accepts known contract envelope and normalizes optional empty values',()=>{
 const result=parseProductBrief(JSON.stringify({contract:{...brief,audience:'',questions:[{question:'É bivolt?',evidence:'Pergunta fornecida'}],benefits:[{text:'Leve',evidence:'Comprador informou que é leve'}]}}))
 expect(result.audience).toBeNull()
 expect(result.questions[0].answer).toBeNull()
 expect(result.benefits[0].frequency).toBeNull()
})
it('includes the failed field and limits in the correction request',async()=>{
 const generate=vi.fn().mockResolvedValueOnce(JSON.stringify({...brief,characteristics:[{name:'Material',value:'x'.repeat(351)}]})).mockResolvedValueOnce(JSON.stringify(brief))
 await generateProductBrief({sourceUrl:'',content:'Alumínio',userNotes:''},generate)
 const correction=JSON.parse(generate.mock.calls[1][0])
 expect(correction.correction.reason).toContain('characteristics[0]')
 expect(correction.request.limits.characteristicValue).toBe(350)
})
it('rejects missing lists and malformed JSON instead of inventing data',()=>{
 expect(()=>parseProductBrief(JSON.stringify({summary:'Produto'}))).toThrow('characteristics')
 expect(()=>parseProductBrief('{"summary":')).toThrow('JSON completo')
})
