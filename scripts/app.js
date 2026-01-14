class SavoirePro {
    constructor() {
        this.state = {
            currentChatId: Date.now(),
            history: JSON.parse(localStorage.getItem('savoire_history')) || [],
            isGenerating: false,
            currentImage: null // Base64 string
        };
        
        this.init();
    }

    init() {
        // DOM Elements
        this.elements = {
            input: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            chatScroll: document.getElementById('chatMessages'),
            notesContent: document.getElementById('notesContent'),
            notesLoader: document.getElementById('notesLoader'),
            historyList: document.getElementById('historyList'),
            fileInput: document.getElementById('fileInput'),
            attachBtn: document.getElementById('attachBtn'),
            imagePreview: document.getElementById('imagePreviewContainer'),
            welcomeHero: document.getElementById('welcomeHero')
        };

        // Event Listeners
        this.elements.sendBtn.addEventListener('click', () => this.handleSend());
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Sidebar & UI
        document.getElementById('newChatBtn').addEventListener('click', () => this.startNewChat());
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // Image Upload
        this.elements.attachBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Initial Render
        this.renderHistory();
        
        // Setup Markdown & Math
        this.md = window.marked;
        this.md.setOptions({
            breaks: true,
            highlight: function(code, lang) {
                return code; // Simplified for speed
            }
        });
    }

    // --- Core Logic ---

    async handleSend() {
        const text = this.elements.input.value.trim();
        if ((!text && !this.state.currentImage) || this.state.isGenerating) return;

        // UI Updates
        this.elements.input.value = '';
        this.elements.welcomeHero.classList.add('hidden');
        this.state.isGenerating = true;
        this.elements.sendBtn.disabled = true;
        this.elements.notesLoader.classList.remove('hidden');

        // Add User Message
        this.addMessageToChat(text, 'user', this.state.currentImage);
        const imagePayload = this.state.currentImage; 
        
        // Clear Image State
        this.state.currentImage = null;
        this.elements.imagePreview.innerHTML = '';
        this.elements.imagePreview.classList.add('hidden');

        try {
            // Call API
            const response = await fetch('/api/study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    image: imagePayload, // Send Base64 if exists
                    history: this.getCurrentChatHistory() // Context
                })
            });

            const data = await response.json();

            // Add AI Message (Brief response in chat)
            this.addMessageToChat("I've updated the Live Notes with a detailed analysis.", 'ai');

            // Update Notes Panel (The "Pro" feature)
            this.updateNotesPanel(data);
            
            // Save to History
            this.saveToHistory(text, data.topic || "Study Session");

        } catch (error) {
            console.error(error);
            this.addMessageToChat("Connection error. Please try again.", 'ai');
        } finally {
            this.state.isGenerating = false;
            this.elements.sendBtn.disabled = false;
            this.elements.notesLoader.classList.add('hidden');
        }
    }

    addMessageToChat(text, role, image = null) {
        const div = document.createElement('div');
        div.className = `msg ${role}`;
        
        let imgHtml = image ? `<img src="${image}" class="msg-img-preview">` : '';
        
        div.innerHTML = `
            <div class="msg-avatar">
                ${role === 'user' ? '<i class="fas fa-user"></i>' : '<img src="LOGO.png" width="15">'}
            </div>
            <div class="msg-content">
                ${imgHtml}
                <div>${text || (image ? 'Sent an image' : '')}</div>
            </div>
        `;
        
        this.elements.chatScroll.appendChild(div);
        this.elements.chatScroll.scrollTop = this.elements.chatScroll.scrollHeight;
    }

    updateNotesPanel(data) {
        // Render Markdown + Math
        const rawMarkdown = data.ultra_long_notes || "**No content generated.**";
        const htmlContent = this.md.parse(rawMarkdown);
        
        this.elements.notesContent.innerHTML = htmlContent;
        
        // Render Math (KaTeX)
        renderMathInElement(this.elements.notesContent, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });

        // Update Header
        document.getElementById('currentTopic').innerText = data.topic || "Analysis";
    }

    // --- Image Handling (Vision) ---
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.state.currentImage = event.target.result; // Base64
            
            // Show Preview
            this.elements.imagePreview.classList.remove('hidden');
            this.elements.imagePreview.innerHTML = `
                <img src="${this.state.currentImage}" class="thumb">
                <button onclick="app.clearImage()" style="background:none;border:none;color:red"><i class="fas fa-times"></i></button>
            `;
        };
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.state.currentImage = null;
        this.elements.imagePreview.innerHTML = '';
        this.elements.imagePreview.classList.add('hidden');
        this.elements.fileInput.value = '';
    }

    // --- History & PDF ---
    saveToHistory(query, topic) {
        // Update current session or add new
        const exists = this.state.history.find(h => h.id === this.state.currentChatId);
        if (!exists) {
            this.state.history.unshift({
                id: this.state.currentChatId,
                title: topic,
                date: new Date().toLocaleDateString()
            });
            localStorage.setItem('savoire_history', JSON.stringify(this.state.history));
            this.renderHistory();
        }
    }

    renderHistory() {
        this.elements.historyList.innerHTML = this.state.history.map(h => `
            <div class="history-item" onclick="app.loadSession(${h.id})">
                <i class="fas fa-comment-alt"></i> ${h.title}
            </div>
        `).join('');
    }

    startNewChat() {
        this.state.currentChatId = Date.now();
        this.elements.chatScroll.innerHTML = '';
        this.elements.chatScroll.appendChild(this.elements.welcomeHero);
        this.elements.welcomeHero.classList.remove('hidden');
        this.elements.notesContent.innerHTML = `<div class="empty-notes-state"><p>Ready for a new topic...</p></div>`;
        document.getElementById('currentTopic').innerText = "New Session";
    }

    quickPrompt(text) {
        this.elements.input.value = text;
        this.handleSend();
    }

    getCurrentChatHistory() {
        // Simple context grabber
        return []; // Implement if needed for multi-turn context
    }

    downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Simple Text Strip for V2 - For ultra-complex layout we usually need html2canvas
        // But for "Code" reliability, let's grab the text content cleanly
        const title = document.getElementById('currentTopic').innerText;
        const body = this.elements.notesContent.innerText;
        
        doc.setFontSize(20);
        doc.setTextColor(255, 215, 0); // Gold
        doc.text("SAVOIRÉ AI NOTES", 10, 15);
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 10, 25);
        
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(body, 180);
        doc.text(splitText, 10, 35);
        
        doc.save(`${title}_SavoireNotes.pdf`);
    }
}

// Initialize
const app = new SavoirePro();
window.app = app;