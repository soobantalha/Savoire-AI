// Enhanced app.js with mobile optimizations
const topicInput = document.getElementById('topicInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const copyAllBtn = document.getElementById('copyAllBtn');
const printBtn = document.getElementById('printBtn');
const expandAllBtn = document.getElementById('expandAllBtn');

// Initialize luxury effects
function initLuxuryEffects() {
    createVIPParticles();
    initButtonEffects();
    initTopicChips();
    initMobileOptimizations();
}

// Mobile optimizations
function initMobileOptimizations() {
    // Focus input on mobile for better UX
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            topicInput.focus();
        }, 500);
    }
    
    // Add touch improvements
    document.querySelectorAll('button').forEach(btn => {
        btn.style.minHeight = '44px';
    });
}

// Create floating VIP particles
function createVIPParticles() {
    const particlesContainer = document.getElementById('vipParticles');
    const symbols = ['✦', '♔', '★', '⚜', '🎓', '📚', '✧', '♕'];
    
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'vip-particle';
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        particle.style.color = `rgba(255, 215, 0, ${Math.random() * 0.1 + 0.05})`;
        
        const size = Math.random() * 20 + 10;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 20 + 20;
        const rotation = Math.random() * 360;

        particle.style.cssText = `
            font-size: ${size}px;
            left: ${posX}%;
            top: ${posY}%;
            animation: floatVIP ${duration}s infinite ease-in-out ${delay}s;
            transform: rotate(${rotation}deg);
        `;

        particlesContainer.appendChild(particle);
    }
}

// Initialize button hover effects
function initButtonEffects() {
    document.querySelectorAll('.vip-btn, .action-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // Touch feedback for mobile
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        btn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Initialize topic chips
function initTopicChips() {
    document.querySelectorAll('.vip-topic-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const topic = this.getAttribute('data-topic');
            topicInput.value = topic;
            generateStudyMaterials();
        });
        
        // Mobile touch improvements
        chip.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        chip.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Generate study materials
async function generateStudyMaterials() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        showNotification('Please enter a study topic!', 'error');
        return;
    }

    // Show loading state
    showLoadingState(true);
    resultsContainer.innerHTML = '';
    resultsSection.style.display = 'block';

    try {
        console.log('Sending request for topic:', topic);
        
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: topic })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const studyData = await response.json();
        console.log('Received study data:', studyData);

        displayStudyResults(studyData);
        showNotification('Study materials generated successfully!', 'success');

    } catch (error) {
        console.error('Error generating study materials:', error);
        showNotification('Failed to generate study materials. Please try again.', 'error');
        
        // Show fallback demo data
        const demoData = generateDemoStudyMaterials(topic);
        displayStudyResults(demoData);
        showNotification('Showing demo data. API might be unavailable.', 'info');
    } finally {
        showLoadingState(false);
    }
}

// Generate demo data for testing
function generateDemoStudyMaterials(topic) {
    return {
        topic: topic,
        curriculum_alignment: "Demo Content - Curriculum Aligned",
        ultra_long_notes: `# Comprehensive Guide to ${topic}\n\n## Overview\nThis is a demonstration of how Savoiré AI presents study materials. When the API is properly configured, you'll receive real AI-generated content tailored to your specific topic.\n\n## Key Areas Covered\n- Fundamental principles and concepts\n- Practical applications and examples\n- Study techniques and strategies\n- Common challenges and solutions\n\n## Detailed Explanation\n${topic} represents an important area of study that combines theoretical knowledge with practical applications. Understanding the core concepts is essential for mastery and real-world implementation.`,
        key_concepts: [
            "Core Principles and Fundamentals",
            "Essential Terminology and Definitions",
            "Key Theories and Frameworks",
            "Practical Applications",
            "Common Use Cases"
        ],
        key_tricks: [
            "Memory techniques for better retention",
            "Problem-solving approaches",
            "Time management strategies",
            "Study schedule optimization",
            "Concept mapping methods"
        ],
        practice_questions: [
            {"question": "What are the fundamental concepts of " + topic + "?", "answer": "The fundamental concepts include core principles that form the foundation of this subject area, providing the basis for more advanced understanding."},
            {"question": "How can you apply " + topic + " in real-world scenarios?", "answer": "Real-world applications involve practical implementation of theoretical concepts to solve problems and create value in various contexts."},
            {"question": "What are the key benefits of understanding " + topic + "?", "answer": "Key benefits include improved problem-solving abilities, better decision-making, and enhanced analytical skills applicable across multiple domains."}
        ],
        advanced_tricks: ["Advanced analytical techniques", "Expert problem-solving frameworks", "Research methodology applications"],
        trick_notes: "Combine multiple learning approaches for optimal results. Use active recall and spaced repetition for long-term retention.",
        short_notes: "• Core concept summaries\n• Key formulas and principles\n• Important applications\n• Common pitfalls to avoid\n• Quick reference points",
        advanced_questions: [
            {"question": "Analyze the complex relationships within " + topic, "answer": "Complex relationships involve interconnected concepts that require systematic analysis and understanding of underlying patterns and principles."},
            {"question": "How would you approach advanced problem-solving in " + topic + "?", "answer": "Advanced problem-solving requires integrating multiple concepts, critical thinking, and systematic analysis of complex scenarios."}
        ],
        real_world_applications: ["Industry implementations", "Research applications", "Practical problem-solving scenarios"],
        common_misconceptions: ["Common misunderstandings about basic principles", "Frequently confused terminology and concepts"],
        exam_tips: ["Focus on understanding concepts thoroughly", "Practice with varied question types", "Manage time effectively during assessments"],
        recommended_resources: ["Comprehensive textbooks and guides", "Online learning platforms", "Practical workshops and courses"],
        study_score: 85,
        powered_by: "Savoiré AI Demo by Sooban Talha Productions",
        generated_at: new Date().toISOString()
    };
}

