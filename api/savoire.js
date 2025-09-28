import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});
app.use(limiter);

app.post('/study', async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Study topic is required' });
  }

  try {
    const studyMaterials = await generateStudyMaterials(topic);
    res.status(200).json(studyMaterials);
  } catch (error) {
    console.error('Study generation error:', error);
    const fallbackMaterials = generateFallbackStudyMaterials(topic);
    res.status(200).json(fallbackMaterials);
  }
});

// Enhanced AI study material generator
async function generateStudyMaterials(topic) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('API key not configured');
  }

  const studyPrompt = `As Savoiré AI - an expert educational assistant, generate comprehensive study materials for: "${topic}".

  Provide EXACTLY these 10 sections in JSON format:

  {
    "topic": "${topic}",
    "ultra_long_notes": "Very detailed explanation (800-1000 words)",
    "key_tricks": ["trick1", "trick2", "trick3", "trick4", "trick5"],
    "practice_questions": [
      {"question": "Q1", "answer": "A1"},
      {"question": "Q2", "answer": "A2"},
      {"question": "Q3", "answer": "A3"}
    ],
    "advanced_tricks": ["adv1", "adv2", "adv3"],
    "trick_notes": "Summary of all tricks and techniques",
    "short_notes": "Concise bullet points for quick revision",
    "advanced_questions": [
      {"question": "Advanced Q1", "answer": "Advanced A1"},
      {"question": "Advanced Q2", "answer": "Advanced A2"}
    ],
    "real_world_applications": ["app1", "app2", "app3"],
    "common_misconceptions": ["misconception1", "misconception2"],
    "recommended_resources": ["resource1", "resource2", "resource3"],
    "study_score": 85
  }`;

  const models = [
    'x-ai/grok-4-fast:free',
    'deepseek/deepseek-chat-v3.1:free',
    'deepseek/deepseek-r1-0528:free'
  ];

  for (const model of models) {
    try {
      const materials = await tryStudyModel(model, studyPrompt);
      if (materials) return materials;
    } catch (error) {
      console.log(`Model ${model} failed, trying next`);
    }
  }
  throw new Error('All models failed');
}

async function tryStudyModel(model, prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://savoire-ai.vercel.app',
      'X-Title': 'Savoiré AI'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`Model failed: ${response.status}`);

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const studyData = JSON.parse(jsonMatch[0]);
    studyData.powered_by = 'Savoiré AI by Sooban Talha Productions';
    studyData.generated_at = new Date().toISOString();
    return studyData;
  }
  throw new Error('No JSON found in response');
}

// Fallback study materials
function generateFallbackStudyMaterials(topic) {
  return {
    topic: topic,
    ultra_long_notes: `# Comprehensive Guide to ${topic}\n\nThis topic covers fundamental concepts that are essential for understanding advanced principles. Start with basics and gradually move to complex aspects.`,
    key_tricks: [
      "Use mnemonics for memorization",
      "Create mind maps for visual learning",
      "Practice with real-world examples",
      "Teach someone else to reinforce learning",
      "Use spaced repetition for long-term retention"
    ],
    practice_questions: [
      {"question": "What are the basic principles?", "answer": "The basic principles include..."},
      {"question": "How does this apply practically?", "answer": "Practical applications involve..."}
    ],
    advanced_tricks: ["Advanced technique 1", "Advanced technique 2"],
    trick_notes: "Combine multiple techniques for best results",
    short_notes: "• Key point 1\n• Key point 2\n• Key point 3",
    advanced_questions: [
      {"question": "Advanced application question?", "answer": "Detailed advanced answer"}
    ],
    real_world_applications: ["Industry use", "Research applications"],
    common_misconceptions: ["Common misunderstanding 1", "Common misunderstanding 2"],
    recommended_resources: ["Textbook Chapter 5", "Online course XYZ"],
    study_score: 82,
    powered_by: "Savoiré AI Fallback System"
  };
}

export default app;