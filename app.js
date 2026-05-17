/**
 * ═══════════════════════════════════════════════════════════════
 * Savoiré AI v2.1 — STUDENT STUDY PLATFORM
 * ═══════════════════════════════════════════════════════════════
 * Developer: Sooban Talha Technologies (soobantalhatech.xyz)
 * Founder: Sooban Talha
 * Website: Savoiré AI.vercel.app
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

// Import Study Engine
const { SavoireStudyEngine, CONFIG } = require('./api/study');

// ═══════════════════════════════════════════════
// INITIALIZE APP
// ═══════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize AI Engine
const studyEngine = new SavoireStudyEngine(
    process.env.OPENROUTER_API_KEY || 'sk-or-v1-your-key-here'
);

// ═══════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════
// IN-MEMORY STORAGE (Local, no database needed)
// ═══════════════════════════════════════════════
const storage = {
    history: [],        // Recent generations
    totalGenerated: 0,  // Total count
    streak: 0,          // Daily streak
    lastUsedDate: null, // For streak tracking
};

// ═══════════════════════════════════════════════
// STREAK TRACKER
// ═══════════════════════════════════════════════
function updateStreak() {
    const today = new Date().toDateString();
    
    if (storage.lastUsedDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (storage.lastUsedDate === yesterday) {
            storage.streak++; // Continue streak
        } else {
            storage.streak = 1; // Reset streak
        }
        
        storage.lastUsedDate = today;
    }
    
    return storage.streak;
}

// ═══════════════════════════════════════════════
// SERVE DASHBOARD
// ═══════════════════════════════════════════════
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ═══════════════════════════════════════════════
// GET ALL TOOLS LIST
// ═══════════════════════════════════════════════
app.get('/api/tools', (req, res) => {
    res.json({
        success: true,
        tools: CONFIG.TOOLS,
    });
});

// ═══════════════════════════════════════════════
// GET HISTORY
// ═══════════════════════════════════════════════
app.get('/api/history', (req, res) => {
    res.json({
        success: true,
        history: storage.history.slice(0, 50), // Last 50
        totalGenerated: storage.totalGenerated,
    });
});

// ═══════════════════════════════════════════════
// CLEAR HISTORY
// ═══════════════════════════════════════════════
app.delete('/api/history', (req, res) => {
    storage.history = [];
    res.json({
        success: true,
        message: 'History cleared.',
    });
});

// ═══════════════════════════════════════════════
// GET STREAK INFO
// ═══════════════════════════════════════════════
app.get('/api/streak', (req, res) => {
    res.json({
        success: true,
        streak: storage.streak,
        totalGenerated: storage.totalGenerated,
    });
});

// ═══════════════════════════════════════════════
// MAIN GENERATION ENDPOINT (LIVE STREAMING)
// ═══════════════════════════════════════════════
app.post('/api/generate/:toolId', async (req, res) => {
    try {
        const { toolId } = req.params;
        const { topic } = req.body;
        const toolIdNum = parseInt(toolId);

        // Validate tool ID
        if (isNaN(toolIdNum) || toolIdNum < 1 || toolIdNum > 10) {
            return res.status(400).json({
                success: false,
                error: `Invalid tool ID. Must be between 1 and 10.`,
            });
        }

        // Validate topic
        if (!topic || topic.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a topic with at least 2 characters.',
            });
        }

        const cleanTopic = topic.trim();
        const tool = CONFIG.TOOLS.find(t => t.id === toolIdNum);

        // Update streak
        updateStreak();
        storage.totalGenerated++;

        // Add to history
        const historyEntry = {
            id: crypto.randomUUID(),
            toolId: toolIdNum,
            toolName: tool.name,
            toolIcon: tool.icon,
            topic: cleanTopic,
            timestamp: new Date().toISOString(),
        };
        storage.history.unshift(historyEntry);

        // Set SSE headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        let fullOutput = '';

        // Stream generation word by word
        try {
            const generator = studyEngine.generate(toolIdNum, cleanTopic);
            
            for await (const chunk of generator) {
                if (chunk.type === 'word') {
                    fullOutput = chunk.fullText;
                    res.write(`data: ${JSON.stringify({
                        type: 'word',
                        content: chunk.content,
                        fullText: fullOutput,
                    })}\n\n`);
                } else if (chunk.type === 'complete') {
                    fullOutput = chunk.fullText;
                    res.write(`data: ${JSON.stringify({
                        type: 'complete',
                        fullText: fullOutput,
                        metadata: chunk.metadata,
                    })}\n\n`);
                } else if (chunk.type === 'error') {
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        error: chunk.message,
                    })}\n\n`);
                }
            }
        } catch (streamError) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Stream interrupted. Please try again.',
            })}\n\n`);
        }

        // Save final output to history
        if (fullOutput) {
            historyEntry.output = fullOutput;
            // Update in history array
            const index = storage.history.findIndex(h => h.id === historyEntry.id);
            if (index !== -1) {
                storage.history[index] = historyEntry;
            }
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

    } catch (error) {
        console.error('[SAVOIRE] Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Generation failed. Please try again.',
            });
        }
    }
});

// ═══════════════════════════════════════════════
// PDF DOWNLOAD ENDPOINT
// ═══════════════════════════════════════════════
app.post('/api/download/pdf', (req, res) => {
    try {
        const { content, topic, toolName } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'No content to download.',
            });
        }

        // Create PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: `${topic} - Savoiré AI Study Notes`,
                Author: 'Savoiré AI v2.1',
                Creator: 'Sooban Talha Technologies',
            },
        });

        // Set response headers
        const filename = `${topic.replace(/[^a-zA-Z0-9]/g, '_')}_Savoiré AI.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);

        // ── PDF Styling ───────────────────────────
        
        // Background
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0A0A14');

        // Header bar
        doc.rect(0, 0, doc.page.width, 80).fill('#020207');
        
        // Logo text
        doc.fontSize(18).fillColor('#4A90FF')
           .font('Helvetica-Bold')
           .text('Savoiré AI v2.1', 50, 25);
        
        doc.fontSize(8).fillColor('#6B7280')
           .font('Helvetica')
           .text('Dark Ultra Premium Edition', 50, 48);

        // Tool & Topic info
        doc.fontSize(10).fillColor('#9CA3AF')
           .text(`${toolName || 'Study Notes'}`, 50, 90);
        
        doc.fontSize(16).fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text(topic || 'Untitled', 50, 108);

        // Divider
        doc.moveTo(50, 135).lineTo(545, 135).strokeColor('#4A90FF').stroke();

        // Content
        doc.fontSize(10).fillColor('#D1D5DB')
           .font('Helvetica')
           .text(content, 50, 155, {
               width: 495,
               lineGap: 4,
           });

        // Footer
        const footerY = doc.page.height - 50;
        doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).strokeColor('#1F2937').stroke();
        
        doc.fontSize(7).fillColor('#4B5563')
           .text('Generated by Savoiré AI v2.1', 50, footerY)
           .text('Developer: Sooban Talha Technologies (soobantalhatech.xyz)', 50, footerY + 12)
           .text(`Founder: Sooban Talha | ${new Date().toLocaleDateString()}`, 50, footerY + 24);

        doc.end();

    } catch (error) {
        console.error('[SAVOIRE] PDF Error:', error);
        res.status(500).json({
            success: false,
            error: 'PDF generation failed.',
        });
    }
});

// ═══════════════════════════════════════════════
// PLAIN TEXT DOWNLOAD
// ═══════════════════════════════════════════════
app.post('/api/download/text', (req, res) => {
    try {
        const { content, topic } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'No content to download.',
            });
        }

        const filename = `${topic.replace(/[^a-zA-Z0-9]/g, '_')}_Savoiré AI.txt`;
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Download failed.',
        });
    }
});

// ═══════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        version: '2.1.0',
        edition: 'Dark Ultra Premium',
        developer: 'Sooban Talha Technologies',
        website: 'Savoiré AI.vercel.app',
        developerSite: 'soobantalhatech.xyz',
        founder: 'Sooban Talha',
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        totalGenerated: storage.totalGenerated,
        streak: storage.streak,
        tools: CONFIG.TOOLS.length,
    });
});

// ═══════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found.',
        code: 'NOT_FOUND',
    });
});

// ═══════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════
app.use((err, req, res, next) => {
    console.error('[SAVOIRE] Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error.',
        code: 'SERVER_ERROR',
    });
});

// ═══════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ✦ Savoiré AI v2.1 — SERVER STARTED ✦                     ║
║                                                              ║
║   Edition:    Dark Ultra Premium                             ║
║   Port:       ${PORT}                                          ║
║   URL:        http://localhost:${PORT}                          ║
║   Tools:      10 Premium AI Tools                            ║
║   Model:      Llama 3.3 70B (Free)                          ║
║                                                              ║
║   Developer:  Sooban Talha Technologies                      ║
║   Website:    Savoiré AI.vercel.app                           ║
║   Dev Site:   soobantalhatech.xyz                           ║
║   Founder:    Sooban Talha                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;