'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SAVOIRÉ AI v2.0 — api/study.js
// Built by Sooban Talha Technologies | soobantalhatech.xyz | Founder: Sooban Talha
// "Think Less. Know More."
// KEY FIX: Phase 2 starts DURING Phase 1 (parallel) = final result comes fast
// ═══════════════════════════════════════════════════════════════════════════════

const SAVOIRÉ = {
  BRAND:'Savoiré AI v2.0', DEVELOPER:'Sooban Talha Technologies',
  DEVSITE:'soobantalhatech.xyz', WEBSITE:'savoireai.vercel.app',
  FOUNDER:'Sooban Talha', VERSION:'2.0', TAGLINE:'Think Less. Know More.',
};

const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1/chat/completions';
const HTTP_REFERER       = `https://${SAVOIRÉ.WEBSITE}`;
const APP_TITLE          = SAVOIRÉ.BRAND;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// MODELS — openrouter/free FIRST (free smart router), then free fallbacks
// ALL 100% free — no paid models
// ─────────────────────────────────────────────────────────────────────────────

const MODELS_STREAM = [
  { id:'openrouter/free',                          max_tokens:5000, timeout_ms:90000, temp:0.75 },
  { id:'google/gemini-2.0-flash-exp:free',         max_tokens:5000, timeout_ms:90000, temp:0.75 },
  { id:'deepseek/deepseek-chat-v3-0324:free',      max_tokens:5000, timeout_ms:90000, temp:0.75 },
  { id:'meta-llama/llama-3.3-70b-instruct:free',   max_tokens:4500, timeout_ms:90000, temp:0.75 },
  { id:'qwen/qwen2.5-72b-instruct:free',           max_tokens:5000, timeout_ms:90000, temp:0.75 },
  { id:'mistralai/mistral-7b-instruct-v0.3:free',  max_tokens:3500, timeout_ms:90000, temp:0.75 },
  { id:'microsoft/phi-3-mini-128k-instruct:free',  max_tokens:4000, timeout_ms:90000, temp:0.75 },
];

