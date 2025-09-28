
// Enhanced app.js with mobile optimizations
const topicInput = document.getElementById('topicInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const copyAllBtn = document.getElementById('copyAllBtn');
const printBtn = document.getElementById('printBtn');

// Initialize luxury effects
function initLuxuryEffects() {
    createFloatingParticles();
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

// Create floating academic particles
function createFloatingParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'floating-particles';
    document.body.appendChild(particlesContainer);

    const symbols = ['📚', '✏️', '🎓', '📖', '🔬', '📊', '🧮', '🔍'];
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'academic-particle';
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        
        const size = Math.random() * 20 + 15;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 15 + 15;

        particle.style.cssText = `
            font-size: ${size}px;
            left: ${posX}%;
            top: ${posY}%;
            animation: floatAcademic ${duration}s infinite ease-in-out ${delay}s;
            opacity: ${Math.random() * 0.3 + 0.1};
        `;

        particlesContainer.appendChild(particle);
    }
}

// Initialize button hover effects
function initButtonEffects() {
    document.querySelectorAll('.luxury-btn, .action-btn').forEach(btn => {
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
    document.querySelectorAll('.topic-chip').forEach(chip => {
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
        
        // Show error in results
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>🚨 Unable to Generate Materials</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Please check your API configuration and try again.</p>
            </div>
        `;
    } finally {
        showLoadingState(false);
    }
}

// Show/hide loading state
function showLoadingState(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    searchBtn.disabled = show;
    if (show) {
        searchBtn.innerHTML = '<span class="btn-text">Generating Materials...</span><div class="btn-shine"></div>';
    } else {
        searchBtn.innerHTML = '<span class="btn-text">Generate Ultra Study Materials</span><div class="btn-shine"></div>';
    }
}

// Display study results
function displayStudyResults(studyData) {
    const sections = [
        {
            title: '🎓 Curriculum Alignment',
            content: studyData.curriculum_alignment,
            type: 'badge'
        },
        {
            title: '📖 Ultra Long Explained Notes',
            content: studyData.ultra_long_notes,
            type: 'long-text'
        },
        {
            title: '💡 Key Concepts',
            content: studyData.key_concepts,
            type: 'list'
        },
        {
            title: '🎯 Key Tricks & Techniques',
            content: studyData.key_tricks,
            type: 'list'
        },
        {
            title: '❓ Practice Questions with Answers',
            content: studyData.practice_questions,
            type: 'qa'
        },
        {
            title: '🚀 Ultra Advanced Tricks',
            content: studyData.advanced_tricks,
            type: 'list'
        },
        {
            title: '📝 Trick Notes Summary',
            content: studyData.trick_notes,
            type: 'text'
        },
        {
            title: '⚡ Short Notes for Quick Revision',
            content: studyData.short_notes,
            type: 'text'
        },
        {
            title: '🧠 Ultra High-Level Advanced Questions',
            content: studyData.advanced_questions,
            type: 'qa'
        },
        {
            title: '🌍 Real-World Applications',
            content: studyData.real_world_applications,
            type: 'list'
        },
        {
            title: '⚠️ Common Misconceptions',
            content: studyData.common_misconceptions,
            type: 'list'
        },
        {
            title: '📝 Exam Tips & Strategies',
            content: studyData.exam_tips,
            type: 'list'
        },
        {
            title: '📚 Recommended Resources',
            content: studyData.recommended_resources,
            type: 'list'
        }
    ];

    let html = `
        <div class="study-header">
            <h2>${studyData.topic}</h2>
            ${studyData.curriculum_alignment ? `<div class="curriculum-badge">${studyData.curriculum_alignment}</div>` : ''}
            <div class="study-meta">
                <span class="score-badge">Study Score: ${studyData.study_score}/100</span>
                <span class="sections-badge">${sections.length} Comprehensive Sections</span>
            </div>
        </div>
    `;

    sections.forEach((section, index) => {
        if (section.content && (!Array.isArray(section.content) || section.content.length > 0)) {
            html += `
                <div class="study-section" id="section-${index}">
                    <h3 class="section-title">${section.title}</h3>
                    <div class="section-content">
                        ${formatSectionContent(section.content, section.type)}
                    </div>
                </div>
            `;
        }
    });

    // Add footer
    html += `
        <div class="study-footer">
            <p>Generated by ${studyData.powered_by} • ${new Date(studyData.generated_at).toLocaleString()}</p>
        </div>
    `;

    resultsContainer.innerHTML = html;
    
    // Scroll to results on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Format section content based on type
function formatSectionContent(content, type) {
    if (!content) return '<p>Content not available</p>';
    
    switch (type) {
        case 'list':
            if (Array.isArray(content)) {
                return `<ul>${content.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }
            return `<p>${content}</p>`;
        case 'qa':
            if (Array.isArray(content)) {
                return content.map(qa => `
                    <div class="qa-item">
                        <strong>Q: ${qa.question}</strong>
                        <p>A: ${qa.answer}</p>
                    </div>
                `).join('');
            }
            return `<p>${content}</p>`;
        case 'long-text':
            return `<div class="long-text">${content.replace(/\n/g, '</p><p>')}</div>`;
        case 'badge':
            return `<div class="curriculum-badge" style="display: inline-block; margin: 0.5rem 0;">${content}</div>`;
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
// Enhanced VIP Particles
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

// Update initialization
function initLuxuryEffects() {
    createVIPParticles();
    initButtonEffects();
    initTopicChips();
    initMobileOptimizations();
}