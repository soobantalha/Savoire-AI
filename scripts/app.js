// Enhanced app.js with futuristic features and 30+ components
const topicInput = document.getElementById('topicInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const copyAllBtn = document.getElementById('copyAllBtn');
const expandAllBtn = document.getElementById('expandAllBtn');
const pdfDownload = document.getElementById('pdfDownload');

// Initialize cyber effects
function initCyberEffects() {
    createParticleEffects();
    initButtonCyberEffects();
    initAccessChips();
    initMobileCyberOptimizations();
    initInputCyberHandling();
}

// Mobile optimizations for cyber theme
function initMobileCyberOptimizations() {
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

// Initialize input handling for cyber theme
function initInputCyberHandling() {
    let isInputFocused = false;
    
    topicInput.addEventListener('focus', function() {
        isInputFocused = true;
        if (window.innerWidth <= 768) {
            document.body.classList.add('no-scroll');
        }
    });
    
    topicInput.addEventListener('blur', function() {
        isInputFocused = false;
        document.body.classList.remove('no-scroll');
    });
    
    // Allow scroll when tapping outside
    document.addEventListener('touchstart', function(e) {
        if (!topicInput.contains(e.target) && window.innerWidth <= 768) {
            document.body.classList.remove('no-scroll');
        }
    });
}

// Create particle effects
function createParticleEffects() {
    // Particle effects are handled by CSS in this design
}

// Initialize button cyber effects
function initButtonCyberEffects() {
    document.querySelectorAll('.quantum-btn, .matrix-btn, .access-chip').forEach(btn => {
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

// Initialize access chips
function initAccessChips() {
    document.querySelectorAll('.access-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const topic = this.getAttribute('data-topic');
            topicInput.value = topic;
            generateStudyMaterials();
        });
    });
}

// Generate study materials with 30+ components
async function generateStudyMaterials() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        showCyberNotification('Please enter a study topic!', 'error');
        return;
    }

    // Hide keyboard on mobile
    if (window.innerWidth <= 768) {
        topicInput.blur();
        document.body.classList.remove('no-scroll');
    }

    // Show loading state
    showLoadingState(true);
    resultsContainer.innerHTML = '';
    resultsSection.style.display = 'block';

    try {
        console.log('Generating materials for:', topic);
        
        // Try API first, then fallback to enhanced demo
        const response = await fetch('/api/study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: topic })
        });

        if (response.ok) {
            const studyData = await response.json();
            displayStudyResults(studyData);
            showCyberNotification('Quantum materials generated!', 'success');
        } else {
            throw new Error('API not available');
        }

    } catch (error) {
        console.log('Using enhanced demo data');
        const demoData = generateEnhancedDemoMaterials(topic);
        displayStudyResults(demoData);
        showCyberNotification('Enhanced demo content loaded!', 'info');
    } finally {
        showLoadingState(false);
    }
}

