# Deploy di OSIRIS Italia

OSIRIS Italia è una applicazione Next.js con API server-side, feed esterni e funzioni che beneficiano di un processo Node persistente. Per la versione completa è preferibile un hosting Docker/Node persistente rispetto a un puro ambiente serverless.

## 1. Variabili minime

Impostare in produzione, nel pannello Secrets/Environment Variables dell'hosting:

```text
NEXT_PUBLIC_SITE_URL=https://<dominio-pubblico>
GEMINI_API_KEY_1=<chiave Gemini API>
```

Non salvare mai chiavi reali nel repository pubblico.

Luma usa `GEMINI_API_KEY_1` lato server. Sono supportate anche `GEMINI_API_KEY_2` ... `GEMINI_API_KEY_8` per rotazione delle chiavi.

Per il feed AIS live aggiungere:

```text
AIS_API_KEY=<chiave aisstream.io>
```

Le altre chiavi documentate in `.env.example` sono opzionali.

## 2. Hosting consigliato

Per mantenere anche il collegamento WebSocket AIS e la cache in memoria del backend marittimo, usare preferibilmente un servizio che esegua il container o un processo Node persistente. Il repository contiene già `Dockerfile` e `docker-compose.yml`.

Un ambiente serverless può eseguire gran parte dell'applicazione, ma le connessioni WebSocket persistenti e lo stato in memoria possono essere resettati tra invocazioni. In quel caso alcune funzioni marittime live possono risultare parziali.

## 3. Avvio Node

```bash
npm install
npm run build
npm run start
```

La porta applicativa standard è 3000.

## 4. Avvio Docker

Costruire e avviare usando i file Docker già presenti nel repository. Passare le variabili d'ambiente come secrets del provider o tramite un file `.env` escluso da Git.

## 5. Verifica dopo il deploy

Aprire:

```text
https://<dominio>/api/health
```

Il risultato deve indicare `platform: OSIRIS Italia`. La sezione `configuration` segnala soltanto se Luma e AIS sono configurati; non espone le chiavi.

Poi verificare:

- caricamento della mappa;
- apertura della chat Luma;
- una richiesta semplice a Luma;
- terremoti e incendi;
- webcam pubbliche;
- aviazione;
- AIS, se configurato.

## 6. Dominio

`NEXT_PUBLIC_SITE_URL` deve essere l'URL definitivo con `https://`. Serve per canonical URL, OpenGraph e metadati social.

## 7. Sicurezza

Luma deve continuare a essere usata per analisi OSINT passiva di fonti pubbliche. Le chiavi API restano lato server. Non inserirle nel codice client e non usare prefissi `NEXT_PUBLIC_` per i segreti.
