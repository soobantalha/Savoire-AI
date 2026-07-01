'use strict';
// SAVOIRÉ AI v3.0 — api/study.js
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha

const SAVOIRÉ = {
  BRAND:'Savoiré AI v3.0', DEVELOPER:'Sooban Talha Technologies',
  DEVSITE:'soobantalhatech.xyz', WEBSITE:'savoireai.vercel.app',
  FOUNDER:'Sooban Talha', VERSION:'3.0', TAGLINE:'Think Less. Know More.',
};

const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// CONFIRMED FREE MODELS — verified working June 2026
const MODELS_PROSE = [
  { id:'google/gemini-2.0-flash-exp:free',        max_tokens:5000, timeout_ms:40000, temp:0.75 },
  { id:'google/gemini-flash-1.5-8b:free',         max_tokens:4500, timeout_ms:40000, temp:0.75 },
  { id:'meta-llama/llama-3.3-70b-instruct:free',  max_tokens:4500, timeout_ms:40000, temp:0.75 },
  { id:'microsoft/phi-3-mini-128k-instruct:free', max_tokens:3500, timeout_ms:35000, temp:0.75 },
  { id:'mistralai/mistral-7b-instruct-v0.3:free', max_tokens:3500, timeout_ms:35000, temp:0.75 },
  { id:'qwen/qwen2.5-72b-instruct:free',          max_tokens:4500, timeout_ms:40000, temp:0.75 },
  { id:'z-ai/glm-4.5-air:free',                   max_tokens:4000, timeout_ms:40000, temp:0.75 },
  { id:'openrouter/free',                          max_tokens:5000, timeout_ms:55000, temp:0.75 },
];

// Small batches per call: each generates only 3-4 items so token budget is small,
// calls are fast, and rate limits are not hammered.
const MODELS_JSON = [
  { id:'google/gemini-2.0-flash-exp:free',        max_tokens:1800, timeout_ms:22000, temp:0.4 },
  { id:'google/gemini-flash-1.5-8b:free',         max_tokens:1800, timeout_ms:22000, temp:0.4 },
  { id:'meta-llama/llama-3.3-70b-instruct:free',  max_tokens:1800, timeout_ms:22000, temp:0.4 },
  { id:'microsoft/phi-3-mini-128k-instruct:free', max_tokens:1500, timeout_ms:20000, temp:0.4 },
  { id:'mistralai/mistral-7b-instruct-v0.3:free', max_tokens:1500, timeout_ms:20000, temp:0.4 },
  { id:'qwen/qwen2.5-72b-instruct:free',          max_tokens:1800, timeout_ms:22000, temp:0.4 },
  { id:'z-ai/glm-4.5-air:free',                   max_tokens:1800, timeout_ms:22000, temp:0.4 },
  { id:'openrouter/free',                          max_tokens:1800, timeout_ms:28000, temp:0.4 },
];

const DEPTH_MAP = {
  standard:      { wordRange:'600\u2013900 words',   maxTokens:2500 },
  detailed:      { wordRange:'1000\u20131500 words', maxTokens:3500 },
  comprehensive: { wordRange:'1500\u20132200 words', maxTokens:4500 },
  expert:        { wordRange:'2200\u20133000 words', maxTokens:5500 },
};

