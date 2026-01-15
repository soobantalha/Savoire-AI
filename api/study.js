// study.js - Backend API
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { message, mode = 'explain' } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Processing request required' });
        }
        
        console.log(`Processing request (${mode}): ${message.substring(0, 100)}...`);
        
        const freeModels = [
            'google/gemini-2.0-flash-exp:free',
            'deepseek/deepseek-chat-v3.1:free',
            'meta-llama/llama-3.2-3b-instruct:free',
            'z-ai/glm-4.5-air:free'
        ];
        
        let lastError = null;
        
        for (const model of freeModels) {
            try {
                const response = await callProcessingAPI(message, mode, model);
                return res.status(200).json({
                    success: true,
                    content: response.content,
                    notes: response.notes,
                    mode: mode,
                    model: 'Savoiré AI Model Ultra v1.2',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.log(`Model ${model} failed: ${error.message}`);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        throw lastError || new Error('All processing models failed');
        
    } catch (error) {
        console.error('Processing error:', error);
        res.status(200).json({
            success: false,
            content: generateFallbackOutput(req.body?.message, req.body?.mode),
            notes: ['System processing temporarily limited. Full functionality will restore shortly.'],
            mode: req.body?.mode || 'explain',
            model: 'Savoiré AI Model Ultra v1.2',
            timestamp: new Date().toISOString()
        });
    }
};

async function callProcessingAPI(message, mode, model) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error('API configuration required');
    }
    
    const systemPrompts = {
        explain: `You are Savoiré AI Model Ultra v1.2. Provide comprehensive explanations with:
1. Clear overview and context
2. Key concepts with definitions
3. Detailed breakdown
4. Practical examples
5. Common applications
6. Limitations and considerations
7. Summary and next steps

Format with proper markdown, headings, and structure.`,
        
        analyze: `You are Savoiré AI Model Ultra v1.2. Provide analytical breakdown with:
1. Problem statement
2. Data/input analysis
3. Methodology explanation
4. Step-by-step process
5. Results interpretation
6. Insights and patterns
7. Conclusions
8. Recommendations

Use tables, bullet points, and structured formatting.`,
        
        generate: `You are Savoiré AI Model Ultra v1.2. Generate structured content with:
1. Clear objective
2. Requirements listing
3. Content generation
4. Quality checks
5. Optimization suggestions
6. Implementation steps
7. Testing procedures
8. Final output

Provide complete, production-ready content.`,
        
        code: `You are Savoiré AI Model Ultra v1.2. Generate code with:
1. Problem analysis
2. Algorithm design
3. Code implementation
4. Comments and documentation
5. Testing examples
6. Performance considerations
7. Alternative approaches
8. Usage instructions

Use proper syntax highlighting and formatting.`,
        
        math: `You are Savoiré AI Model Ultra v1.2. Solve mathematical problems with:
1. Problem restatement
2. Given information
3. Solution approach
4. Step-by-step working
5. Formulas and derivations
6. Numerical computation
7. Verification
8. Applications

Use LaTeX for all mathematical notation.`,
        
        summarize: `You are Savoiré AI Model Ultra v1.2. Create summaries with:
1. Source identification
2. Key point extraction
3. Main idea synthesis
4. Supporting details
5. Conclusion
6. Implications
7. Related concepts
8. Further reading

Be concise yet comprehensive.`
    };
    
    const requestBody = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompts[mode] || systemPrompts.explain },
            { role: 'user', content: message }
        ],
        max_tokens: 4000,
        temperature: 0.7
    };
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://savoireai.vercel.app',
            'X-Title': 'Savoiré AI'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from processing engine');
    }
    
    const content = data.choices[0].message.content;
    
    const notes = extractNotesFromContent(content);
    
    return {
        content: content,
        notes: notes
    };
}

function extractNotesFromContent(content) {
    const lines = content.split('\n');
    const notes = [];
    let currentSection = '';
    
    lines.forEach(line => {
        if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
            currentSection = line.replace(/^#+\s*/, '').trim();
        }
        
        if (line.includes('**') || line.match(/^\d+\./) || line.match(/^[-*]\s/)) {
            const cleanLine = line.replace(/[*_`]/g, '').trim();
            if (cleanLine.length > 20 && cleanLine.length < 200) {
                if (currentSection) {
                    notes.push(`${currentSection}: ${cleanLine}`);
                } else {
                    notes.push(cleanLine);
                }
            }
        }
    });
    
    return notes.slice(0, 10);
}

function generateFallbackOutput(message, mode) {
    const query = message ? message.substring(0, 150) : "the requested information";
    
    return `# Structured Knowledge Output

## Processing Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}

## Request Analysis
The system received a request to process: "${query}"

## Current System Status
- Processing engine: Savoiré AI Model Ultra v1.2
- Mode: ${mode}
- Time: ${new Date().toLocaleTimeString()}
- Status: Processing queued

## Standard Output Structure

### 1. Core Concept Explanation
A comprehensive breakdown of the topic would normally appear here with:
- Fundamental principles
- Key terminology definitions
- Conceptual frameworks
- Real-world applications

### 2. Detailed Analysis
This section would include:
- Methodological approach
- Step-by-step breakdown
- Data interpretation
- Pattern recognition

### 3. Practical Implementation
Typically contains:
- Actionable steps
- Best practices
- Common pitfalls
- Optimization techniques

### 4. Examples & Applications
Real-world scenarios including:
- Use cases
- Implementation examples
- Performance metrics
- Success criteria

### 5. Summary & Next Steps
Concluding with:
- Key takeaways
- Recommended actions
- Further learning paths
- Resource references

## Notes
1. This is a standard output template
2. Full processing will resume shortly
3. All formatting features remain available
4. Export and save functions are operational

---

*Generated by Savoiré AI v2.0 · Sooban Talha Technologies · ${new Date().toLocaleDateString()}*`;
}