/**
 * OSIRIS Italia — Luma AI Intelligence Engine
 * Gemini integration for analysis of public open-source intelligence data.
 */
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export interface EarthquakeEvent { id:string; magnitude:number; location:string; latitude:number; longitude:number; depth:number; timestamp:string; tsunami:boolean; felt:number|null; alert:string|null; }
export interface NewsItem { id:string; title:string; description:string; link:string; published:string; source:string; risk_score:number; coords:[number,number]|null; machine_assessment:string|null; }
export interface ThreatEvent { id:string; type:string; title:string; description:string; severity:'CRITICAL'|'HIGH'|'ELEVATED'|'LOW'; region:string; latitude:number; longitude:number; timestamp:string; source:string; }
export interface CyberAlert { id:string; name:string; vendor:string; product:string; severity:string; date:string; due:string; source:string; }
export interface IntelligenceContext { earthquakes:EarthquakeEvent[]; news:NewsItem[]; threats:ThreatEvent[]; cyberAlerts:CyberAlert[]; timestamp:string; }

const SYSTEM_PROMPT = `Sei Luma, l'assistente di analisi OSINT di OSIRIS Italia.
Analizzi esclusivamente i dati forniti dalla piattaforma e altre fonti aperte autorizzate. Rispondi in italiano per impostazione predefinita, salvo richiesta esplicita dell'utente.

PRINCIPI:
- Non inventare mai fatti, coordinate, identità, fonti o conclusioni.
- Distingui chiaramente fatti osservati, inferenze e ipotesi.
- Indica il livello di confidenza (ALTO, MEDIO, BASSO) quando formuli una valutazione.
- Cita nel testo le fonti o i dati disponibili nel contesto quando sono presenti.
- Se i dati non bastano, dichiaralo apertamente.
- Correlazione non significa causalità.
- Privilegia spiegazioni comprensibili anche a chi non è un analista professionista.

USO RESPONSABILE:
- Supporta analisi passive di fonti pubbliche e attività difensive su sistemi propri o esplicitamente autorizzati.
- Non fornire istruzioni per accessi non autorizzati, compromissione di sistemi, elusione di protezioni o sorveglianza privata.
- Non trasformare dati in indicazioni operative per colpire, intercettare o seguire tatticamente persone o mezzi sensibili.

Quando utile, struttura la risposta con: SINTESI, DATI OSSERVATI, VALUTAZIONE, CONFIDENZA e LIMITI. Sei un assistente analitico, non un'autorità e non un decisore.`;

const BRIEFING_PROMPT = `Genera il briefing OSIRIS Italia usando soltanto i dati operativi forniti.
Includi: sintesi generale; eventi prioritari; rischi naturali; quadro geopolitico dalle fonti disponibili; minacce cyber; possibili correlazioni; elementi da monitorare; livello di confidenza e lacune informative. Evita conclusioni non supportate.`;

const GEMINI_MODEL = 'gemini-2.5-flash';

export function createGeminiClient(apiKey:string):GoogleGenerativeAI { return new GoogleGenerativeAI(apiKey); }
let _keyIndex=0;
export function rotateApiKey(keys:string[]):string { if(keys.length===0) throw new Error('Nessuna chiave API disponibile'); const key=keys[_keyIndex%keys.length]; _keyIndex=(_keyIndex+1)%keys.length; return key; }

function serializeContext(context:IntelligenceContext):string {
  const sections:string[]=[];
  sections.push(`[TIMESTAMP] ${context.timestamp}`);
  if(context.earthquakes.length){ sections.push(`\n[TERREMOTI — ${context.earthquakes.length} eventi]`); for(const eq of context.earthquakes.slice(0,20)){ sections.push(`M${eq.magnitude} | ${eq.location} | ${eq.latitude.toFixed(2)},${eq.longitude.toFixed(2)} | Profondità:${eq.depth}km | ${eq.timestamp}${eq.tsunami?' | TSUNAMI':''}${eq.alert?` | ALERT:${eq.alert}`:''}`); } }
  if(context.news.length){ sections.push(`\n[NOTIZIE OSINT — ${context.news.length}]`); for(const item of context.news.slice(0,15)){ sections.push(`RISCHIO:${item.risk_score}/10 | ${item.source} | ${item.title}${item.coords?` | GEO:${item.coords[0].toFixed(2)},${item.coords[1].toFixed(2)}`:''} | ${item.published}`); } }
  if(context.threats.length){ sections.push(`\n[EVENTI DI RISCHIO — ${context.threats.length}]`); for(const t of context.threats.slice(0,15)){ sections.push(`${t.severity} | ${t.type} | ${t.title} | ${t.region} | ${t.timestamp} | Fonte:${t.source}`); } }
  if(context.cyberAlerts.length){ sections.push(`\n[ALLERTE CYBER — ${context.cyberAlerts.length}]`); for(const a of context.cyberAlerts.slice(0,10)){ sections.push(`${a.id} | ${a.severity} | ${a.vendor}/${a.product} | ${a.name} | Scadenza:${a.due} | Fonte:${a.source}`); } }
  return sections.join('\n');
}

export async function analyzeIntelligence(client:GoogleGenerativeAI,context:IntelligenceContext,userQuery:string):Promise<string>{
  const model:GenerativeModel=client.getGenerativeModel({model:GEMINI_MODEL,systemInstruction:SYSTEM_PROMPT});
  const prompt=`## DATI OPERATIVI DISPONIBILI\n${serializeContext(context)}\n\n## DOMANDA DELL'UTENTE\n${userQuery}\n\nRispondi come Luma basandoti sui dati sopra.`;
  const result=await model.generateContent(prompt); return result.response.text();
}

export async function generateBriefing(client:GoogleGenerativeAI,context:IntelligenceContext):Promise<string>{
  const model:GenerativeModel=client.getGenerativeModel({model:GEMINI_MODEL,systemInstruction:SYSTEM_PROMPT});
  const prompt=`${BRIEFING_PROMPT}\n\n## DATI OPERATIVI DISPONIBILI\n${serializeContext(context)}\n\nGenera il briefing ora.`;
  const result=await model.generateContent(prompt); return result.response.text();
}
