module.exports = async (req, res) => {
  // CORS & Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Input required' });
    }

    // THE ULTRA PROMPT (Enforcing Structure for Commerce/Math)
    const systemInstruction = `
    You are Savoiré AI v2.0, an elite academic assistant.
    Your Output MUST be a JSON object with this exact structure:
    {
      "topic": "Short Topic Title",
      "ultra_long_notes": "MARKDOWN STRING HERE"
    }

    GUIDELINES FOR 'ultra_long_notes':
    1. Use Markdown exclusively.
    2. For Math/Equations: Use LaTeX format enclosed in $ signs (e.g., $E = mc^2$).
    3. For Accountancy/Data: Use Markdown Tables.
    4. Structure:
       - # Main Title
       - ## Core Concept
       - ## Detailed Analysis (Bulleted lists, bold text)
       - ## Practical Application (Table or Code)
       - ## Key Takeaways
    5. Tone: Professional, Academic, and Ultra-Detailed.
    `;

    // Construct Messages for Vision Models
    // OpenRouter format for images: content: [{type: "text", text: ...}, {type: "image_url", ...}]
    let messagesPayload;
    if (image) {
      messagesPayload = [
        {
          role: "user",
          content: [
            { type: "text", text: message + " Analyze this image in detail as part of the study notes." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ];
    } else {
      messagesPayload = [{ role: 'user', content: systemInstruction + "\n\nUser Query: " + message }];
    }

    // Model List: Prioritize Models with Vision capabilities that are Free
    const models = [
      'google/gemini-2.0-flash-exp:free', // Best for Vision + Text
      'google/gemini-2.0-pro-exp-02-05:free',
      'deepseek/deepseek-r1:free', // Fallback for pure text
    ];

    let resultData = null;

    // Race logic (First success wins)
    for (const model of models) {
      try {
        console.log(`Attempting model: ${model}`);
        
        // Skip text-only models if image is present (simplified logic)
        if (image && model.includes('deepseek')) continue; 

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://savoireai.vercel.app',
            'X-Title': 'Savoiré AI'
          },
          body: JSON.stringify({
            model: model,
            messages: messagesPayload,
            temperature: 0.7,
            response_format: { type: "json_object" } // Force JSON
          })
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices[0].message.content;
          
          // Clean format if model adds markdown fence
          content = content.replace(/```json/g, '').replace(/```/g, '');
          
          resultData = JSON.parse(content);
          break; // Success
        }
      } catch (e) {
        console.error(`Model ${model} failed:`, e);
      }
    }

    if (!resultData) {
      // Fallback if AI fails
      resultData = {
        topic: "Analysis Failed",
        ultra_long_notes: "# Error\nCould not generate notes. Please try again."
      };
    }

    res.status(200).json(resultData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};