// Generate enhanced demo materials with 30+ components
function generateEnhancedDemoMaterials(topic) {
    const studyScore = Math.floor(Math.random() * 15) + 80; // 80-95
    
    return {
        topic: topic,
        curriculum_alignment: "Quantum Learning Matrix",
        study_score: studyScore,
        powered_by: "Savoiré AI by Sooban Talha Productions",
        generated_at: new Date().toISOString(),
        
        // 30+ Components
        components: {
            // Core Learning (10 components)
            "introduction": `# Quantum Introduction to ${topic}\n\nWelcome to the ultimate learning experience for ${topic}. This comprehensive guide breaks down complex concepts into easily digestible components, ensuring complete mastery and understanding.`,
            
            "learning_objectives": [
                "Master fundamental principles and core concepts",
                "Develop advanced problem-solving skills",
                "Understand real-world applications and implementations",
                "Build strong conceptual foundations for advanced study",
                "Acquire practical skills and techniques"
            ],
            
            "key_concepts": [
                "Fundamental Principles and Core Theories",
                "Essential Terminology and Definitions",
                "Key Formulas and Equations",
                "Critical Thinking Frameworks",
                "Problem-Solving Methodologies"
            ],
            
            "detailed_explanation": `## Deep Dive into ${topic}\n\n${topic} represents one of the most dynamic and evolving areas of knowledge. This comprehensive exploration covers everything from basic principles to advanced applications.\n\n### Core Principles\n- **Foundation Building**: Understanding the bedrock concepts that support advanced learning\n- **Progressive Complexity**: Moving from simple to complex applications systematically\n- **Practical Integration**: Connecting theoretical knowledge with real-world scenarios\n\n### Advanced Insights\nThis field combines multiple disciplines and requires a holistic approach to truly master. The interconnected nature of concepts means that understanding relationships is as important as knowing individual elements.`,
            
            "key_terms": [
                {term: "Fundamental Concept", definition: "The basic building block that forms the foundation of understanding"},
                {term: "Advanced Application", definition: "Practical implementation of theoretical knowledge in complex scenarios"},
                {term: "Methodology Framework", definition: "Structured approach to problem-solving and analysis"},
                {term: "Theoretical Foundation", definition: "Underlying principles that support practical applications"},
                {term: "Practical Integration", definition: "Connecting abstract concepts with real-world implementation"}
            ],
            
            "examples": [
                "Basic example demonstrating core principles in simple scenarios",
                "Intermediate example showing application in common situations",
                "Advanced example illustrating complex problem-solving approaches",
                "Real-world case study from industry applications",
                "Comparative analysis across different methodologies"
            ],
            
            "case_studies": [
                "Industry implementation success story",
                "Research breakthrough case analysis",
                "Practical problem-solving scenario",
                "Innovation and development case",
                "Cross-disciplinary application study"
            ],
            
            "formulas": [
                "Core Formula: Basic equation with explanation",
                "Advanced Formula: Complex relationship equation",
                "Derived Formula: Application-specific equation",
                "Theoretical Formula: Conceptual framework equation",
                "Practical Formula: Real-world calculation equation"
            ],
            
            "step_by_step_solutions": [
                "Problem identification and analysis approach",
                "Solution methodology selection process",
                "Step-by-step implementation guide",
                "Verification and validation procedures",
                "Optimization and improvement techniques"
            ],
            
            "common_mistakes": [
                "Misunderstanding basic principles and assumptions",
                "Incorrect application of formulas and methodologies",
                "Overlooking important variables and factors",
                "Failing to verify results and conclusions",
                "Ignoring practical constraints and limitations"
            ],
            
            // Advanced Techniques (10 components)
            "tips_tricks": [
                "Memory enhancement techniques for better retention",
                "Problem-solving shortcuts and efficient methods",
                "Time management strategies for optimal learning",
                "Concept visualization and mapping approaches",
                "Application optimization techniques"
            ],
            
            "practice_questions": [
                {
                    question: "Explain the fundamental concept and its importance",
                    answer: "The fundamental concept serves as the foundation for understanding more complex ideas. Its importance lies in providing the basic framework upon which advanced knowledge is built."
                },
                {
                    question: "Describe a real-world application scenario",
                    answer: "Real-world applications demonstrate the practical value of theoretical knowledge. They show how abstract concepts solve actual problems and create value in various contexts."
                },
                {
                    question: "Analyze a complex relationship within the topic",
                    answer: "Complex relationships involve interconnected elements that influence each other. Understanding these relationships requires systematic analysis and holistic thinking."
                },
                {
                    question: "Compare different methodological approaches",
                    answer: "Different methodologies offer unique perspectives and advantages. Comparative analysis helps identify the most appropriate approach for specific scenarios."
                },
                {
                    question: "Propose an innovative solution approach",
                    answer: "Innovation combines existing knowledge with creative thinking to develop novel solutions that address limitations of current approaches."
                }
            ],
            
            "advanced_questions": [
                {
                    question: "Critically analyze the theoretical foundations",
                    answer: "Critical analysis examines underlying assumptions, limitations, and implications of theoretical frameworks to develop deeper understanding."
                },
                {
                    question: "Design a comprehensive solution framework",
                    answer: "Solution frameworks integrate multiple concepts and methodologies to address complex, multi-faceted problems systematically."
                },
                {
                    question: "Evaluate emerging trends and future directions",
                    answer: "Trend evaluation identifies evolving patterns and potential future developments to prepare for upcoming changes and opportunities."
                }
            ],
            
            "real_world_applications": [
                "Industry implementation and commercialization",
                "Research and development applications",
                "Educational and training implementations",
                "Technological innovation and advancement",
                "Social and economic impact scenarios"
            ],
            
            "related_concepts": [
                "Foundational principles and basic theories",
                "Advanced theories and complex frameworks",
                "Cross-disciplinary connections and integrations",
                "Emerging concepts and cutting-edge developments",
                "Historical context and evolutionary progress"
            ],
            
            "summary": `# Quantum Summary: ${topic}\n\nThis comprehensive exploration has covered the essential aspects of ${topic}, providing a solid foundation for continued learning and practical application. The interconnected nature of concepts emphasizes the importance of holistic understanding.\n\n## Key Takeaways\n- Mastery requires understanding both individual concepts and their relationships\n- Practical application reinforces theoretical knowledge\n- Continuous learning and adaptation are essential for staying current\n- Problem-solving skills develop through practice and application\n\n## Next Steps\nContinue building on this foundation through practical application, further study, and exploration of advanced topics in related areas.`,
            
            "flashcards": [
                {front: "Core Concept Definition", back: "Fundamental building block of understanding"},
                {front: "Key Methodology", back: "Structured approach to problem-solving"},
                {front: "Important Formula", back: "Mathematical representation of relationships"},
                {front: "Application Scenario", back: "Real-world implementation context"},
                {front: "Common Challenge", back: "Frequently encountered obstacle"}
            ],
            
            "mnemonics": [
                "Memory technique for complex terminology",
                "Visualization method for abstract concepts",
                "Association strategy for related ideas",
                "Pattern recognition for systematic learning",
                "Repetition framework for long-term retention"
            ],
            
            "video_resources": [
                "Comprehensive tutorial series",
                "Expert interview and discussion",
                "Practical demonstration videos",
                "Case study presentations",
                "Advanced technique workshops"
            ],
            
            // Professional Development (10 components)
            "further_reading": [
                "Advanced theoretical textbooks",
                "Research papers and journal articles",
                "Industry reports and white papers",
                "Case study collections",
                "Professional development guides"
            ],
            
            "quizzes": [
                "Basic concepts assessment quiz",
                "Application skills evaluation test",
                "Advanced knowledge challenge",
                "Practical problem-solving assessment",
                "Comprehensive mastery evaluation"
            ],
            
            "interactive_exercises": [
                "Hands-on practice scenarios",
                "Simulation-based learning activities",
                "Collaborative problem-solving tasks",
                "Real-world application projects",
                "Creative implementation challenges"
            ],
            
            "study_plans": [
                "30-day intensive learning schedule",
                "Progressive skill development roadmap",
                "Exam preparation timeline",
                "Project-based learning plan",
                "Continuous improvement schedule"
            ],
            
            "mind_maps": [
                "Concept relationship visualization",
                "Knowledge hierarchy mapping",
                "Application pathway diagramming",
                "Problem-solving flowcharts",
                "Learning progression mapping"
            ],
            
            "cheat_sheets": [
                "Quick reference formulas and equations",
                "Essential terminology and definitions",
                "Problem-solving algorithms",
                "Common scenarios and solutions",
                "Best practices and guidelines"
            ],
            
            "exam_tips": [
                "Time management strategies",
                "Question analysis techniques",
                "Answer structuring approaches",
                "Stress management methods",
                "Performance optimization tips"
            ],
            
            "time_management": [
                "Study session planning techniques",
                "Priority setting methodologies",
                "Efficiency improvement strategies",
                "Progress tracking systems",
                "Goal achievement frameworks"
            ],
            
            "stress_management": [
                "Learning anxiety reduction techniques",
                "Performance pressure management",
                "Mindfulness and focus exercises",
                "Work-life balance strategies",
                "Motivation maintenance approaches"
            ],
            
            "conclusion": `# Quantum Learning Achievement\n\nCongratulations on completing this comprehensive exploration of ${topic}. You have built a strong foundation and acquired the tools needed for continued success in this field.\n\n## Achievement Milestones\n- Solid conceptual understanding established\n- Practical application skills developed\n- Advanced problem-solving capabilities acquired\n- Continuous learning framework implemented\n\n## Future Learning Pathways\nContinue your journey by exploring advanced topics, engaging in practical projects, and staying updated with emerging developments in the field.`
        }
    };
}