const MODELS_CARDS = [
  { id:'openrouter/free',                          max_tokens:7000, timeout_ms:60000, temp:0.25 },
  { id:'google/gemini-2.0-flash-exp:free',         max_tokens:8000, timeout_ms:60000, temp:0.25 },
  { id:'deepseek/deepseek-chat-v3-0324:free',      max_tokens:8000, timeout_ms:60000, temp:0.25 },
  { id:'meta-llama/llama-3.3-70b-instruct:free',   max_tokens:7000, timeout_ms:60000, temp:0.25 },
  { id:'qwen/qwen2.5-72b-instruct:free',           max_tokens:7500, timeout_ms:60000, temp:0.25 },
  { id:'mistralai/mistral-7b-instruct-v0.3:free',  max_tokens:5000, timeout_ms:60000, temp:0.25 },
  { id:'microsoft/phi-3-mini-128k-instruct:free',  max_tokens:6000, timeout_ms:60000, temp:0.25 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const DEPTH_MAP = {
  standard:      { wordRange:'600–900 words',   maxTokens:2500 },
  detailed:      { wordRange:'1000–1500 words', maxTokens:3500 },
  comprehensive: { wordRange:'1500–2200 words', maxTokens:4500 },
  expert:        { wordRange:'2200–3000 words', maxTokens:5500 },
};

const STYLE_MAP = {
  simple:   'Clear, beginner-friendly. Short sentences. Everyday analogies. Define all jargon.',
  academic: 'Formal academic language. Precise terminology. Objective third-person tone.',
  detailed: 'Maximum detail. Numerous specific examples. Thorough step-by-step explanations.',
  exam:     'Exam-focused. Mark-scheme phrasing. Highlight must-know points. Include exam tips.',
  visual:   'Vivid analogies and metaphors. Mental models. Make abstract concrete.',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = {
  info:  (...a) => console.log( `[${new Date().toISOString()}] ℹ️  `,...a),
  ok:    (...a) => console.log( `[${new Date().toISOString()}] ✅ `,...a),
  warn:  (...a) => console.warn(`[${new Date().toISOString()}] ⚠️  `,...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] ❌ `,...a),
};
const trunc = (s,n=120) => !s?'':String(s).length>n?String(s).slice(0,n)+'…':String(s);

function getISTDateTime() {
  const now=new Date(), ist=new Date(now.getTime()+now.getTimezoneOffset()*60000+5.5*3600000);
  const p=n=>String(n).padStart(2,'0');
  return `${ist.getFullYear()}-${p(ist.getMonth()+1)}-${p(ist.getDate())} ${p(ist.getHours())}:${p(ist.getMinutes())}:${p(ist.getSeconds())}`;
}
function getISTDate() { return getISTDateTime().split(' ')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SHEETS — DO NOT CHANGE
// ─────────────────────────────────────────────────────────────────────────────

async function sendToGoogleSheets(userName,streak,sessions,tool,topic,status,durationMs,sessionId) {
  if (!GOOGLE_WEBHOOK_URL) return false;
  try {
    const payload = {
      userName:userName||'Anonymous', streak:Number(streak)||0, sessions:Number(sessions)||1,
      lastUsed:getISTDateTime(), tool:tool||'visit', topic:String(topic||'').slice(0,200),
      status:status||'visit', durationMs:Number(durationMs)||0, sessionId:sessionId||'',
      timestamp:getISTDateTime(), istDate:getISTDate(),
    };
    const res = await fetch(GOOGLE_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(res.ok) log.ok(`📊 Sheets ← ${userName}|${tool}|${status}`);
    else log.warn(`Sheets HTTP ${res.status}`);
    return res.ok;
  } catch(err) { log.warn(`Sheets non-fatal: ${err.message}`); return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildNotesPrompt(input, opts) {
  const depth = DEPTH_MAP[opts.depth] || DEPTH_MAP.detailed;
  const style = STYLE_MAP[opts.style] || STYLE_MAP.simple;
  const lang  = opts.language || 'English';
  const tool  = opts.tool || 'notes';

  const sectionMap = {
    notes:      '## 📚 Introduction & Overview\n\n## 🎯 Core Concepts & Definitions\n\n## ⚙️ How It Works\n\n## 💡 Key Examples\n\n## 🚀 Advanced Aspects\n\n## 🌍 Real-World Applications\n\n## 🧠 Common Misconceptions\n\n## 📝 Key Takeaways',
    flashcards: '## 📖 Overview\n\n## 🎯 Core Concepts (Q&A pairs)\n\n## ⚙️ Mechanisms\n\n## 💡 Examples\n\n## 🎯 Quick Summary',
    quiz:       '## 📚 Topic Introduction\n\n## ✏️ Core Concepts (exam-ready)\n\n## ⚙️ Mechanisms\n\n## 📝 Must-Remember Points',
    summary:    '## 🚀 TL;DR (3–5 sentences)\n\n## 🎯 Core Concepts\n\n## ⚙️ Key Mechanisms\n\n## ✅ Revision Checklist',
    mindmap:    '## 🧠 Central Topic\n\n## 🌿 Foundations\n\n## 🌿 Mechanisms\n\n## 🌿 Examples\n\n## 🌿 Applications\n\n## 🔗 Connections',
    all:        '## 📚 Introduction\n\n## 🎯 Core Concepts\n\n## ⚙️ How It Works\n\n## 💡 Examples\n\n## 🚀 Advanced\n\n## 🌍 Applications\n\n## 📝 Summary',
  };

  return `You are ${SAVOIRÉ.BRAND}, the world's most advanced AI study assistant.
Creator: ${SAVOIRÉ.DEVELOPER} | Founder: ${SAVOIRÉ.FOUNDER}

TOPIC: "${input}"
LANGUAGE: ${lang} — write EVERY word in ${lang}. Zero exceptions.
LENGTH: ${depth.wordRange}
STYLE: ${style}

REQUIRED SECTIONS:
${sectionMap[tool] || sectionMap.notes}

RULES: ## for headings. **bold** key terms. - for bullets. > for definitions. At least 3 real examples specific to "${input}". ⚠️ Common mistakes section. 🎯 Key Takeaways at end.

START NOW with first ## heading. Write in ${lang} only. Topic: "${input}"`;
}

function buildCardsPrompt(input, opts, toolOverride) {
  const lang       = opts.language || 'English';
  const tool       = toolOverride  || opts.tool || 'notes';
  const topicShort = String(input).slice(0,100);

  const includeFc = ['flashcards','flashcards_quiz','all'].includes(tool);
  const includeQ  = ['quiz','flashcards_quiz','all'].includes(tool);
  const includeMm = ['mindmap','mindmap_only','all'].includes(tool);

  // Use wizard-selected counts
  const fcCount  = tool==='all' ? 12 : (opts.cardCount   || 15);
  const qCount   = tool==='all' ?  8 : (opts.quizCount   || 10);
  const mmCount  = tool==='all' ?  6 : (opts.branchCount || 6);
  const quizType = opts.quizType || 'mixed';
  const qDiff    = quizType==='easy'   ? 'ALL easy (foundational, beginner-friendly).' :
                   quizType==='medium' ? 'ALL medium (core exam level).' :
                   quizType==='hard'   ? 'ALL hard (advanced analysis & application).' :
                   quizType==='exam'   ? 'ALL exam-style (past-paper format, mark-scheme phrasing).' :
                   '30% easy, 50% medium, 20% hard.';

  const fcBlock = includeFc ? `
FLASHCARDS — exactly ${fcCount} cards:
Each: {"front":"question about ${topicShort} in ${lang}","back":"detailed answer 60-150 words in ${lang}"}
Types: definitions, mechanisms, comparisons, applications, misconceptions. ALL about "${topicShort}".` : '';

  const qBlock = includeQ ? `
QUIZ QUESTIONS — exactly ${qCount} questions:
Each: {"id":N,"question":"question about ${topicShort}","options":["A","B","C","D"],"correct_answer":"COPY EXACT text of one option","explanation":"60-100 words why correct in ${lang}","difficulty":"easy|medium|hard"}
DIFFICULTY: ${qDiff}
CRITICAL: correct_answer = character-for-character copy of one options[] string.` : '';

  const mmBlock = includeMm ? `
MIND MAP — exactly ${mmCount} branches:
{"central":"3-5 word essence of ${topicShort} in ${lang}","branches":[{"name":"SPECIFIC branch (not generic)","color":"#00d4ff","items":["fact","fact","fact","fact"]}],"connections":[{"from":"branch","to":"branch","description":"relationship"}]}
Colors: #00d4ff #bf00ff #00ff88 #ffae00 #d4af37 #ff4444 #e84393. Branch names MUST be specific to "${topicShort}".` : '';

  return `You are ${SAVOIRÉ.BRAND}. Generate study content about: "${input}"
Language: ${lang}. ALL text in ${lang}.
${fcBlock}
${qBlock}
${mmBlock}

OUTPUT: Valid JSON only. Start with {, end with }. No markdown, no code fences, no text before or after.

{
  "topic":"${topicShort} clean title in ${lang}",
  "curriculum_alignment":"appropriate academic level",
  "study_score":97,
  ${includeFc ? `"flashcards":[/* ${fcCount} cards */],` : '"flashcards":[],'}
  ${includeQ  ? `"quiz_questions":[/* ${qCount} questions */],` : '"quiz_questions":[],'}
  ${includeMm ? `"mindmap":{"central":"...","branches":[/* ${mmCount} branches */],"connections":[...]},` : '"mindmap":null,'}
  "key_concepts":["Concept: 60-80 word explanation in ${lang}","...","...","...","..."],
  "key_tricks":["🧠 Memory trick for ${topicShort} in ${lang} — 60-90 words","📝 Study strategy — 60-90 words","⏰ Recall technique — 60-90 words"],
  "practice_questions":[{"question":"analytical question in ${lang}","answer":"200+ word answer in ${lang}"},{"question":"application question","answer":"200+ word answer"}],
  "real_world_applications":["🏥 Healthcare: specific use of ${topicShort}","💻 Tech: specific tech use","📈 Business: specific use","🌍 Society: social impact"],
  "common_misconceptions":["❌ MYTH. ✅ TRUTH: correction in ${lang}","❌ MYTH. ✅ TRUTH: correction","❌ MYTH. ✅ TRUTH: correction"]
}
OUTPUT JSON NOW:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — STREAM NOTES (tries models in order, first success wins)
// ─────────────────────────────────────────────────────────────────────────────

async function streamNotes(prompt, onChunk, tool) {
  let lastErr = 'No models tried';
  for (const model of MODELS_STREAM) {
    const name  = model.id.split('/').pop().replace(':free','');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();
    try {
      log.info(`P1 → ${name} | tool:${tool}`);
      const res = await fetch(OPENROUTER_BASE, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':HTTP_REFERER,'X-Title':APP_TITLE},
        body:JSON.stringify({model:model.id,max_tokens:model.max_tokens,temperature:model.temp||0.75,stream:true,messages:[{role:'user',content:prompt}]}),
        signal:ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const txt = await res.text().catch(()=>'');
        log.warn(`P1 HTTP ${res.status} — ${name}: ${trunc(txt,80)}`);
        if (res.status===401||res.status===403) throw new Error('Invalid API key');
        if (res.status===429) await sleep(2000);
        continue;
      }

      const reader=res.body.getReader(), decoder=new TextDecoder('utf-8');
      let lineBuf='', full='', tokens=0;
      while(true) {
        const {done,value}=await reader.read();
        if(done) break;
        lineBuf+=decoder.decode(value,{stream:true});
        const lines=lineBuf.split('\n'); lineBuf=lines.pop()||'';
        for(const line of lines) {
          if(!line.startsWith('data: ')) continue;
          const raw=line.slice(6).trim();
          if(raw==='[DONE]'||!raw) continue;
          try {
            const delta=JSON.parse(raw)?.choices?.[0]?.delta?.content;
            if(delta){full+=delta;tokens++;onChunk(delta);}
          } catch { /* ignore */ }
        }
      }

      if(full.trim().length < 80) { log.warn(`${name}: too short (${full.length}ch)`); continue; }
      log.ok(`P1 ✅ ${name} | ${tokens}t | ${full.length}ch | ${Date.now()-t0}ms`);
      return full;

    } catch(err) {
      clearTimeout(timer);
      lastErr = err.name==='AbortError' ? `${name} timed out` : `${name}: ${err.message}`;
      log.warn(`P1 ✗ ${lastErr}`);
      if (err.message?.includes('API key')) throw err;
    }
  }
  throw new Error(`All stream models failed. Last: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — FETCH CARDS (races ALL models simultaneously, takes fastest winner)
// This is the KEY FIX: instead of trying models one-by-one sequentially,
// we fire ALL of them at once and take whichever responds first with valid JSON.
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCards(prompt, tool) {
  log.info(`P2 racing ${MODELS_CARDS.length} models for tool:${tool}`);

  // Fire all models simultaneously — first valid response wins
  const racePromises = MODELS_CARDS.map(async (model) => {
    const name  = model.id.split('/').pop().replace(':free','');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), model.timeout_ms);
    const t0    = Date.now();

    try {
      const res = await fetch(OPENROUTER_BASE, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'HTTP-Referer':HTTP_REFERER,'X-Title':APP_TITLE},
        body:JSON.stringify({model:model.id,max_tokens:model.max_tokens,temperature:model.temp||0.25,stream:false,messages:[{role:'user',content:prompt}]}),
        signal:ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (res.status===401||res.status===403) throw new Error('Invalid API key');
        throw new Error(`HTTP ${res.status}`);
      }

      const data    = await res.json();
      let   content = data?.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 30) throw new Error('Empty response');

      // Strip code fences
      content = content.replace(/^```(?:json)?\s*/im,'').replace(/\s*```\s*$/im,'').trim();

      // Find JSON bounds
      const jS=content.indexOf('{'), jE=content.lastIndexOf('}');
      if(jS===-1||jE<=jS) throw new Error('No JSON object');
      let jsonStr=content.slice(jS,jE+1);

      // 4-step JSON repair
      let parsed;
      try { parsed=JSON.parse(jsonStr); }
      catch { try { parsed=JSON.parse(jsonStr.replace(/,(\s*[}\]])/g,'$1')); }
      catch { try { parsed=JSON.parse(jsonStr.replace(/,(\s*[}\]])/g,'$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,'$1"$2"$3').replace(/:\s*'([^']*)'/g,': "$1"')); }
      catch { try { parsed=JSON.parse(jsonStr.replace(/[\x00-\x1F\x7F]/g,' ').replace(/,(\s*[}\]])/g,'$1').replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,'$1"$2"$3')); }
      catch(e4) { throw new Error(`JSON repair failed: ${e4.message.slice(0,60)}`); } } } }

      // Auto-fix quiz correct_answer mismatches
      if(Array.isArray(parsed.quiz_questions)) {
        parsed.quiz_questions=parsed.quiz_questions.map((q,i)=>{
          q.id=q.id||i+1;
          if(q.options&&q.correct_answer&&!q.options.includes(q.correct_answer)){
            const lo=q.correct_answer.toLowerCase();
            const fix=q.options.find(o=>o.toLowerCase()===lo)||q.options.find(o=>o.toLowerCase().includes(lo)||lo.includes(o.toLowerCase()))||q.options[0];
            if(fix){q.correct_answer=fix;}
          }
          return q;
        });
      }

      // Normalize flashcards
      if(Array.isArray(parsed.flashcards)){
        parsed.flashcards=parsed.flashcards
          .filter(c=>(c.front||c.question)&&(c.back||c.answer))
          .map(c=>({front:String(c.front||c.question||'').trim(),back:String(c.back||c.answer||'').trim()}));
      }

      // Validation
      const hasFc=Array.isArray(parsed.flashcards)&&parsed.flashcards.length>=2;
      const hasQ =Array.isArray(parsed.quiz_questions)&&parsed.quiz_questions.length>=2;
      const hasMm=parsed.mindmap?.branches?.length>=2;
      const hasKc=Array.isArray(parsed.key_concepts)&&parsed.key_concepts.length>=1;
      const valid=['flashcards','flashcards_quiz'].includes(tool)?hasFc:tool==='quiz'?hasQ:['mindmap','mindmap_only'].includes(tool)?hasMm:tool==='all'?(hasFc||hasQ||hasMm||hasKc):hasKc;
      if(!valid) throw new Error(`Validation failed: fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0}`);

      log.ok(`P2 ✅ ${name} | ${tool} | fc:${parsed.flashcards?.length||0} q:${parsed.quiz_questions?.length||0} mm:${parsed.mindmap?.branches?.length||0} | ${Date.now()-t0}ms`);
      return parsed;

    } catch(err) {
      clearTimeout(timer);
      const reason = err.name==='AbortError'?`${name} timed out`:`${name}: ${err.message}`;
      log.warn(`P2 ✗ ${reason}`);
      throw new Error(reason); // reject this promise so Promise.any skips it
    }
  });

  // Promise.any = first success wins, fails only if ALL fail
  try {
    return await Promise.any(racePromises);
  } catch(aggErr) {
    throw new Error(`P2: all ${MODELS_CARDS.length} models failed simultaneously`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function offlineNotes(topic) {
  const T=topic||'this topic';
  return `## 📚 Introduction to ${T}\n\n**${T}** is an important area of study with significant theoretical foundations and practical applications.\n\n---\n\n## 🎯 Core Concepts\n\n> **Definition:** ${T} refers to the systematic study and application of its core domain — encompassing the principles, methods, and frameworks that define the field.\n\n**Foundational Framework:** The study of ${T} rests on interconnected principles. Grasping how each concept connects to others is more valuable than memorising definitions in isolation.\n\n---\n\n## ⚙️ How It Works\n\n1. **Initial conditions** are established and characterised\n2. **Core process** begins, governed by the rules of ${T}\n3. **Transformation** occurs through identifiable stages\n4. **Outcomes** emerge and can be measured\n\n---\n\n## 📝 Key Takeaways\n\n- ✅ ${T} is a reasoning framework, not a collection of facts\n- ✅ Active retrieval is 2–3× more effective than re-reading\n- ✅ Real mastery = applying ${T} to novel situations\n\n*Generated by ${SAVOIRÉ.BRAND} | ${SAVOIRÉ.DEVELOPER}*`;
}

function buildTopicFallback(tool, topic) {
  const T=topic||'this topic', now=getISTDateTime();
  const topicWords=T.split(' ').slice(0,4).join(' ')||T;
  const base={
    topic:T, curriculum_alignment:'General Academic Study', generated_at:now,
    study_score:85, _fallback:true, flashcards:[], quiz_questions:[], mindmap:null,
    key_concepts:[
      `Core Definition: ${T} is the systematic study of its central domain. Mastery requires understanding WHY — not just memorising WHAT.`,
      `Primary Mechanism: The main process in ${T} follows a structured sequence where initial conditions lead to transformation and measurable outcomes.`,
      `Key Relationships: In ${T}, core concepts are deeply interconnected — grasping these relationships provides more insight than knowing any concept in isolation.`,
      `Practical Transfer: ${T} knowledge applies to healthcare, technology, business, and policy through the same analytical frameworks.`,
      `Expert Thinking: Experts in ${T} recognise deep structural patterns that beginners miss. This gap closes only through deliberate practice.`,
    ],
    key_tricks:[
      `🧠 FEYNMAN: Explain "${T}" to an imaginary 12-year-old. Every hesitation reveals a gap. Return to notes only for gaps. Repeat until fully fluent.`,
      `📝 ACTIVE RECALL: After every ${T} session, write everything you remember from scratch without looking. Gaps = study targets.`,
      `⏰ SPACED REPETITION: Review ${T} on days 1, 3, 7, 14, 30. Each review = active retrieval, not re-reading.`,
    ],
    practice_questions:[
      {question:`Explain the foundational principles of ${T} with two specific examples.`,answer:`${T} rests on foundational principles collectively defining its scope, methods, and explanatory power. Understanding requires grasping WHY principles hold — not just what they state. Example 1 illustrates core principles in a real situation. Example 2 shows the mechanism in a different context. Together they confirm ${T} is a structured reasoning framework, not merely a catalogue of facts.`},
      {question:`Describe a professional scenario where deep knowledge of ${T} produces better outcomes.`,answer:`A professional facing a problem involving ${T} approaches it systematically: diagnosing using ${T} principles, analysing key variables, predicting outcomes, selecting the optimal approach, and verifying reasoning. This systematic process consistently outperforms intuitive guesswork and anticipates consequences invisible without ${T} expertise.`},
    ],
    real_world_applications:[
      `Healthcare: ${T} informs clinical reasoning and diagnostic protocols.`,
      `Technology: ${T} principles underpin system architecture and engineering decisions.`,
      `Business: Strategic planning draws on ${T} frameworks for better decisions.`,
      `Policy: Government agencies apply ${T} reasoning to design evidence-based interventions.`,
    ],
    common_misconceptions:[
      `❌ MYTH: Memorising ${T} facts equals understanding. ✅ TRUTH: Real mastery means grasping causal relationships and applying them to new problems.`,
      `❌ MYTH: Re-reading notes is effective for ${T}. ✅ TRUTH: Active retrieval outperforms re-reading by 200–300%.`,
      `❌ MYTH: ${T} is only for specialists. ✅ TRUTH: ${T} reasoning transfers across many domains.`,
    ],
  };

  if(tool==='flashcards'||tool==='all'){
    base.flashcards=[
      {front:`What is the precise definition of ${T}?`,back:`${T} is defined as the systematic study of its core domain. The definition specifies exactly what is and isn't included, distinguishing ${T} from related fields. Understanding WHY the definition takes this form is the foundation of genuine mastery.`},
      {front:`What are the most fundamental principles of ${T}?`,back:`The foundational principles of ${T}: (1) Core framework establishing the basic structure; (2) Primary mechanism governing core processes; (3) Key relationships determining connections; (4) Boundary conditions defining limits; (5) Contextual connections linking ${T} to broader fields.`},
      {front:`Explain the primary mechanism of ${T} step by step.`,back:`Mechanism of ${T}: Step 1 → identify initial conditions. Step 2 → triggering input occurs. Step 3 → primary transformation begins. Step 4 → intermediate stages form. Step 5 → observable outcome emerges. Understanding WHY each step follows is what separates genuine understanding from surface familiarity.`},
    ];
  }
  if(tool==='quiz'||tool==='all'){
    base.quiz_questions=[
      {id:1,question:`Which statement BEST describes the central focus of ${T}?`,options:['A systematic framework for understanding through evidence-based reasoning','A collection of memorised facts recalled on demand','A purely historical record with limited relevance','An intuitive skill developed only through experience'],correct_answer:'A systematic framework for understanding through evidence-based reasoning',explanation:`${T} is fundamentally a systematic framework for reasoning — not fact collection. This framework allows knowledge to transfer to new situations, which memorisation alone cannot achieve.`,difficulty:'easy'},
      {id:2,question:`A student re-read ${T} notes five times. What does learning research predict?`,options:['Excellent performance — re-reading builds understanding','Potential underperformance — re-reading creates familiarity not durable knowledge','Performance depends on exam difficulty','Strong performance if passages were highlighted'],correct_answer:'Potential underperformance — re-reading creates familiarity not durable knowledge',explanation:`Re-reading ${T} creates "illusion of fluency." Active retrieval dramatically outperforms re-reading for durable retention. Familiarity alone fails when exams require novel application.`,difficulty:'medium'},
    ];
  }
  if(tool==='mindmap'||tool==='all'){
    base.mindmap={
      central:topicWords,
      branches:[
        {name:'Core Concepts',color:'#00d4ff',items:[`Definition of ${T}`,'Foundational principles','Key terminology','Theoretical framework']},
        {name:'Mechanisms',color:'#bf00ff',items:['Primary mechanism','Step-by-step process','Key variables','Cause-effect chains']},
        {name:'Applications',color:'#00ff88',items:['Professional practice','Healthcare uses','Technology applications','Business strategy']},
        {name:'Common Pitfalls',color:'#ffae00',items:['Top misconception','Overgeneralisation','Ignoring edge cases','Surface vs deep learning']},
        {name:'Study Strategy',color:'#d4af37',items:['Active recall','Spaced repetition','Feynman technique','Self-testing']},
      ],
      connections:[
        {from:'Core Concepts',to:'Mechanisms',description:`Principles explain how ${T} mechanisms operate`},
        {from:'Mechanisms',to:'Applications',description:`${T} mechanisms enable real-world use`},
        {from:'Core Concepts',to:'Common Pitfalls',description:'Misunderstanding concepts causes errors'},
      ],
    };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC FACT
// ─────────────────────────────────────────────────────────────────────────────

const FACT_TEMPLATES=[
  t=>`💡 Did you know? People who quiz themselves on "${t}" retain 2–3× more than those who re-read notes.`,
  t=>`🧠 Fun fact: Explaining "${t}" out loud is one of the fastest ways to find gaps in your knowledge.`,
  t=>`⏰ Quick tip: Reviewing "${t}" at intervals (1, 3, 7, 14, 30 days) beats any single cramming session.`,
  t=>`📊 Interesting: Topics like "${t}" are remembered better when connected to something you already know.`,
  t=>`🎯 Study fact: Most learners overestimate how well they know "${t}" — testing reveals real gaps.`,
  t=>`🔍 Pro tip: Find the 20% of core ideas in "${t}" that explain 80% of everything else.`,
  t=>`📝 Did you know? Writing "${t}" from memory — even badly — teaches more than reading it again.`,
  t=>`🌍 Worth noting: "${t}" connects to more fields than it first appears — that's where hard questions come from.`,
];

function buildTopicFact(topic){
  const t=String(topic||'this topic').trim().slice(0,60);
  const idx=Math.abs([...t].reduce((h,ch)=>(h*31+ch.charCodeAt(0))%100000,7))%FACT_TEMPLATES.length;
  return FACT_TEMPLATES[idx](t);
}

// ─────────────────────────────────────────────────────────────────────────────
// MERGE
// ─────────────────────────────────────────────────────────────────────────────

function mergeCards(cardsRaw, notes, topic, opts) {
  const isFallback=!!cardsRaw?._fallback;
  const merged={
    topic:String(topic||cardsRaw?.topic||'Study Material').slice(0,200),
    curriculum_alignment:cardsRaw?.curriculum_alignment||'General Academic Study',
    ultra_long_notes:notes||'',
    key_concepts:cardsRaw?.key_concepts||[],
    key_tricks:cardsRaw?.key_tricks||[],
    practice_questions:cardsRaw?.practice_questions||[],
    real_world_applications:cardsRaw?.real_world_applications||[],
    common_misconceptions:cardsRaw?.common_misconceptions||[],
    study_score:cardsRaw?.study_score||95,
    powered_by:`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`,
    generated_at:getISTDateTime(),
    _version:SAVOIRÉ.VERSION, _tool:opts.tool, _language:opts.language||'English',
    _depth:opts.depth||'detailed', _style:opts.style||'simple',
    _quality:isFallback?'enhanced_fallback':'ai_generated', _fallback:isFallback,
  };
  if(Array.isArray(cardsRaw?.flashcards)&&cardsRaw.flashcards.length)    merged.flashcards    =cardsRaw.flashcards;
  if(Array.isArray(cardsRaw?.quiz_questions)&&cardsRaw.quiz_questions.length) merged.quiz_questions=cardsRaw.quiz_questions;
  if(cardsRaw?.mindmap?.branches?.length)                                 merged.mindmap       =cardsRaw.mindmap;
  if(!merged.key_concepts?.length){
    merged.key_concepts=[
      `Core Principles: ${topic} rests on fundamental principles connecting theory to practice.`,
      `Key Mechanisms: Primary processes follow identifiable patterns that can be learned systematically.`,
      `Practical Transfer: ${topic} knowledge applies to healthcare, technology, business, and research.`,
      `Expert Thinking: Experts in ${topic} differ from beginners in pattern recognition and conditional reasoning.`,
      `Learning Strategy: Active retrieval is 2–3× more effective than re-reading for mastering ${topic}.`,
    ];
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE HELPER
// ─────────────────────────────────────────────────────────────────────────────

function makeSSE(res){
  return (event,data)=>{
    if(res.writableEnded) return;
    try{
      res.write(`event: ${event}\ndata: ${typeof data==='string'?data:JSON.stringify(data)}\n\n`);
      if(typeof res.flush==='function') res.flush();
    } catch { /* client disconnected */ }
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
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req,res){
  const reqId=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const startTime=Date.now();
  log.info(`[${reqId}] ${req.method} /api/study`);

  setHeaders(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST')    return res.status(405).json({error:'Use POST.'});

  // API KEY CHECK
  if(!process.env.OPENROUTER_API_KEY){
    log.error('[FATAL] OPENROUTER_API_KEY not set!');
    return res.status(500).json({error:'Service misconfigured — API key missing. Contact admin.'});
  }

  const body=req.body||{};
  const message   =String(body.message   ||'').trim();
  const userName  =String(body.userName  ||'Anonymous').trim();
  const userStreak=Number(body.streak)   ||0;
  const userSess  =Number(body.sessions) ||1;
  const sessionId =String(body.sessionId ||reqId);

  // PING
  if(!message||message==='ping'){
    sendToGoogleSheets(userName,userStreak,userSess,'visit','','online',0,sessionId).catch(()=>{});
    return res.status(200).json({status:'ok',service:SAVOIRÉ.BRAND,version:SAVOIRÉ.VERSION,tagline:SAVOIRÉ.TAGLINE,time:getISTDateTime(),requestId:reqId});
  }

  if(message.length<2)     return res.status(400).json({error:'Topic too short (min 2 chars).'});
  if(message.length>20000) return res.status(400).json({error:'Input too long (max 20,000 chars).'});

  const rawOpts=body.options||{};
  const opts={
    tool:     ['notes','flashcards','quiz','summary','mindmap','all'].includes(rawOpts.tool)?rawOpts.tool:'notes',
    depth:    ['standard','detailed','comprehensive','expert'].includes(rawOpts.depth)?rawOpts.depth:'detailed',
    style:    ['simple','academic','detailed','exam','visual'].includes(rawOpts.style)?rawOpts.style:'simple',
    language: String(rawOpts.language||'English').trim().slice(0,60),
    stream:   rawOpts.stream===true,
    // Wizard tool-specific options
    cardCount:   Number(rawOpts.cardCount)  ||15,
    quizCount:   Number(rawOpts.quizCount)  ||10,
    quizType:    String(rawOpts.quizType    ||'mixed'),
    branchCount: Number(rawOpts.branchCount)||6,
  };

  log.info(`[${reqId}] tool:${opts.tool} | depth:${opts.depth} | lang:${opts.language} | cards:${opts.cardCount} | quiz:${opts.quizCount}(${opts.quizType}) | branches:${opts.branchCount}`);

  if(!opts.stream) return res.status(400).json({error:'Streaming required. Send options.stream=true.'});

  sendToGoogleSheets(userName,userStreak,userSess,opts.tool,message,'started',0,sessionId).catch(()=>{});

  // SSE HEADERS
  res.setHeader('Content-Type','text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control','no-cache, no-store, must-revalidate, no-transform');
  res.setHeader('Connection','keep-alive');
  res.setHeader('X-Accel-Buffering','no');
  if(typeof res.flushHeaders==='function') res.flushHeaders();

  const sse=makeSSE(res);

  // Keepalive every 10s
  const kap=setInterval(()=>{
    if(res.writableEnded){clearInterval(kap);return;}
    try{res.write(`: ping ${Date.now()}\n\n`);if(typeof res.flush==='function')res.flush();}
    catch{clearInterval(kap);}
  },10000);

  // Auto stage timers
  const stageTimers=[
    setTimeout(()=>sse('stage',{idx:1,label:'📝 Writing your content…'}),2500),
    setTimeout(()=>sse('stage',{idx:2,label:'🔍 Building sections…'}),7000),
  ];
  const clearStages=()=>stageTimers.forEach(clearTimeout);

  // Initial events
  sse('heartbeat',{ts:Date.now(),status:'connected',service:SAVOIRÉ.BRAND,requestId:reqId,tool:opts.tool});
  sse('stage',{idx:0,label:`🎯 Analysing "${message.slice(0,50)}${message.length>50?'…':''}"`});
  sse('fact',{fact:buildTopicFact(message)});
  sse('token',{t:''}); // prime

  let notes='', p1ok=false;

  try {
    // ══════════════════════════════════════════════════════════════════════
    // PHASE 1 + PHASE 2 RUN IN PARALLEL
    // Phase 1 streams notes live to user.
    // Phase 2 races all models simultaneously in background.
    // Result: by the time P1 finishes, P2 is often already done!
    // ══════════════════════════════════════════════════════════════════════
    sse('stage',{idx:1,label:`📝 Writing ${opts.tool==='summary'?'smart summary':'study notes'}…`});

    const notesPrompt = buildNotesPrompt(message, opts);

    // Start Phase 2 IMMEDIATELY (don't wait for Phase 1 to finish)
    const cardsPromise = (async () => {
      if(opts.tool==='all'){
        const [fcqRes,mmRes]=await Promise.allSettled([
          fetchCards(buildCardsPrompt(message,opts,'flashcards_quiz'),'flashcards_quiz'),
          fetchCards(buildCardsPrompt(message,opts,'mindmap_only'),   'mindmap_only'),
        ]);
        const combined={};
        if(fcqRes.status==='fulfilled'&&fcqRes.value){
          const v=fcqRes.value;
          if(v.flashcards?.length)              combined.flashcards            =v.flashcards;
          if(v.quiz_questions?.length)          combined.quiz_questions        =v.quiz_questions;
          if(v.key_concepts?.length)            combined.key_concepts          =v.key_concepts;
          if(v.key_tricks?.length)              combined.key_tricks            =v.key_tricks;
          if(v.practice_questions?.length)      combined.practice_questions    =v.practice_questions;
          if(v.real_world_applications?.length) combined.real_world_applications=v.real_world_applications;
          if(v.common_misconceptions?.length)   combined.common_misconceptions =v.common_misconceptions;
          if(v.topic)                           combined.topic                 =v.topic;
          if(v.study_score)                     combined.study_score           =v.study_score;
        } else log.warn(`Mega P2a fail: ${fcqRes.reason?.message}`);
        if(mmRes.status==='fulfilled'&&mmRes.value?.mindmap){
          combined.mindmap=mmRes.value.mindmap;
          if(!combined.key_concepts?.length&&mmRes.value.key_concepts?.length) combined.key_concepts=mmRes.value.key_concepts;
        } else log.warn(`Mega P2b fail: ${mmRes.reason?.message}`);
        return combined;
      } else {
        return await fetchCards(buildCardsPrompt(message,opts),opts.tool);
      }
    })();

    // Phase 1 — stream notes while Phase 2 runs in background
    try {
      notes = await streamNotes(notesPrompt, chunk=>sse('token',{t:chunk}), opts.tool);
      p1ok  = true;
      log.ok(`[${reqId}] P1 done — ${notes.length}ch`);
      sse('stage',{idx:2,label:'✅ Notes done! Loading cards…'});
    } catch(e1){
      log.error(`[${reqId}] P1 FAILED: ${e1.message}`);
      notes=offlineNotes(message);
      for(let i=0;i<notes.length;i+=300){sse('token',{t:notes.slice(i,i+300)});await sleep(4);}
      p1ok=false;
      sse('stage',{idx:2,label:'⚠️ Cached notes — loading cards…'});
    }

    // Wait for Phase 2 (likely already done since it ran in parallel!)
    sse('stage',{idx:3,label:'🃏 Loading interactive cards…'});
    let cardsData=null, p2ok=false;
    try {
      cardsData = await cardsPromise;
      p2ok = !!(cardsData && (cardsData.flashcards?.length||cardsData.quiz_questions?.length||cardsData.mindmap||cardsData.key_concepts?.length));
      log.ok(`[${reqId}] P2 done — fc:${cardsData?.flashcards?.length||0} q:${cardsData?.quiz_questions?.length||0} mm:${cardsData?.mindmap?.branches?.length||0}`);
    } catch(e2){
      log.error(`[${reqId}] P2 FAILED: ${e2.message} — using fallback`);
      cardsData=buildTopicFallback(opts.tool,message);
      p2ok=false;
    }
    if(!p2ok||!cardsData){
      cardsData=buildTopicFallback(opts.tool,message);
    }

    // PHASE 3 — Stream cards live
    if(cardsData?.flashcards?.length&&(opts.tool==='flashcards'||opts.tool==='all')){
      sse('stage',{idx:3,label:`🃏 Streaming ${cardsData.flashcards.length} flashcards…`});
      for(let i=0;i<cardsData.flashcards.length;i++){
        sse('card',{idx:i,total:cardsData.flashcards.length,card:cardsData.flashcards[i]});
        await sleep(60);
      }
    }
    if(cardsData?.quiz_questions?.length&&(opts.tool==='quiz'||opts.tool==='all')){
      sse('stage',{idx:3,label:`❓ Streaming ${cardsData.quiz_questions.length} quiz questions…`});
      for(let i=0;i<cardsData.quiz_questions.length;i++){
        sse('question',{idx:i,total:cardsData.quiz_questions.length,q:cardsData.quiz_questions[i]});
        await sleep(70);
      }
    }
    if(cardsData?.mindmap?.branches?.length&&(opts.tool==='mindmap'||opts.tool==='all')){
      sse('stage',{idx:3,label:`🗺️ Streaming ${cardsData.mindmap.branches.length} branches…`});
      sse('branch',{idx:-1,total:cardsData.mindmap.branches.length,branch:{name:'_central_',value:cardsData.mindmap.central,connections:cardsData.mindmap.connections||[]}});
      await sleep(60);
      for(let i=0;i<cardsData.mindmap.branches.length;i++){
        sse('branch',{idx:i,total:cardsData.mindmap.branches.length,branch:cardsData.mindmap.branches[i]});
        await sleep(80);
      }
    }

    // FINAL
    clearInterval(kap); clearStages();
    const final=mergeCards(cardsData,notes,message,opts);
    final._duration_ms =Date.now()-startTime;
    final._request_id  =reqId;
    final._phase1_ok   =p1ok;
    final._phase2_ok   =p2ok;
    final.topic_fact   =buildTopicFact(message);
    final.powered_by   =`${SAVOIRÉ.BRAND} by ${SAVOIRÉ.DEVELOPER}`;

    sse('stage',{idx:4,label:'✅ Complete! All study materials ready.',done:true});
    sse('done',final);

    log.ok(`[${reqId}] ✅ COMPLETE — ${final._duration_ms}ms | p1:${p1ok} | p2:${p2ok} | tool:${opts.tool}`);
    sendToGoogleSheets(userName,userStreak,userSess,opts.tool,message,'completed',final._duration_ms,sessionId).catch(()=>{});

  } catch(fatal){
    clearInterval(kap); clearStages();
    log.error(`[${reqId}] FATAL: ${fatal.message}`);
    sse('error',{error:'Savoiré AI is momentarily unavailable. Please try again.',requestId:reqId});
    sendToGoogleSheets(userName,userStreak,userSess,opts.tool,message,'failed',Date.now()-startTime,sessionId).catch(()=>{});
  }

  if(!res.writableEnded) res.end();
};