const STYLE_MAP = {
  simple:   'Clear, beginner-friendly language. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Formal academic language. Precise terminology. Objective third-person tone.',
  detailed: 'Maximum detail. Numerous specific examples. Thorough step-by-step explanations.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Include exam tips.',
  visual:   'Vivid analogies and metaphors. Mental models. Make abstract concrete.',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = {
  info:  (...a) => console.log( `[${new Date().toISOString()}] \u2139\ufe0f  `,...a),
  ok:    (...a) => console.log( `[${new Date().toISOString()}] \u2705 `,...a),
  warn:  (...a) => console.warn(`[${new Date().toISOString()}] \u26a0\ufe0f  `,...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] \u274c `,...a),
};
const trunc = (s, n=120) => !s?'':String(s).length>n?String(s).slice(0,n)+'\u2026':String(s);

function getISTDateTime(){
  const now=new Date(), ist=new Date(now.getTime()+now.getTimezoneOffset()*60000+5.5*3600000);
  const p=n=>String(n).padStart(2,'0');
  return `${ist.getFullYear()}-${p(ist.getMonth()+1)}-${p(ist.getDate())} ${p(ist.getHours())}:${p(ist.getMinutes())}:${p(ist.getSeconds())}`;
}
function getISTDate(){return getISTDateTime().split(' ')[0];}

async function sendToGoogleSheets(userName,streak,sessions,tool,topic,status,durationMs,sessionId){
  const GOOGLE_WEBHOOK_URL=process.env.GOOGLE_WEBHOOK_URL||'';
  if(!GOOGLE_WEBHOOK_URL)return false;
  try{
    const payload={
      userName:userName||'Anonymous',streak:Number(streak)||0,sessions:Number(sessions)||1,
      lastUsed:getISTDateTime(),tool:tool||'visit',topic:String(topic||'').slice(0,200),
      status:status||'visit',durationMs:Number(durationMs)||0,sessionId:sessionId||'',
      timestamp:getISTDateTime(),istDate:getISTDate(),
    };
    const res=await fetch(GOOGLE_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(res.ok)log.ok(`\ud83d\udcca Sheets \u2190 ${userName}|${tool}|${status}`);
    else log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  }catch(err){log.warn(`Sheets non-fatal: ${err.message}`);return false;}
}

// ── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildNotesPrompt(input,opts){
  const depth=DEPTH_MAP[opts.depth]||DEPTH_MAP.detailed;
  const style=STYLE_MAP[opts.style]||STYLE_MAP.simple;
  const lang=opts.language||'English';
  const sections='## \ud83d\udcda Introduction & Overview\n\n## \ud83c\udfaf Core Concepts & Definitions\n\n## \u2699\ufe0f How It Works \u2014 Mechanisms\n\n## \ud83d\udca1 Key Examples with Walkthroughs\n\n## \ud83d\ude80 Advanced Aspects & Nuances\n\n## \ud83c\udf0d Real-World Applications\n\n## \ud83e\udde0 Common Misconceptions\n\n## \ud83d\udcdd Key Takeaways & Revision Checklist';
  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.\nCreator: ${SAVOIRÉ.DEVELOPER} | Founder: ${SAVOIRÉ.FOUNDER}\n\nTOPIC: "${input}"\nLANGUAGE: ${lang} \u2014 write EVERY word in ${lang}. Zero exceptions.\nLENGTH: ${depth.wordRange} \u2014 aim for upper end. Be thorough.\nSTYLE: ${style}\n\nREQUIRED SECTIONS:\n${sections}\n\nRULES: ## for headings, **bold** key terms, - for bullets, > for definitions, at least 3 real examples.\nSTART NOW with first ## heading. Write in ${lang} only.`;
}

function buildSummaryPrompt(input,opts){
  const lang=opts.language||'English';
  const style=STYLE_MAP[opts.style]||STYLE_MAP.simple;
  return `You are ${SAVOIRÉ.BRAND}. Generate a concise scannable smart summary.\n\nTOPIC: "${input}"\nLANGUAGE: ${lang} \u2014 write EVERY word in ${lang}.\nSTYLE: ${style}\n\nSECTIONS:\n## \ud83d\ude80 TL;DR \u2014 3 to 5 sentences maximum\n## \ud83c\udfaf Core Concepts \u2014 one bullet each (6-10 bullets)\n## \u2699\ufe0f Key Mechanisms \u2014 ultra-short bullets (4-6 bullets)\n## \u2705 Final Revision Checklist (5-7 checkboxes using "- [ ]")\n\n300-600 words total maximum.\nSTART NOW with TL;DR heading. Write in ${lang} only.`;
}

function buildFlashcardBatchPrompt(topic,opts,batchSize,avoidList){
  const lang=opts.language||'English';
  const t=String(topic).slice(0,100);
  const avoid=avoidList.length?`\nALREADY COVERED \u2014 do NOT repeat:\n${avoidList.map(f=>`- ${f}`).join('\n')}\n`:'';
  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${batchSize} NEW study flashcards as valid JSON.\n\nTOPIC: "${t}"\nLANGUAGE: ${lang} \u2014 ALL text in ${lang}.\n${avoid}\nEach flashcard:\n\u2022 "front": specific question about "${t}" (10-40 words)\n\u2022 "back": detailed answer 60-150 words about "${t}"\n\nOUTPUT ONLY valid JSON:\n{\n  "flashcards": [\n    {"front":"Specific question about ${t}","back":"Detailed 60-150 word answer"}\n  ]\n}\nThe "flashcards" array must contain EXACTLY ${batchSize} objects. OUTPUT JSON NOW:`;
}

function buildQuizBatchPrompt(topic,opts,batchSize,avoidList){
  const lang=opts.language||'English';
  const t=String(topic).slice(0,100);
  const quizType=opts.quizType||'mixed';
  const qDiff=quizType==='easy'?'ALL easy.':quizType==='medium'?'ALL medium.':quizType==='hard'?'ALL hard.':quizType==='exam'?'ALL exam-style.':'Mix of easy/medium/hard.';
  const avoid=avoidList.length?`\nALREADY COVERED \u2014 do NOT repeat:\n${avoidList.map(q=>`- ${q}`).join('\n')}\n`:'';
  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${batchSize} NEW multiple-choice quiz questions as valid JSON.\n\nTOPIC: "${t}"\nLANGUAGE: ${lang} \u2014 ALL text in ${lang}.\n${avoid}\nEach question:\n\u2022 "question": specific question about "${t}"\n\u2022 "options": EXACTLY 4 complete full-length answer strings (15-60 words each \u2014 NEVER single letters)\n\u2022 "correct_answer": character-for-character copy of one options[] string\n\u2022 "explanation": 60-100 words why correct\n\u2022 "difficulty": "easy"|"medium"|"hard"\nDIFFICULTY: ${qDiff}\n\nOUTPUT ONLY valid JSON:\n{\n  "quiz_questions": [\n    {"question":"...","options":["Full option A","Full option B","Full option C","Full option D"],"correct_answer":"Full option B","explanation":"...","difficulty":"medium"}\n  ]\n}\nThe "quiz_questions" array must contain EXACTLY ${batchSize} objects. OUTPUT JSON NOW:`;
}

function buildMindmapCentralPrompt(topic,opts){
  const lang=opts.language||'English';
  const t=String(topic).slice(0,100);
  return `You are ${SAVOIRÉ.BRAND}. Generate the central topic title for a mind map as valid JSON.\nTOPIC: "${t}"\nLANGUAGE: ${lang}\nOUTPUT ONLY valid JSON: {"central":"3-5 word essence of ${t} in ${lang}"}\nOUTPUT JSON NOW:`;
}

function buildMindmapBranchBatchPrompt(topic,opts,batchSize,avoidList){
  const lang=opts.language||'English';
  const t=String(topic).slice(0,100);
  const avoid=avoidList.length?`\nALREADY COVERED branch names \u2014 do NOT repeat:\n${avoidList.map(b=>`- ${b}`).join('\n')}\n`:'';
  return `You are ${SAVOIRÉ.BRAND}. Generate exactly ${batchSize} NEW mind map branches as valid JSON.\nTOPIC: "${t}"\nLANGUAGE: ${lang} \u2014 ALL text in ${lang}.\n${avoid}\nEach branch:\n\u2022 "name": specific branch name from "${t}" (NOT generic like "Introduction")\n\u2022 "color": one of "#00d4ff","#bf00ff","#00ff88","#ffae00","#d4af37","#ff4444","#e84393"\n\u2022 "items": array of 4-5 specific facts (5-20 words each, in ${lang})\n\nOUTPUT ONLY valid JSON:\n{\n  "branches": [\n    {"name":"Specific branch","color":"#00d4ff","items":["fact 1","fact 2","fact 3","fact 4"]}\n  ]\n}\nThe "branches" array must contain EXACTLY ${batchSize} objects. OUTPUT JSON NOW:`;
}

function buildMindmapConnectionsPrompt(topic,opts,branchNames){
  const lang=opts.language||'English';
  const t=String(topic).slice(0,100);
  return `You are ${SAVOIRÉ.BRAND}. Given these mind map branches for "${t}": ${branchNames.join(', ')} \u2014\ngenerate 3-4 connections showing how they relate, as valid JSON.\nLANGUAGE: ${lang}\nOUTPUT ONLY valid JSON: {"connections":[{"from":"branch name","to":"branch name","description":"10-20 word relation in ${lang}"}]}\nUse EXACT branch names: ${branchNames.join(', ')}. OUTPUT JSON NOW:`;
}

// ── PROSE STREAMER ────────────────────────────────────────────────────────────

async function streamProse(prompt,onChunk,label){
  const MAX_PASSES=3;
  for(let pass=0;pass<MAX_PASSES;pass++){
    if(pass>0){const b=Math.min(1000*Math.pow(2,pass),4000);log.warn(`${label} \u21bb pass ${pass+1}/${MAX_PASSES} backoff ${b}ms`);await sleep(b);}
    for(const model of MODELS_PROSE){
      const name=model.id.split('/').pop();
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),model.timeout_ms);
      const t0=Date.now();
      try{
        const res=await fetch(OPENROUTER_BASE,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':HTTP_REFERER,'X-Title':APP_TITLE},body:JSON.stringify({model:model.id,max_tokens:model.max_tokens,temperature:model.temp||0.75,stream:true,messages:[{role:'user',content:prompt}]}),signal:ctrl.signal});
        clearTimeout(timer);
        if(res.status===429){log.warn(`${label} 429 ${name}`);continue;}
        if(res.status===404){log.warn(`${label} 404 ${name}`);continue;}
        if(!res.ok){const txt=await res.text().catch(()=>'');log.warn(`${label} HTTP ${res.status} ${name}: ${trunc(txt,100)}`);if(res.status===401||res.status===403)throw new Error('OPENROUTER_API_KEY is invalid or missing.');continue;}
        const reader=res.body.getReader();const decoder=new TextDecoder('utf-8');
        let lineBuf='',full='',tokens=0;
        while(true){const{done,value}=await reader.read();if(done)break;lineBuf+=decoder.decode(value,{stream:true});const lines=lineBuf.split('\n');lineBuf=lines.pop()||'';for(const line of lines){if(!line.startsWith('data: '))continue;const raw=line.slice(6).trim();if(raw==='[DONE]'||!raw)continue;try{const delta=JSON.parse(raw)?.choices?.[0]?.delta?.content;if(delta){full+=delta;tokens++;onChunk(delta);}}catch{}}}
        if(full.trim().length<80){log.warn(`${name}: too short (${full.length}ch)`);continue;}
        log.ok(`${label} \u2705 ${name} | ${tokens}t | ${full.length}ch | ${Date.now()-t0}ms`);
        return full;
      }catch(err){clearTimeout(timer);if(err.name==='AbortError')log.warn(`${label} timeout ${name}`);else log.warn(`${label} \u2717 ${name}: ${err.message}`);if(err.message?.includes('API_KEY')||err.message?.includes('invalid'))throw err;}
    }
  }
  throw new Error('All AI models are currently busy generating your study notes. Please try again in a moment.');
}

