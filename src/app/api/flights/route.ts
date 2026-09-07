import { NextResponse } from 'next/server';
import { stealthFetch } from '@/lib/stealthFetch';

export const maxDuration = 60;

const REGIONS = [
  { lat:39.8,lon:-98.5 },{ lat:41.0,lon:-74.0 },{ lat:33.0,lon:-84.0 },{ lat:42.0,lon:-88.0 },
  { lat:30.0,lon:-97.0 },{ lat:47.0,lon:-122.0 },{ lat:34.0,lon:-118.0 },{ lat:45.0,lon:-73.0 },
  { lat:49.0,lon:-97.0 },{ lat:50.0,lon:15.0 },{ lat:51.5,lon:-1.0 },{ lat:47.0,lon:2.0 },
  { lat:40.0,lon:-4.0 },{ lat:42.0,lon:13.0 },{ lat:60.0,lon:15.0 },{ lat:52.0,lon:22.0 },
  { lat:39.0,lon:35.0 },{ lat:25.0,lon:45.0 },{ lat:22.0,lon:78.0 },{ lat:35.0,lon:105.0 },
  { lat:35.0,lon:136.0 },{ lat:37.0,lon:127.0 },{ lat:13.0,lon:100.0 },{ lat:1.0,lon:104.0 },
  { lat:-25.0,lon:133.0 },{ lat:-33.0,lon:151.0 },{ lat:0.0,lon:20.0 },{ lat:-26.0,lon:28.0 },
  { lat:-15.0,lon:-60.0 },{ lat:-23.0,lon:-46.0 },
];

const HELI_TYPES = new Set(['R22','R44','R66','B06','B06T','B204','B205','B206','B212','B222','B230','B407','B412','B427','B429','B430','B505','B525','AS32','AS35','AS50','AS55','AS65','EC20','EC25','EC30','EC35','EC45','EC55','EC75','H125','H130','H135','H145','H155','H160','H175','H215','H225','S55','S58','S61','S64','S70','S76','S92','A109','A119','A139','A169','A189','AW09','MD52','MD60','MDHI','MD90','NOTR','B47G','HUEY','GAMA','CABR','EXE']);
const PRIVATE_JET_TYPES = new Set(['G150','G200','G280','GLEX','G500','G550','G600','G650','G700','GLF2','GLF3','GLF4','GLF5','GLF6','GL5T','GL7T','GV','GIV','CL30','CL35','CL60','BD70','BD10','C25A','C25B','C25C','C500','C510','C525','C550','C560','C56X','C680','C700','C750','E35L','E50P','E55P','E545','E550','FA50','FA7X','FA8X','F900','F2TH','LJ35','LJ40','LJ45','LJ60','LJ70','LJ75','PC12','PC24','TBM7','TBM8','TBM9','PRM1','SF50','EA50','VLJ']);
const MILITARY_INDICATORS = new Set(['C17','C5M','C130','C30J','KC10','KC46','KC35','E3CF','E3TF','E8A','B1B','B2','B52','F16','F15','F18','F22','F35','A10','F117','RC135','E6B','P8A','P3','MQ9','RQ4','U2','EP3','RC12','V22','CH47','UH60','AH64','AH1Z','MV22','EUFI','RFAL','TORD','TYP','GR4']);
const AIRLINER_TYPES = new Set(['A319','A320','A321','A332','A333','A339','A343','A359','A388','B737','B738','B739','B38M','B39M','B752','B753','B763','B764','B772','B77L','B77W','B788','B789','B78X','E170','E175','E190','E195','CRJ7','CRJ9','AT43','AT72','DH8D']);
const BIZJET_OPERATORS = new Set(['EJA','EJM','NJE','LXJ','FJO','VJT','XOJ','JTL','WUP','GAJ','DPJ','CLY','TWY']);
const AIRLINE_CODE_RE = /^([A-Z]{3})\d/;
const CALLSIGN_RE = /^[A-Z0-9]{3,8}$/;
const JET_CRUISE_ALT_M = 8500;
const JET_CRUISE_KTS = 300;
const ADSB_MAX_DIST = 250;
const ADSBFI_BASE = 'https://opendata.adsb.fi/api/v2';
const ADSBLOL_BASE = 'https://api.adsb.lol/v2';

async function fetchAdsbLolRegion(lat:number, lon:number):Promise<any[]> {
  try {
    const res = await stealthFetch(`${ADSBLOL_BASE}/lat/${lat}/lon/${lon}/dist/${ADSB_MAX_DIST}`, { signal: AbortSignal.timeout(12000) });
    if (res.ok) { const data = await res.json(); return data.ac || []; }
    await res.body?.cancel();
  } catch {}
  return [];
}

