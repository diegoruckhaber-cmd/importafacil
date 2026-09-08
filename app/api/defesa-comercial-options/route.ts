import { NextResponse } from "next/server";
import { listDefenseCommercialExporters } from "../../../lib/defesa-comercial-registry";
export async function GET(request: Request) {
  const url = new URL(request.url); const ncm=url.searchParams.get("ncm")??""; const origin=url.searchParams.get("origin")??""; const date=url.searchParams.get("date")??""; const result=listDefenseCommercialExporters(ncm,origin,date);
  if(!result)return NextResponse.json({applicable:false,options:[],requiresValidation:false},{headers:{"Cache-Control":"no-store"}});
  const measure=result.measure as typeof result.measure & {sourceUrl?:string;requiresScopeValidation?:boolean;scopeCondition?:string};
  const requiresValidation=Boolean(measure.requiresScopeValidation)||result.options.length===0;
  const warning=measure.requiresScopeValidation?(measure.scopeCondition?`A medida foi identificada, mas sua aplicação depende de validação do escopo do produto: ${measure.scopeCondition}`:"A medida foi identificada, mas sua aplicação depende de validação adicional do escopo do produto."):(result.options.length===0?"Medida de defesa comercial identificada, mas o tratamento por produtor/exportador não foi extraído automaticamente. Valide a fonte oficial antes de concluir o cálculo.":null);
  return NextResponse.json({applicable:true,requiresValidation,warning,measure:{ncm:measure.ncm,product:measure.product,type:measure.measure,legalFoundation:measure.legalFoundation,source:measure.source,sourceUrl:measure.sourceUrl,validityNote:measure.validityNote,requiresScopeValidation:Boolean(measure.requiresScopeValidation),scopeCondition:measure.scopeCondition},options:result.options},{headers:{"Cache-Control":"no-store"}});
}