// ── BATCH JSON FETCHER ────────────────────────────────────────────────────────

async function fetchJSONBatch(prompt,label,validateFn,repairFn){
  const MAX_PASSES=2;
  for(let pass=0;pass<MAX_PASSES;pass++){
    if(pass>0)await sleep(800);
    for(const model of MODELS_JSON){
      const name=model.id.split('/').pop();
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),model.timeout_ms);
      const t0=Date.now();
      try{
        const res=await fetch(OPENROUTER_BASE,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':HTTP_REFERER,'X-Title':APP_TITLE},body:JSON.stringify({model:model.id,max_tokens:model.max_tokens,temperature:model.temp||0.4,stream:false,messages:[{role:'user',content:prompt}]}),signal:ctrl.signal});
        clearTimeout(timer);
        if(res.status===429){log.warn(`${label} 429 ${name}`);continue;}
        if(res.status===404){log.warn(`${label} 404 ${name}`);continue;}
        if(!res.ok){const txt=await res.text().catch(()=>'');log.warn(`${label} HTTP ${res.status} ${name}: ${trunc(txt,100)}`);if(res.status===401||res.status===403)throw new Error('OPENROUTER_API_KEY is invalid or missing.');continue;}
        const data=await res.json();
        let content=data?.choices?.[0]?.message?.content?.trim();
        if(!content||content.length<10){log.warn(`${name}: empty`);continue;}
        content=content.replace(/^```(?:json)?\s*/im,'').replace(/\s*```\s*$/im,'').trim();
        const jS=content.indexOf('{'),jE=content.lastIndexOf('}');
        if(jS===-1||jE<=jS){log.warn(`${name}: no JSON`);continue;}
        let jsonStr=content.slice(jS,jE+1);
        let parsed;
        try{parsed=JSON.parse(jsonStr);}
        catch{try{parsed=JSON.parse(jsonStr.replace(/,(\s*[}\]])/g,'$1'));}
        catch{try{parsed=JSON.parse(jsonStr.replace(/,(\s*[}\]])/g,'$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,'$1"$2"$3').replace(/:\s*'([^']*)'/g,': "$1"'));}
        catch{try{parsed=JSON.parse(jsonStr.replace(/[\x00-\x1F\x7F]/g,' ').replace(/,(\s*[}\]])/g,'$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,'$1"$2"$3'));}
        catch(e4){log.warn(`${name}: JSON repair failed ${e4.message.slice(0,60)}`);continue;}}}}
        if(typeof repairFn==='function'){try{parsed=repairFn(parsed,name)||parsed;}catch(re){log.warn(`${name}: repairFn threw ${re.message}`);}}
        if(!validateFn(parsed)){log.warn(`${name}: validation failed ${label}`);continue;}
        log.ok(`${label} \u2705 ${name} | ${Date.now()-t0}ms`);
        return parsed;
      }catch(err){clearTimeout(timer);if(err.name==='AbortError')log.warn(`${label} timeout ${name}`);else log.warn(`${label} \u2717 ${name}: ${err.message}`);if(err.message?.includes('API_KEY')||err.message?.includes('invalid'))throw err;}
    }
  }
  return null;
}