function classifyFlight(f:any) {
  const modelUpper=(f.t||'').toUpperCase();
  const flightStr=(f.flight||'').trim().toUpperCase();
  const dbFlags=f.dbFlags||0;
  if(modelUpper==='TWR'||f.lat==null||f.lon==null) return null;
  const callsign=flightStr||f.hex||'UNKNOWN';
  const altRaw=f.alt_baro;
  const altMeters=typeof altRaw==='number'?altRaw*0.3048:0;
  const speedKnots=typeof f.gs==='number'?Math.round(f.gs*10)/10:null;
  const isHeli=HELI_TYPES.has(modelUpper)||f.category_os===8;
  const isGrounded=typeof altRaw==='number'&&altRaw<100;
  const isOsMilitary=f.category_os===14;
  const isOsHighPerf=f.category_os===7;
  const isOsLight=f.category_os===2;
  const isOsHeavy=f.category_os===4||f.category_os===5||f.category_os===6;
  const airlineMatch=AIRLINE_CODE_RE.exec(callsign);
  const airlineCode=airlineMatch?airlineMatch[1]:'';
  const isGaCallsign=!airlineCode&&CALLSIGN_RE.test(flightStr);
  const cruisesLikeAJet=altMeters>JET_CRUISE_ALT_M&&(speedKnots??0)>JET_CRUISE_KTS;
  let category:'commercial'|'private'|'jet'|'military'='commercial';
  if(isOsMilitary||(dbFlags&1)||MILITARY_INDICATORS.has(modelUpper)||(f.flight||'').match(/^(RCH|KING|DUKE|EVAC|JAKE|REACH|CONVOY)\d/i)) category='military';
  else if(AIRLINER_TYPES.has(modelUpper)||isOsHeavy) category='commercial';
  else if(BIZJET_OPERATORS.has(airlineCode)||PRIVATE_JET_TYPES.has(modelUpper)||isOsHighPerf||(isGaCallsign&&cruisesLikeAJet)) category='jet';
  else if(isGaCallsign||isOsLight) category='private';
  return { callsign,lat:Math.round(f.lat*100000)/100000,lng:Math.round(f.lon*100000)/100000,alt:Math.round(altMeters),heading:Math.round(f.track||0),speed_knots:speedKnots,model:f.t||'Unknown',icao24:f.hex||'',registration:f.r||'N/A',squawk:f.squawk||'',airline_code:airlineCode,aircraft_category:isHeli?'heli':'plane',category,grounded:isGrounded,nac_p:f.nac_p,type:'flight' };
}

function ingestAc(raw:any[],into:any[],seen:Set<string>){ for(const ac of raw){const hex=(ac.hex||'').toLowerCase().trim();if(hex&&!seen.has(hex)){seen.add(hex);into.push(ac);}} }

let cachedData:any=null;
let lastFetchTime=0;
const CACHE_TTL=90000;
const hasOpenSkyCreds=()=>Boolean(process.env.OPENSKY_CLIENT_ID&&process.env.OPENSKY_CLIENT_SECRET);
const openSkyInterval=()=>hasOpenSkyCreds()?90000:900000;
let osSnapshot:any[]=[];
let osSnapshotTime=0;
let fetchPromise:Promise<any>|null=null;
let openSkyCooldownUntil=0;
const OPENSKY_COOLDOWN=15*60*1000;
let osToken:string|null=null;
let osTokenExpiry=0;

async function getOpenSkyToken():Promise<string|null>{
  const id=process.env.OPENSKY_CLIENT_ID,secret=process.env.OPENSKY_CLIENT_SECRET;
  if(!id||!secret)return null;
  if(osToken&&Date.now()<osTokenExpiry)return osToken;
  try{
    const res=await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:id,client_secret:secret}),signal:AbortSignal.timeout(10000)});
    if(!res.ok)return null;
    const data=await res.json();if(!data.access_token)return null;
    osToken=data.access_token;osTokenExpiry=Date.now()+((data.expires_in||1800)-60)*1000;return osToken;
  }catch{return null;}
}