// Show/hide loading state
function showLoadingState(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    searchBtn.disabled = show;
    if (show) {
        searchBtn.innerHTML = '<span class="btn-text">Generating Materials...</span>';
    } else {
        searchBtn.innerHTML = '<span class="btn-text">Generate Study Materials</span>';
    }
}

// Display study results
function displayStudyResults(studyData) {
    const sections = [
        {
            title: '📚 Core Concepts & Fundamentals',
            content: studyData.ultra_long_notes,
            type: 'long-text',
            icon: '📚'
        },
        {
            title: '🎯 Key Concepts Breakdown',
            content: studyData.key_concepts,
            type: 'bubble-list',
            icon: '🎯'
        },
        {
            title: '💡 Smart Techniques & Tricks',
            content: studyData.key_tricks,
            type: 'card-list',
            icon: '💡'
        },
        {
            title: '❓ Practice Questions & Solutions',
            content: studyData.practice_questions,
            type: 'qa-grid',
            icon: '❓'
        },
        {
            title: '🚀 Advanced Strategies',
            content: studyData.advanced_tricks,
            type: 'highlight-list',
            icon: '🚀'
        },
        {
            title: '📝 Quick Revision Notes',
            content: studyData.short_notes,
            type: 'compact-text',
            icon: '📝'
        },
        {
            title: '🧠 Advanced Challenge Questions',
            content: studyData.advanced_questions,
            type: 'qa-advanced',
            icon: '🧠'
        },
        {
            title: '🌍 Real-World Applications',
            content: studyData.real_world_applications,
            type: 'application-cards',
            icon: '🌍'
        },
        {
            title: '⚠️ Common Pitfalls & Misconceptions',
            content: studyData.common_misconceptions,
            type: 'warning-list',
            icon: '⚠️'
        },
        {
            title: '📊 Exam Success Tips',
            content: studyData.exam_tips,
            type: 'tip-cards',
            icon: '📊'
        },
        {
            title: '🔗 Recommended Resources',
            content: studyData.recommended_resources,
            type: 'resource-links',
            icon: '🔗'
        }
    ];

    let html = `
        <div class="study-dashboard">
            <div class="dashboard-header">
                <div class="topic-main">
                    <h2>${studyData.topic}</h2>
                    <div class="topic-meta">
                        <span class="curriculum-badge">${studyData.curriculum_alignment}</span>
                        <span class="score-display">Mastery Score: ${studyData.study_score}/100</span>
                    </div>
                </div>
                <div class="progress-summary">
                    <div class="progress-circle">
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="35" stroke="#333" stroke-width="3" fill="none"></circle>
                            <circle cx="40" cy="40" r="35" stroke="#ffd700" stroke-width="3" fill="none" 
                                    stroke-dasharray="${2 * Math.PI * 35}" 
                                    stroke-dashoffset="${2 * Math.PI * 35 * (1 - studyData.study_score/100)}"
                                    transform="rotate(-90 40 40)"></circle>
                        </svg>
                        <span>${studyData.study_score}%</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
    `;

    sections.forEach((section, index) => {
        if (section.content && (!Array.isArray(section.content) || section.content.length > 0)) {
            html += `
                <div class="study-card" data-card-type="${section.type}">
                    <div class="card-header">
                        <span class="card-icon">${section.icon}</span>
                        <h3>${section.title}</h3>
                        <button class="card-toggle">+</button>
                    </div>
                    <div class="card-content">
                        ${formatSectionContent(section.content, section.type)}
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div>
            
            <div class="study-footer">
                <div class="completion-badge">
                    <span class="badge-icon">🏆</span>
                    <div class="badge-content">
                        <strong>Study Package Complete</strong>
                        <span>${studyData.powered_by}</span>
                        <small>${new Date(studyData.generated_at).toLocaleString()}</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
    
    // Add card toggle functionality
    document.querySelectorAll('.card-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const card = this.closest('.study-card');
            const content = card.querySelector('.card-content');
            const isExpanded = content.style.display !== 'none';
            
            content.style.display = isExpanded ? 'none' : 'block';
            this.textContent = isExpanded ? '+' : '−';
            card.classList.toggle('collapsed', isExpanded);
        });
    });

    // Expand all button functionality
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', function() {
            document.querySelectorAll('.study-card').forEach(card => {
                const content = card.querySelector('.card-content');
                const toggle = card.querySelector('.card-toggle');
                content.style.display = 'block';
                toggle.textContent = '−';
                card.classList.remove('collapsed');
            });
        });
    }

    // Scroll to results on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Format section content based on type
function formatSectionContent(content, type) {
    if (!content) return '<p class="no-content">Content not available</p>';
    
    switch (type) {
        case 'bubble-list':
            if (Array.isArray(content)) {
                return `<div class="bubble-container">${content.map(item => 
                    `<div class="concept-bubble">${item}</div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'card-list':
            if (Array.isArray(content)) {
                return `<div class="technique-grid">${content.map(item => 
                    `<div class="technique-card">
                        <div class="card-bullet">✦</div>
                        <div class="card-text">${item}</div>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'qa-grid':
            if (Array.isArray(content)) {
                return `<div class="qa-grid">${content.map(qa => 
                    `<div class="qa-card">
                        <div class="question-box">
                            <strong>${qa.question}</strong>
                        </div>
                        <div class="answer-box">
                            ${qa.answer}
                        </div>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'highlight-list':
            if (Array.isArray(content)) {
                return `<div class="highlight-list">${content.map(item => 
                    `<div class="highlight-item">
                        <span class="highlight-bullet">🚀</span>
                        <span>${item}</span>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'application-cards':
            if (Array.isArray(content)) {
                return `<div class="application-grid">${content.map(item => 
                    `<div class="application-card">
                        <div class="app-icon">🌍</div>
                        <div class="app-content">${item}</div>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'warning-list':
            if (Array.isArray(content)) {
                return `<div class="warning-container">${content.map(item => 
                    `<div class="warning-item">
                        <span class="warning-icon">⚠️</span>
                        <span>${item}</span>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'tip-cards':
            if (Array.isArray(content)) {
                return `<div class="tips-grid">${content.map((tip, i) => 
                    `<div class="tip-card">
                        <div class="tip-number">${i + 1}</div>
                        <div class="tip-content">${tip}</div>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'resource-links':
            if (Array.isArray(content)) {
                return `<div class="resources-list">${content.map(item => 
                    `<div class="resource-item">
                        <span class="resource-bullet">📚</span>
                        <span>${item}</span>
                    </div>`
                ).join('')}</div>`;
            }
            return `<p>${content}</p>`;
            
        case 'long-text':
            return `<div class="content-scrollable"><div class="formatted-content">${content.replace(/\n/g, '</p><p>')}</div></div>`;
            
        case 'compact-text':
            return `<div class="compact-notes">${content}</div>`;
            
        case 'qa-advanced':
            if (Array.isArray(content)) {
                return content.map(qa => 
                    `<div class="advanced-qa">
                        <div class="advanced-question">
                            <span class="q-marker">🧠</span>
                            <strong>${qa.question}</strong>
                        </div>
                        <div class="advanced-answer">
                            ${qa.answer}
                        </div>
                    </div>`
                ).join('');
            }
            return `<p>${content}</p>`;
            
        default:
            return `<p>${content}</p>`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Copy all content
async function copyAllContent() {
    const text = resultsContainer.innerText;
    try {
        await navigator.clipboard.writeText(text);
        showNotification('All study materials copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy. Please select and copy manually.', 'error');
    }
}

// Event Listeners
searchBtn.addEventListener('click', generateStudyMaterials);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateStudyMaterials();
});

copyAllBtn.addEventListener('click', copyAllContent);
printBtn.addEventListener('click', () => window.print());

// Mobile-specific: Auto-focus input on tap
document.addEventListener('touchstart', function() {
    if (window.innerWidth <= 768 && document.activeElement !== topicInput) {
        topicInput.focus();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initLuxuryEffects);  