function repairQuiz(parsed,modelName){
  if(!Array.isArray(parsed.quiz_questions))return parsed;
  parsed.quiz_questions=parsed.quiz_questions.map(q=>{
    if(q.options&&q.correct_answer){
      const lm={'A':0,'B':1,'C':2,'D':3,'a':0,'b':1,'c':2,'d':3};
      const tr=String(q.correct_answer).trim();
      if(tr.length<=2&&lm[tr]!==undefined&&q.options[lm[tr]])q.correct_answer=q.options[lm[tr]];
      if(!q.options.includes(q.correct_answer)){const lo=q.correct_answer.toLowerCase();const fix=q.options.find(o=>o.toLowerCase()===lo)||q.options.find(o=>o.toLowerCase().includes(lo)||lo.includes(o.toLowerCase()));if(fix)q.correct_answer=fix;}
    }
    return q;
  });
  return parsed;
}

function repairFlashcards(parsed){
  if(Array.isArray(parsed.flashcards)){parsed.flashcards=parsed.flashcards.filter(c=>(c.front||c.question)&&(c.back||c.answer)).map(c=>({front:String(c.front||c.question||'').trim(),back:String(c.back||c.answer||'').trim()}));}
  return parsed;
}

function batchSizes(total,size){const s=[];let r=total;while(r>0){const n=Math.min(size,r);s.push(n);r-=n;}return s;}