export async function GET(){
  const now=Date.now();
  if(cachedData&&now-lastFetchTime<CACHE_TTL)return NextResponse.json(cachedData,{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=60'}});
  if(fetchPromise){try{return NextResponse.json(await fetchPromise,{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=60'}});}catch{return NextResponse.json({error:'Failed to fetch flight data'},{status:500});}}
  const JAMMING_NACAP_THRESHOLD=4;
  fetchPromise=(async()=>{
    const allRaw:any[]=[];const seenHex=new Set<string>();let source:string;let adsbLolCount=0;
    const skipOpenSky=Date.now()<openSkyCooldownUntil||Date.now()-osSnapshotTime<openSkyInterval();
    const token=skipOpenSky?null:await getOpenSkyToken();
    const osInit:RequestInit=token?{signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${token}`}}:{signal:AbortSignal.timeout(30000)};
    const [milRes,osRes]=await Promise.allSettled([
      stealthFetch(`${ADSBFI_BASE}/mil`,{signal:AbortSignal.timeout(15000)}),
      skipOpenSky?Promise.reject(new Error('OpenSky in cooldown')):stealthFetch('https://opensky-network.org/api/states/all?extended=1',osInit)
    ]);
    if(milRes.status==='fulfilled'&&milRes.value.ok){try{const data=await milRes.value.json();ingestAc(data.ac||[],allRaw,seenHex);}catch{}}
    const milCount=allRaw.length;
    if(osRes.status==='fulfilled'){
      if(osRes.value.status===429){openSkyCooldownUntil=Date.now()+OPENSKY_COOLDOWN;await osRes.value.body?.cancel();}
      else if(osRes.value.ok){try{const data=await osRes.value.json();const states=data.states||[];if(states.length>100){osSnapshot=states.map((s:any[])=>({hex:s[0],flight:s[1]?.trim(),lon:s[5],lat:s[6],alt_baro:typeof s[7]==='number'?s[7]*3.28084:null,gs:typeof s[9]==='number'?s[9]*1.94384:null,track:s[10],squawk:s[14],category_os:s[17]}));osSnapshotTime=Date.now();}}catch{}}
    }
    ingestAc(osSnapshot,allRaw,seenHex);
    const openSkyWorked=osSnapshot.length>0;
    if(!openSkyWorked){
      source='adsb.lol';
      const results=await Promise.allSettled(REGIONS.map(r=>fetchAdsbLolRegion(r.lat,r.lon)));
      for(const result of results){if(result.status==='fulfilled'){const before=allRaw.length;ingestAc(result.value,allRaw,seenHex);adsbLolCount+=allRaw.length-before;}}
      if(adsbLolCount===0) source='regional-empty';
    }else source=hasOpenSkyCreds()?'opensky-auth':'opensky-anon';

    const commercial:any[]=[],privateFl:any[]=[],jets:any[]=[],military:any[]=[],gpsJamming:any[]=[];
    for(const raw of allRaw){const flight=classifyFlight(raw);if(!flight)continue;if(typeof flight.nac_p==='number'&&flight.nac_p<=JAMMING_NACAP_THRESHOLD&&!flight.grounded)gpsJamming.push({lat:flight.lat,lng:flight.lng,nac_p:flight.nac_p,callsign:flight.callsign});switch(flight.category){case'military':military.push(flight);break;case'jet':jets.push(flight);break;case'private':privateFl.push(flight);break;default:commercial.push(flight);}}
    return {commercial_flights:commercial,private_flights:privateFl,private_jets:jets,military_flights:military,gps_jamming:aggregateJamming(gpsJamming,JAMMING_NACAP_THRESHOLD),total:allRaw.length,source,providers:{adsbfi_mil:milCount,adsblol_regional:adsbLolCount,adsbfi_regional:0,opensky:osSnapshot.length,opensky_auth:hasOpenSkyCreds(),opensky_age_s:osSnapshotTime?Math.round((Date.now()-osSnapshotTime)/1000):null},timestamp:new Date().toISOString()};
  })();
  try{const data=await fetchPromise;cachedData=data;lastFetchTime=Date.now();fetchPromise=null;return NextResponse.json(data,{headers:{'Cache-Control':data.total<100?'no-store, max-age=0':'public, s-maxage=30, stale-while-revalidate=60'}});}catch(error){console.error('[OSIRIS] Flight fetch error:',error);fetchPromise=null;if(cachedData)return NextResponse.json({...cachedData,source:(cachedData.source||'unknown')+'+stale'},{headers:{'Cache-Control':'no-store, max-age=0'}});return NextResponse.json({error:'Failed to fetch flight data'},{status:500});}
}

function aggregateJamming(points:any[],threshold:number){if(points.length===0)return[];const grid=new Map<string,{lat:number;lng:number;count:number;total_nac_p:number}>();const GRID_SIZE=2;for(const p of points){const gLat=Math.floor(p.lat/GRID_SIZE)*GRID_SIZE,gLng=Math.floor(p.lng/GRID_SIZE)*GRID_SIZE,key=`${gLat},${gLng}`;if(!grid.has(key))grid.set(key,{lat:gLat+GRID_SIZE/2,lng:gLng+GRID_SIZE/2,count:0,total_nac_p:0});const cell=grid.get(key)!;cell.count++;cell.total_nac_p+=p.nac_p;}return Array.from(grid.values()).filter(z=>z.count>=3).map(z=>({lat:z.lat,lng:z.lng,severity:Math.round((1-(z.total_nac_p/z.count)/threshold)*100),count:z.count}));}