// Show/hide loading state
function showLoadingState(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    searchBtn.disabled = show;
    if (show) {
        searchBtn.innerHTML = '<span class="btn-content"><i class="fas fa-cog fa-spin"></i> Quantum Processing...</span>';
    } else {
        searchBtn.innerHTML = '<span class="btn-content"><i class="fas fa-bolt"></i> Generate Quantum Materials</span>';
    }
}

// Display study results with 30+ components
function displayStudyResults(studyData) {
    const components = studyData.components || generateEnhancedDemoMaterials(studyData.topic).components;
    
    let html = `
        <div class="quantum-dashboard">
            <div class="dashboard-header">
                <div class="topic-quantum">
                    <h2>${studyData.topic}</h2>
                    <div class="quantum-meta">
                        <span class="quantum-badge">${studyData.curriculum_alignment}</span>
                        <span class="quantum-score">Quantum Score: ${studyData.study_score}/100</span>
                    </div>
                </div>
                <div class="quantum-visual">
                    <div class="score-orb">
                        <div class="orb-fill" style="transform: rotate(${studyData.study_score * 3.6}deg)"></div>
                        <span class="orb-text">${studyData.study_score}%</span>
                    </div>
                </div>
            </div>

            <div class="components-matrix">
    `;

    // Add all 30+ components
    Object.entries(components).forEach(([key, content], index) => {
        if (content && (!Array.isArray(content) || content.length > 0)) {
            const componentConfig = getComponentConfig(key, index);
            html += `
                <div class="study-card" data-component="${key}">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="${componentConfig.icon}"></i>
                            ${componentConfig.title}
                        </div>
                        <button class="card-toggle">+</button>
                    </div>
                    <div class="card-content" style="display: none;">
                        ${formatQuantumContent(content, key)}
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div>
            
            <div class="quantum-footer">
                <div class="completion-hologram">
                    <div class="hologram-icon">🏆</div>
                    <div class="hologram-content">
                        <strong>Quantum Matrix Complete</strong>
                        <span>${studyData.powered_by}</span>
                        <small>${new Date(studyData.generated_at).toLocaleString()}</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
    
    // Add card toggle functionality
    initCardInteractions();
    
    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// Get component configuration
function getComponentConfig(key, index) {
    const components = {
        introduction: { icon: 'fas fa-star', title: '🚀 Quantum Introduction' },
        learning_objectives: { icon: 'fas fa-bullseye', title: '🎯 Learning Objectives' },
        key_concepts: { icon: 'fas fa-cube', title: '🧠 Key Concepts' },
        detailed_explanation: { icon: 'fas fa-book', title: '📚 Detailed Explanation' },
        key_terms: { icon: 'fas fa-font', title: '🔤 Key Terminology' },
        examples: { icon: 'fas fa-lightbulb', title: '💡 Practical Examples' },
        case_studies: { icon: 'fas fa-chart-line', title: '📊 Case Studies' },
        formulas: { icon: 'fas fa-square-root-alt', title: '🧮 Key Formulas' },
        step_by_step_solutions: { icon: 'fas fa-footsteps', title: '👣 Step-by-Step Solutions' },
        common_mistakes: { icon: 'fas fa-exclamation-triangle', title: '⚠️ Common Mistakes' },
        tips_tricks: { icon: 'fas fa-magic', title: '✨ Tips & Tricks' },
        practice_questions: { icon: 'fas fa-question', title: '❓ Practice Questions' },
        advanced_questions: { icon: 'fas fa-brain', title: '🧠 Advanced Challenges' },
        real_world_applications: { icon: 'fas fa-globe', title: '🌍 Real-World Applications' },
        related_concepts: { icon: 'fas fa-project-diagram', title: '🔄 Related Concepts' },
        summary: { icon: 'fas fa-clipboard-list', title: '📝 Comprehensive Summary' },
        flashcards: { icon: 'fas fa-layer-group', title: '🎴 Quick Flashcards' },
        mnemonics: { icon: 'fas fa-memory', title: '🔗 Memory Aids' },
        video_resources: { icon: 'fas fa-video', title: '🎥 Video Resources' },
        further_reading: { icon: 'fas fa-book-open', title: '📖 Further Reading' },
        quizzes: { icon: 'fas fa-tasks', title: '📋 Assessment Quizzes' },
        interactive_exercises: { icon: 'fas fa-hand-pointer', title: '👆 Interactive Exercises' },
        study_plans: { icon: 'fas fa-calendar-alt', title: '📅 Study Plans' },
        mind_maps: { icon: 'fas fa-sitemap', title: '🗺️ Mind Maps' },
        cheat_sheets: { icon: 'fas fa-file-alt', title: '📄 Cheat Sheets' },
        exam_tips: { icon: 'fas fa-graduation-cap', title: '🎓 Exam Success Tips' },
        time_management: { icon: 'fas fa-clock', title: '⏰ Time Management' },
        stress_management: { icon: 'fas fa-heart', title: '💖 Stress Management' },
        conclusion: { icon: 'fas fa-flag-checkered', title: '🏁 Learning Conclusion' }
    };
    
    return components[key] || { icon: 'fas fa-cube', title: `Component ${index + 1}` };
}

// Format quantum content
function formatQuantumContent(content, type) {
    if (!content) return '<p class="quantum-empty">Content being synthesized...</p>';
    
    try {
        if (Array.isArray(content)) {
            if (type === 'practice_questions' || type === 'advanced_questions') {
                return content.map(qa => `
                    <div class="qa-pair">
                        <div class="question">${qa.question}</div>
                        <div class="answer">${qa.answer}</div>
                    </div>
                `).join('');
            } else if (type === 'key_terms') {
                return content.map(term => `
                    <div class="term-item">
                        <strong class="highlight">${term.term}:</strong> ${term.definition}
                    </div>
                `).join('');
            } else if (type === 'flashcards') {
                return content.map(card => `
                    <div class="flashcard">
                        <div class="flashcard-front">${card.front}</div>
                        <div class="flashcard-back">${card.back}</div>
                    </div>
                `).join('');
            } else {
                return content.map(item => `
                    <div class="content-item">
                        <span class="highlight">${item}</span>
                    </div>
                `).join('');
            }
        } else if (typeof content === 'string') {
            // Add highlighting to key terms in text
            const highlightedContent = content.replace(/(Fundamental|Advanced|Key|Important|Critical|Essential)/g, 
                '<span class="highlight">$1</span>');
            return `<div class="content-section">${highlightedContent.replace(/\n/g, '</p><p>')}</div>`;
        } else {
            return `<div class="content-section">${JSON.stringify(content)}</div>`;
        }
    } catch (error) {
        console.error('Error formatting content:', error);
        return `<div class="content-section">${content}</div>`;
    }
}

// Initialize card interactions
function initCardInteractions() {
    document.querySelectorAll('.card-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const card = this.closest('.study-card');
            const content = card.querySelector('.card-content');
            const isExpanded = content.style.display !== 'none';
            
            content.style.display = isExpanded ? 'none' : 'block';
            this.textContent = isExpanded ? '+' : '−';
            card.classList.toggle('quantum-expanded', !isExpanded);
        });
    });

    // Expand all functionality
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', function() {
            document.querySelectorAll('.study-card').forEach(card => {
                const content = card.querySelector('.card-content');
                const toggle = card.querySelector('.card-toggle');
                content.style.display = 'block';
                toggle.textContent = '−';
                card.classList.add('quantum-expanded');
            });
        });
    }
}

// PDF Download functionality
function initPDFDownload() {
    if (pdfDownload) {
        pdfDownload.addEventListener('click', generatePDF);
    }
}

// Generate PDF with branding
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    
    try {
        showCyberNotification('Preparing PDF download...', 'info');
        
        const doc = new jsPDF();
        const elements = resultsContainer.querySelectorAll('.study-card');
        
        // Add header with branding
        doc.setFillColor(10, 10, 24);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 243, 255);
        doc.setFontSize(20);
        doc.text('Savoiré AI', 20, 20);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('by Sooban Talha Productions', 20, 28);
        doc.text('AI that Understands You', 20, 34);
        
        let yPosition = 50;
        
        for (let i = 0; i < elements.length; i++) {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            const card = elements[i];
            const title = card.querySelector('.card-title').textContent;
            const content = card.querySelector('.card-content').textContent;
            
            // Add title
            doc.setFillColor(26, 26, 46);
            doc.rect(10, yPosition, 190, 8, 'F');
            doc.setTextColor(0, 243, 255);
            doc.setFontSize(12);
            doc.text(title, 15, yPosition + 6);
            
            yPosition += 15;
            
            // Add content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(content, 180);
            doc.text(lines, 15, yPosition);
            
            yPosition += (lines.length * 5) + 10;
        }
        
        // Add footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Page ${i} of ${totalPages} - Generated by Savoiré AI`, 105, 290, { align: 'center' });
        }
        
        // Download
        doc.save(`Savoire-AI-${topicInput.value.replace(/\s+/g, '-')}.pdf`);
        showCyberNotification('PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showCyberNotification('PDF download failed. Please try again.', 'error');
    }
}

// Show cyber notification
function showCyberNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.cyber-notification').forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `cyber-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-glow"></div>
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
            ${message}
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(26, 26, 46, 0.9);
        backdrop-filter: blur(20px);
        border: 1px solid ${type === 'success' ? 'var(--cyber-green)' : type === 'error' ? 'var(--neon-pink)' : 'var(--neon-blue)'};
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Copy all content
async function copyAllContent() {
    const text = resultsContainer.innerText;
    try {
        await navigator.clipboard.writeText(text);
        showCyberNotification('All content copied to clipboard!', 'success');
    } catch (err) {
        showCyberNotification('Failed to copy. Please select manually.', 'error');
    }
}

// Event Listeners
searchBtn.addEventListener('click', generateStudyMaterials);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateStudyMaterials();
});

if (copyAllBtn) copyAllBtn.addEventListener('click', copyAllContent);
if (pdfDownload) pdfDownload.addEventListener('click', generatePDF);

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initCyberEffects();
    initPDFDownload();
});