// ── ITEM-BY-ITEM STREAMING GENERATORS ────────────────────────────────────────

async function generateFlashcardsStreaming(topic,opts,emitCard){
  const total=opts.cardCount||15;
  const sizes=batchSizes(total,3);
  const collected=[];
  for(const size of sizes){
    const avoid=collected.map(c=>c.front);
    const prompt=buildFlashcardBatchPrompt(topic,opts,size,avoid);
    const parsed=await fetchJSONBatch(prompt,'FLASHCARDS',p=>Array.isArray(p.flashcards)&&p.flashcards.length>=1,repairFlashcards);
    if(!parsed||!Array.isArray(parsed.flashcards)||!parsed.flashcards.length){log.warn(`FLASHCARDS batch of ${size} failed — skipping`);continue;}
    for(const card of parsed.flashcards){collected.push(card);emitCard(collected.length-1,total,card);}
  }
  if(collected.length===0)throw new Error('FLASHCARDS: all batches failed across every model.');
  return{flashcards:collected.slice(0,total)};
}

async function generateQuizStreaming(topic,opts,emitQuestion){
  const total=opts.quizCount||10;
  const sizes=batchSizes(total,3);
  const collected=[];
  for(const size of sizes){
    const avoid=collected.map(q=>q.question);
    const prompt=buildQuizBatchPrompt(topic,opts,size,avoid);
    const parsed=await fetchJSONBatch(prompt,'QUIZ',p=>Array.isArray(p.quiz_questions)&&p.quiz_questions.length>=1,repairQuiz);
    if(!parsed||!Array.isArray(parsed.quiz_questions)||!parsed.quiz_questions.length){log.warn(`QUIZ batch of ${size} failed — skipping`);continue;}
    for(const q of parsed.quiz_questions){q.id=collected.length+1;collected.push(q);emitQuestion(collected.length-1,total,q);}
  }
  if(collected.length===0)throw new Error('QUIZ: all batches failed across every model.');
  return{quiz_questions:collected.slice(0,total)};
}

