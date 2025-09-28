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
    initInputHandling();
}

// Mobile optimizations
function initMobileOptimizations() {
    // Add touch improvements
    document.querySelectorAll('button').forEach(btn => {
        btn.style.minHeight = '44px';
    });
    
    // Prevent zoom on input focus (iOS)
    topicInput.addEventListener('focus', function() {
        setTimeout(() => {
            document.body.style.zoom = '1';
        }, 100);
    });
}

// Initialize input handling to prevent mobile interference
function initInputHandling() {
    let isInputFocused = false;
    
    topicInput.addEventListener('focus', function() {
        isInputFocused = true;
        if (window.innerWidth <= 768) {
            // Add a close button for mobile
            if (!document.querySelector('.mobile-close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-close-btn';
                closeBtn.innerHTML = '✕';
                closeBtn.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 1000;
                    background: var(--vip-gold);
                    color: var(--vip-black);
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                    font-weight: bold;
                `;
                closeBtn.addEventListener('click', function() {
                    topicInput.blur();
                    document.body.classList.remove('body-no-scroll');
                    this.remove();
                });
                document.body.appendChild(closeBtn);
            }
        }
    });
    
    topicInput.addEventListener('blur', function() {
        isInputFocused = false;
        const closeBtn = document.querySelector('.mobile-close-btn');
        if (closeBtn) closeBtn.remove();
    });
    
    // Prevent body scroll when input is focused on mobile
    topicInput.addEventListener('touchstart', function(e) {
        if (window.innerWidth <= 768) {
            document.body.classList.add('body-no-scroll');
        }
    });
    
    // Allow scroll when not interacting with input
    document.addEventListener('touchmove', function(e) {
        if (!isInputFocused && window.innerWidth <= 768) {
            document.body.classList.remove('body-no-scroll');
        }
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

// Generate study materials - IMPROVED VERSION
async function generateStudyMaterials() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        showNotification('Please enter a study topic!', 'error');
        return;
    }

    // Hide keyboard on mobile
    if (window.innerWidth <= 768) {
        topicInput.blur();
        document.body.classList.remove('body-no-scroll');
    }

    // Show loading state
    showLoadingState(true);
    resultsContainer.innerHTML = '';
    resultsSection.style.display = 'block';

    try {
        console.log('Sending request for topic:', topic);
        
        // First, try the API
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: topic })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const studyData = await response.json();
        displayStudyResults(studyData);
        showNotification('Study materials generated successfully!', 'success');

    } catch (error) {
        console.error('Error generating study materials:', error);
        
        // Show demo data immediately for any topic
        const demoData = generateDemoStudyMaterials(topic);
        displayStudyResults(demoData);
        showNotification('Showing demo content. Real AI content available with proper API setup.', 'info');
    } finally {
        showLoadingState(false);
    }
}

// Generate demo data for ANY topic
function generateDemoStudyMaterials(topic) {
    const studyScore = Math.floor(Math.random() * 20) + 75; // 75-95
    
    return {
        topic: topic,
        curriculum_alignment: "Comprehensive Learning Package",
        ultra_long_notes: `# Ultimate Guide to ${topic}\n\n## Deep Dive Analysis\n${topic} represents one of the most fascinating and impactful areas of modern knowledge. This comprehensive guide breaks down everything you need to master this subject.\n\n## Core Principles\n- **Fundamental Concepts**: Understanding the basic building blocks\n- **Advanced Applications**: Real-world implementations and case studies\n- **Future Trends**: Where this field is heading and emerging opportunities\n\n## Detailed Breakdown\nThis subject combines theoretical knowledge with practical applications, making it essential for both academic and professional growth. Whether you're a beginner or looking to advance your expertise, this guide provides the structured approach needed for true mastery.`,
        key_concepts: [
            "Core Principles and Fundamentals",
            "Essential Terminology and Definitions",
            "Key Theories and Frameworks",
            "Practical Applications",
            "Industry Best Practices"
        ],
        key_tricks: [
            "Memory techniques for better retention",
            "Problem-solving approaches specific to this field",
            "Time management strategies for efficient learning",
            "Study schedule optimization methods",
            "Concept mapping and visualization techniques"
        ],
        practice_questions: [
            {
                "question": `What are the fundamental concepts of ${topic}?`,
                "answer": `The fundamental concepts include core principles that form the foundation, essential terminology, basic frameworks, and practical applications that make ${topic} such a valuable area of study.`
            },
            {
                "question": `How can you apply ${topic} in real-world scenarios?`,
                "answer": `Real-world applications involve practical implementation of theoretical concepts to solve problems, create value, and drive innovation across various industries and contexts.`
            },
            {
                "question": `What are the key benefits of mastering ${topic}?`,
                "answer": `Key benefits include enhanced problem-solving abilities, improved analytical thinking, better decision-making skills, and increased career opportunities across multiple domains.`
            }
        ],
        advanced_tricks: [
            "Advanced analytical techniques and methodologies",
            "Expert problem-solving frameworks",
            "Research and development approaches",
            "Innovation and creativity methods"
        ],
        trick_notes: "Combine multiple learning approaches for optimal results. Use active recall, spaced repetition, and practical application for long-term retention and true mastery.",
        short_notes: `• Core concept summaries for ${topic}\n• Key principles and formulas\n• Important applications and use cases\n• Common challenges and solutions\n• Quick reference points for revision`,
        advanced_questions: [
            {
                "question": `Analyze the complex relationships and interdependencies within ${topic}`,
                "answer": `Complex relationships involve interconnected concepts, cause-effect chains, and systemic thinking that require deep understanding of underlying patterns, principles, and their practical implications.`
            },
            {
                "question": `How would you approach solving advanced, multi-faceted problems in ${topic}?`,
                "answer": `Advanced problem-solving requires integrating multiple concepts, applying critical thinking frameworks, systematic analysis of complex scenarios, and innovative solution development approaches.`
            }
        ],
        real_world_applications: [
            "Industry implementations and case studies",
            "Research and development applications",
            "Practical problem-solving scenarios",
            "Innovation and entrepreneurship opportunities"
        ],
        common_misconceptions: [
            "Common misunderstandings about basic principles and concepts",
            "Frequently confused terminology and methodological approaches"
        ],
        exam_tips: [
            "Focus on understanding concepts thoroughly rather than memorization",
            "Practice with varied question types and difficulty levels",
            "Develop effective time management strategies for assessments"
        ],
        recommended_resources: [
            "Comprehensive textbooks and authoritative guides",
            "Online learning platforms and video courses",
            "Practical workshops and hands-on projects",
            "Professional communities and networking opportunities"
        ],
        study_score: studyScore,
        powered_by: "Savoiré AI by Sooban Talha Productions",
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

// Display study results - IMPROVED FOR MOBILE
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

    // Scroll to top of results on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            window.scrollTo({
                top: resultsSection.offsetTop - 20,
                behavior: 'smooth'
            });
        }, 100);
    }
}

// Format section content based on type (keep your existing function)
function formatSectionContent(content, type) {
    // ... (keep your existing formatSectionContent function)
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

// Initialize on load
document.addEventListener('DOMContentLoaded', initLuxuryEffects);