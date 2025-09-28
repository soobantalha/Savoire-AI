// DOM Elements
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
    document.querySelectorAll('.luxury-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 10px 30px rgba(79, 70, 229, 0.4)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.3)';
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
}

// Display study results
function displayStudyResults(studyData) {
    const sections = [
        {
            title: '📖 Ultra Long Explained Notes',
            content: studyData.ultra_long_notes,
            type: 'long-text'
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
            title: '📚 Recommended Resources',
            content: studyData.recommended_resources,
            type: 'list'
        }
    ];

    let html = `
        <div class="study-header">
            <h2>${studyData.topic}</h2>
            <div class="study-meta">
                <span class="score-badge">Study Score: ${studyData.study_score}/100</span>
                <span class="sections-badge">10 Comprehensive Sections</span>
            </div>
        </div>
    `;

    sections.forEach((section, index) => {
        html += `
            <div class="study-section" id="section-${index}">
                <h3 class="section-title">${section.title}</h3>
                <div class="section-content">
                    ${formatSectionContent(section.content, section.type)}
                </div>
            </div>
        `;
    });

    // Add footer
    html += `
        <div class="study-footer">
            <p>Generated by ${studyData.powered_by} • ${new Date(studyData.generated_at).toLocaleString()}</p>
        </div>
    `;

    resultsContainer.innerHTML = html;
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

// Initialize on load
document.addEventListener('DOMContentLoaded', initLuxuryEffects);