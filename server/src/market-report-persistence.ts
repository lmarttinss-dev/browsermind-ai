import {Product} from './models/product.js'
import {fullMarketDocumentText,validateFullMarketDocument,type FullMarketDocument} from './full-market-report.js'
export async function persistGeneratedMarketReport(productId:string|undefined,document:FullMarketDocument) {
  if(!productId)return {savedProductId:null,marketSaveError:null}
  try{
    const validated=validateFullMarketDocument(document)
    const product=await Product.findByIdAndUpdate(productId,{$set:{marketDocument:validated,marketReport:fullMarketDocumentText(validated)}},{new:true})
    if(!product)return {savedProductId:null,marketSaveError:'A análise foi gerada, mas o produto selecionado não foi encontrado. Salve novamente em um produto existente.'}
    return {savedProductId:productId,marketSaveError:null}
  }catch{
    return {savedProductId:null,marketSaveError:'A análise foi gerada, mas não foi possível salvá-la no produto. O resultado foi preservado na tela; tente salvar novamente.'}
  }
}