async function generateMindmapStreaming(topic,opts,emitBranchFn){
  const total=opts.branchCount||6;
  let central=String(topic).slice(0,40);
  const centralParsed=await fetchJSONBatch(buildMindmapCentralPrompt(topic,opts),'MINDMAP_CENTRAL',p=>typeof p.central==='string'&&p.central.trim().length>0);
  if(centralParsed?.central)central=centralParsed.central.trim();
  const sizes=batchSizes(total,2);
  const collected=[];
  for(const size of sizes){
    const avoid=collected.map(b=>b.name);
    const prompt=buildMindmapBranchBatchPrompt(topic,opts,size,avoid);
    const parsed=await fetchJSONBatch(prompt,'MINDMAP_BRANCH',p=>Array.isArray(p.branches)&&p.branches.length>=1);
    if(!parsed||!Array.isArray(parsed.branches)||!parsed.branches.length){log.warn(`MINDMAP branch batch of ${size} failed — skipping`);continue;}
    for(const branch of parsed.branches){collected.push(branch);emitBranchFn(collected.length-1,total,branch,central);}
  }
  if(collected.length===0)throw new Error('MINDMAP: all batches failed across every model.');
  let connections=[];
  if(collected.length>=2){const connParsed=await fetchJSONBatch(buildMindmapConnectionsPrompt(topic,opts,collected.map(b=>b.name)),'MINDMAP_CONN',p=>Array.isArray(p.connections));if(connParsed?.connections)connections=connParsed.connections;}
  return{mindmap:{central,branches:collected.slice(0,total),connections}};
}

// ── TOPIC FACT ────────────────────────────────────────────────────────────────

const FACT_TEMPLATES=[
  t=>`\ud83d\udca1 Did you know? People who quiz themselves on "${t}" retain 2\u20133\u00d7 more than those who re-read notes.`,
  t=>`\ud83e\udde0 Fun fact: Explaining "${t}" out loud is one of the fastest ways to find knowledge gaps.`,
  t=>`\u23f0 Quick tip: Reviewing "${t}" at intervals (1,3,7,14,30 days) beats any cramming session.`,
  t=>`\ud83d\udcca Interesting: Topics like "${t}" are remembered better when connected to something you already know.`,
  t=>`\ud83c\udfaf Study fact: Most learners overestimate how well they know "${t}" right after reading — testing reveals real gaps.`,
  t=>`\ud83c\udf0d Worth noting: "${t}" connects to more fields than it appears — that's where the hardest exam questions come from.`,
  t=>`\ud83d\udd0d Pro tip: Find the 20% of core ideas in "${t}" that explain 80% of everything else.`,
  t=>`\ud83d\udcdd Did you know? Writing "${t}" from memory \u2014 even imperfectly \u2014 teaches more than reading it again.`,
];

function buildTopicFact(topic){
  const t=String(topic||'this topic').trim().slice(0,60);
  const idx=Math.abs([...t].reduce((h,ch)=>(h*31+ch.charCodeAt(0))%100000,7))%FACT_TEMPLATES.length;
  return FACT_TEMPLATES[idx](t);
}

// ── RESULT ASSEMBLY ───────────────────────────────────────────────────────────

