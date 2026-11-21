import type { PipelineStage } from "@/lib/api";
export const STAGES: PipelineStage[] = ["triagem", "analise", "aprovado", "importando", "concluido"];
export const STAGE_INFO = {
 triagem: { label: "Triagem", hint: "Descubra o que merece atenção", color: "#91b9ee", empty: "Reúna suas próximas oportunidades." },
 analise: { label: "Em análise", hint: "Valide demanda e viabilidade", color: "#e4c28b", empty: "Mova um produto para investigar seu potencial." },
 aprovado: { label: "Aprovado", hint: "Pronto para o próximo passo", color: "#a3e6cb", empty: "Suas oportunidades validadas ficam aqui." },
 importando: { label: "Importando", hint: "Acompanhe sua operação", color: "#c0adeb", empty: "Acompanhe os produtos em importação." },
 concluido: { label: "Concluído", hint: "Seu histórico de decisões", color: "#9eafbf", empty: "Guarde aqui os ciclos finalizados." },
};