function assembleResult({topic,opts,notes,flashcards,quiz,mindmap}){
  const result={
    topic:String(topic||'Study Material').slice(0,200),
    curriculum_alignment:'General Academic Study',
    generated_at:getISTDateTime(),
    study_score:95,
    powered_by:`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    _version:SAVOIRÉ.VERSION,_tool:opts.tool,
    _language:opts.language||'English',_depth:opts.depth||'detailed',
    _style:opts.style||'simple',_quality:'ai_generated',
  };
  if(notes)                              result.ultra_long_notes=notes;
  if(flashcards?.flashcards?.length)     result.flashcards      =flashcards.flashcards;
  if(quiz?.quiz_questions?.length)       result.quiz_questions  =quiz.quiz_questions;
  if(mindmap?.mindmap?.branches?.length) result.mindmap         =mindmap.mindmap;
  return result;
}

// ── SSE HELPER ────────────────────────────────────────────────────────────────

function makeSSE(res){
  return(event,data)=>{
    if(res.writableEnded)return;
    try{res.write(`event: ${event}\ndata: ${typeof data==='string'?data:JSON.stringify(data)}\n\n`);if(typeof res.flush==='function')res.flush();}
    catch{}
  };
}

function setHeaders(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,Accept');
  res.setHeader('Access-Control-Max-Age','86400');
  res.setHeader('X-Powered-By',`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`);
  res.setHeader('X-Developer',SAVOIRÉ.DEVELOPER);
  res.setHeader('X-Founder',SAVOIRÉ.FOUNDER);
  res.setHeader('X-Version',SAVOIRÉ.VERSION);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

module.exports=async function handler(req,res){
  const reqId=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const startTime=Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')   return res.status(405).json({error:'Method not allowed. Use POST.'});

  if(!process.env.OPENROUTER_API_KEY){
    log.error('[FATAL] OPENROUTER_API_KEY not set!');
    return res.status(500).json({error:'Savoiré AI service is misconfigured \u2014 OPENROUTER_API_KEY missing.'});
  }

  const body=req.body||{};
  const message   =String(body.message   ||'').trim();
  const userName  =String(body.userName  ||'Anonymous').trim();
  const userStreak=Number(body.streak)   ||0;
  const userSess  =Number(body.sessions) ||1;
  const sessionId =String(body.sessionId ||reqId);

  if(!message||message==='ping'){
    log.info(`[${reqId}] PING \u2014 ${userName}`);
    sendToGoogleSheets(userName,userStreak,userSess,'visit','','online',0,sessionId).catch(()=>{});
    return res.status(200).json({status:'ok',service:SAVOIRÉ.BRAND,version:SAVOIRÉ.VERSION,tagline:SAVOIRÉ.TAGLINE,time:getISTDateTime(),requestId:reqId});
  }

  if(message.length<2)    return res.status(400).json({error:'Please enter a topic (minimum 2 characters).'});
  if(message.length>20000)return res.status(400).json({error:'Input too long (max 20,000 characters).'});

  const rawOpts=body.options||{};
  const opts={
    tool:       ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool)?rawOpts.tool:'notes',
    depth:      ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)?rawOpts.depth:'detailed',
    style:      ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)?rawOpts.style:'simple',
    language:   String(rawOpts.language||'English').trim().slice(0,60),
    stream:     rawOpts.stream===true,
    cardCount:  Math.min(Math.max(Number(rawOpts.cardCount)||15,5),25),
    quizCount:  Math.min(Math.max(Number(rawOpts.quizCount)||10,5),20),
    quizType:   ['mixed','easy','medium','hard','exam'].includes(rawOpts.quizType)?rawOpts.quizType:'mixed',
    branchCount:Math.min(Math.max(Number(rawOpts.branchCount)||6,3),10),
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | user:${userName}`);

  if(!opts.stream)return res.status(400).json({error:'Non-streaming mode is not supported. Client must send options.stream=true.'});

  sendToGoogleSheets(userName,userStreak,userSess,opts.tool,message,'started',0,sessionId).catch(()=>{});

  res.setHeader('Content-Type','text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control','no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection','keep-alive');
  res.setHeader('X-Accel-Buffering','no');
  if(typeof res.flushHeaders==='function')res.flushHeaders();

  const sse=makeSSE(res);

  const kap=setInterval(()=>{
    if(res.writableEnded){clearInterval(kap);return;}
    try{res.write(`: ping ${Date.now()}\n\n`);if(typeof res.flush==='function')res.flush();}
    catch{clearInterval(kap);}
  },10000);

  sse('heartbeat',{ts:Date.now(),status:'connected',service:SAVOIRÉ.BRAND,requestId:reqId,tool:opts.tool});
  sse('stage',{idx:0,label:`\ud83c\udfaf Analysing "${message.slice(0,50)}${message.length>50?'\u2026':''}"`});
  sse('fact',{fact:buildTopicFact(message)});
  sse('token',{t:''}); // prime the stream

  // SSE emitters matching exactly what app.js pump expects
  const emitCard    =(idx,total,card)   =>sse('card',{idx,total,card});
  const emitQuestion=(idx,total,q)      =>sse('q',{idx,total,q:{...q,id:idx+1}});
  const emitBranchCentral=(total,central,connections)=>sse('branch',{idx:-1,total,branch:{name:'_central_',value:central,connections}});
  const emitBranch  =(idx,total,branch) =>sse('branch',{idx,total,branch});

  try{
    let result;

    switch(opts.tool){

      case 'notes':{
        const notes=await streamProse(buildNotesPrompt(message,opts),chunk=>sse('token',{t:chunk}),'NOTES');
        result=assembleResult({topic:message,opts,notes});
        break;
      }

      case 'summary':{
        const notes=await streamProse(buildSummaryPrompt(message,opts),chunk=>sse('token',{t:chunk}),'SUMMARY');
        result=assembleResult({topic:message,opts,notes});
        break;
      }

      case 'flashcards':{
        sse('stage',{idx:1,label:'\ud83c\udccf Generating your flashcards\u2026'});
        const fc=await generateFlashcardsStreaming(message,opts,(idx,total,card)=>emitCard(idx,total,card));
        result=assembleResult({topic:message,opts,flashcards:fc});
        break;
      }

      case 'quiz':{
        sse('stage',{idx:1,label:'\u2753 Generating your quiz\u2026'});
        const q=await generateQuizStreaming(message,opts,(idx,total,question)=>emitQuestion(idx,total,question));
        result=assembleResult({topic:message,opts,quiz:q});
        break;
      }

      case 'mindmap':{
        sse('stage',{idx:1,label:'\ud83d\uddfa\ufe0f Generating your mind map\u2026'});
        let centralSent=false;
        const mm=await generateMindmapStreaming(message,opts,(idx,total,branch,central)=>{
          if(!centralSent){emitBranchCentral(total,central,[]);centralSent=true;}
          emitBranch(idx,total,branch);
        });
        result=assembleResult({topic:message,opts,mindmap:mm});
        break;
      }

      case 'all':{
        // Notes streams live token-by-token; flashcards/quiz/mindmap run in parallel,
        // each streaming their own items via card/q/branch SSE events simultaneously.
        const notesPromise=streamProse(buildNotesPrompt(message,opts),chunk=>sse('token',{t:chunk}),'NOTES');
        const megaOpts={...opts,cardCount:Math.min(opts.cardCount,12),quizCount:Math.min(opts.quizCount,8)};
        const fcPromise=generateFlashcardsStreaming(message,megaOpts,(idx,total,card)=>emitCard(idx,total,card)).catch(err=>{log.warn(`[${reqId}] mega fc failed: ${err.message}`);return null;});
        const quizPromise=generateQuizStreaming(message,megaOpts,(idx,total,question)=>emitQuestion(idx,total,question)).catch(err=>{log.warn(`[${reqId}] mega quiz failed: ${err.message}`);return null;});
        let mmCentralSent=false;
        const mmPromise=generateMindmapStreaming(message,opts,(idx,total,branch,central)=>{
          if(!mmCentralSent){emitBranchCentral(total,central,[]);mmCentralSent=true;}
          emitBranch(idx,total,branch);
        }).catch(err=>{log.warn(`[${reqId}] mega mm failed: ${err.message}`);return null;});
        const[notes,fc,q,mm]=await Promise.all([notesPromise,fcPromise,quizPromise,mmPromise]);
        if(!fc&&!q&&!mm&&(!notes||notes.trim().length<80))throw new Error('Mega bundle: all components failed across every model.');
        result=assembleResult({topic:message,opts,notes,flashcards:fc,quiz:q,mindmap:mm});
        result._mega_partial=!(fc&&q&&mm);
        break;
      }

      default:{
        const notes=await streamProse(buildNotesPrompt(message,opts),chunk=>sse('token',{t:chunk}),'NOTES');
        result=assembleResult({topic:message,opts,notes});
      }
    }

    clearInterval(kap);
    result._duration_ms=Date.now()-startTime;
    result._request_id =reqId;
    result.topic_fact  =buildTopicFact(message);

    sse('stage',{idx:4,label:'\u2705 Complete! All study materials ready.',done:true});
    sse('done',result);

    log.ok(`[${reqId}] \u2705 COMPLETE \u2014 ${result._duration_ms}ms | tool:${opts.tool}`);
    sendToGoogleSheets(userName,userStreak,userSess,opts.tool,message,'completed',result._duration_ms,sessionId).catch(()=>{});

  }catch(fatal){
    clearInterval(kap);
    log.error(`[${reqId}] FATAL (${opts.tool}): ${fatal.message}`);
    sse('error',{error:'All AI models are currently busy. Please try again in a few seconds.',requestId:reqId});
    sendToGoogleSheets(userName,userStreak,userSess,opts.tool,message,'failed',Date.now()-startTime,sessionId).catch(()=>{});
  }

  if(!res.writableEnded)res.end();
};

