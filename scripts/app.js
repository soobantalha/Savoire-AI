// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendMessageBtn = document.getElementById('send-message');

// Create luxury floating particles
function createLuxuryParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.style.position = 'fixed';
    particlesContainer.style.top = '0';
    particlesContainer.style.left = '0';
    particlesContainer.style.width = '100%';
    particlesContainer.style.height = '100%';
    particlesContainer.style.pointerEvents = 'none';
    particlesContainer.style.zIndex = '-1';
    document.body.appendChild(particlesContainer);

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'luxury-particle';

        const size = Math.random() * 10 + 5;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 10 + 10;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(110, 69, 226, 0.6), rgba(255, 107, 107, 0.3));
            border-radius: 50%;
            left: ${posX}%;
            top: ${posY}%;
            animation: float ${duration}s infinite ease-in-out ${delay}s;
            filter: blur(1px);
        `;

        particlesContainer.appendChild(particle);
    }
}

// Initialize luxury effects
function initLuxuryEffects() {
    createLuxuryParticles();

    // Add luxury glow effect to buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.filter = 'drop-shadow(0 0 20px rgba(110, 69, 226, 0.8))';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.filter = 'none';
        });
    });
}

// Add message to chat
function addMessage(content, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

    if (isError) {
        messageDiv.classList.add('error-message');
    }

    if (isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${content}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show loading animation
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'ai-message', 'loading-message');
    loadingDiv.id = 'loading-message';

    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="ai-thinking">
                <div class="chef-icon">👨‍🍳</div>
                <div class="thinking-text">Célestique AI is crafting your gourmet recipe...</div>
                <div class="luxury-loader">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>
    `;

    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove loading animation
function hideLoading() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// NEW: Recipe Rating Component
function createRatingComponent(recipeId) {
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'recipe-rating';
    ratingDiv.innerHTML = `
        <div class="rating-title">Rate this recipe:</div>
        <div class="stars-container">
            <span class="star" data-rating="1">★</span>
            <span class="star" data-rating="2">★</span>
            <span class="star" data-rating="3">★</span>
            <span class="star" data-rating="4">★</span>
            <span class="star" data-rating="5">★</span>
        </div>
        <div class="rating-feedback"></div>
    `;

    // Add star click events
    const stars = ratingDiv.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            rateRecipe(recipeId, rating, ratingDiv);
        });
    });

    return ratingDiv;
}

// NEW: Rate recipe function
function rateRecipe(recipeId, rating, ratingDiv) {
    const stars = ratingDiv.querySelectorAll('.star');
    const feedback = ratingDiv.querySelector('.rating-feedback');
    
    // Update star colors
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        star.style.color = starRating <= rating ? '#FFD700' : '#666';
    });

    // Show feedback
    const messages = [
        "Thanks for your feedback!",
        "Great! We'll improve based on your rating.",
        "Thank you! Your opinion matters to us.",
        "Excellent! We're glad you liked it!",
        "Perfect! We appreciate your feedback!"
    ];
    
    feedback.textContent = messages[rating - 1];
    feedback.style.color = '#4CAF50';
    
    // Save rating to localStorage
    const ratings = JSON.parse(localStorage.getItem('recipeRatings') || '{}');
    ratings[recipeId] = rating;
    localStorage.setItem('recipeRatings', JSON.stringify(ratings));
}

// NEW: Save Recipe Component
function createSaveRecipeComponent(recipeData) {
    const saveDiv = document.createElement('div');
    saveDiv.className = 'save-recipe-container';
    saveDiv.innerHTML = `
        <button class="save-recipe-btn">
            <span class="save-icon">💾</span>
            Save Recipe
        </button>
        <div class="save-feedback"></div>
    `;

    const saveBtn = saveDiv.querySelector('.save-recipe-btn');
    const feedback = saveDiv.querySelector('.save-feedback');

    saveBtn.addEventListener('click', function() {
        saveRecipeToCollection(recipeData, feedback);
    });

    return saveDiv;
}

// NEW: Save recipe function
function saveRecipeToCollection(recipeData, feedbackElement) {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    // Check if already saved
    const isAlreadySaved = savedRecipes.some(recipe => recipe.name === recipeData.name);
    
    if (isAlreadySaved) {
        feedbackElement.textContent = 'Recipe already saved!';
        feedbackElement.style.color = '#FFA500';
    } else {
        savedRecipes.push({
            ...recipeData,
            savedAt: new Date().toISOString(),
            id: Date.now().toString()
        });
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        feedbackElement.textContent = 'Recipe saved successfully!';
        feedbackElement.style.color = '#4CAF50';
        
        // Update button
        const saveBtn = feedbackElement.previousElementSibling;
        saveBtn.innerHTML = '<span class="save-icon">✅</span> Saved!';
        saveBtn.disabled = true;
    }
    
    setTimeout(() => {
        feedbackElement.textContent = '';
    }, 3000);
}

// Format recipe response
function formatRecipe(recipe) {
    if (recipe.error) {
        return `
            <div class="recipe-error">
                <h3>🚨 Unable to Generate Recipe</h3>
                <p><strong>Error:</strong> ${recipe.error}</p>
                ${recipe.details ? `<p><strong>Details:</strong> ${recipe.details}</p>` : ''}
                <p>Please check your API configuration and try again.</p>
                ${recipe.fallback ? formatRecipe(recipe.fallback) : ''}
            </div>
        `;
    }

    const recipeId = 'recipe_' + Date.now();
    
    return `
        <div class="recipe-card" data-recipe-id="${recipeId}">
            <div class="recipe-header">
                <h3 class="recipe-title">✨ ${recipe.name}</h3>
                <div class="recipe-badges">
                    <span class="badge cuisine">${recipe.cuisine || 'International'}</span>
                    <span class="badge difficulty">${recipe.difficulty || 'Medium'}</span>
                    ${recipe.score ? `<span class="badge score">⭐ ${recipe.score}/100</span>` : ''}
                </div>
            </div>

            <div class="recipe-meta">
                ${recipe.prep_time ? `<span class="meta-item">⏱️ Prep: ${recipe.prep_time}</span>` : ''}
                ${recipe.cook_time ? `<span class="meta-item">🔥 Cook: ${recipe.cook_time}</span>` : ''}
                ${recipe.serves ? `<span class="meta-item">👥 Serves: ${recipe.serves}</span>` : ''}
            </div>

            <div class="recipe-section">
                <h4 class="section-title">🥘 Ingredients</h4>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
            </div>

            <div class="recipe-section">
                <h4 class="section-title">📋 Instructions</h4>
                <ol class="instructions-list">
                    ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>

            ${recipe.chef_tips && recipe.chef_tips.length > 0 ? `
                <div class="recipe-section">
                    <h4 class="section-title">💡 Chef's Tips</h4>
                    <ul class="tips-list">
                        ${recipe.chef_tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${recipe.nutritional_notes ? `
                <div class="recipe-section">
                    <h4 class="section-title">🥗 Nutritional Notes</h4>
                    <p>${recipe.nutritional_notes}</p>
                </div>
            ` : ''}

            ${recipe.wine_pairing ? `
                <div class="recipe-section">
                    <h4 class="section-title">🍷 Wine Pairing</h4>
                    <p>${recipe.wine_pairing}</p>
                </div>
            ` : ''}

            <!-- NEW: Interactive Components -->
            <div class="recipe-interactive">
                <div class="interactive-section">
                    ${createSaveRecipeComponent(recipe).outerHTML}
                </div>
                <div class="interactive-section">
                    ${createRatingComponent(recipeId).outerHTML}
                </div>
            </div>

            <div class="recipe-footer">
                <div class="powered-by">
                    Crafted by ${recipe.powered_by || 'Célestique AI'} 
                    ${recipe.generated_at ? `• Generated: ${new Date(recipe.generated_at).toLocaleString()}` : ''}
                </div>
            </div>
        </div>
    `;
}

// Send message to API
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);

    // Clear input
    userInput.value = '';

    // Show loading
    showLoading();

    try {
        console.log('Sending request to API:', message);

        // FIXED: Use the correct endpoint path
        const response = await fetch('/api/recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received recipe data:', data);

        // Hide loading
        hideLoading();

        // Format and display recipe
        const formattedRecipe = formatRecipe(data);
        addMessage(formattedRecipe);

    } catch (error) {
        console.error('Error sending message:', error);

        // Hide loading
        hideLoading();

        // Show error message with helpful information
        const errorMessage = `
            <div class="recipe-error">
                <h3>🚨 Connection Error</h3>
                <p><strong>Unable to reach Célestique AI:</strong></p>
                <p>${error.message}</p>
                <div class="error-suggestions">
                    <h4>💡 Troubleshooting:</h4>
                    <ul>
                        <li>Check your internet connection</li>
                        <li>Ensure OPENROUTER_API_KEY is set in Vercel environment variables</li>
                        <li>Verify the API endpoint is deployed correctly</li>
                        <li>Try refreshing the page and trying again</li>
                    </ul>
                </div>
            </div>
        `;
        addMessage(errorMessage, false, true);
    }
}

// NEW: View Saved Recipes Component
function createSavedRecipesViewer() {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    if (savedRecipes.length === 0) {
        return `
            <div class="saved-recipes-empty">
                <div class="empty-icon">📚</div>
                <h4>No Saved Recipes Yet</h4>
                <p>Save your favorite recipes to see them here!</p>
            </div>
        `;
    }

    return `
        <div class="saved-recipes-list">
            <h4>Your Saved Recipes (${savedRecipes.length})</h4>
            ${savedRecipes.map(recipe => `
                <div class="saved-recipe-item">
                    <div class="saved-recipe-header">
                        <h5>${recipe.name}</h5>
                        <span class="saved-date">${new Date(recipe.savedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="saved-recipe-meta">
                        <span class="badge">${recipe.cuisine}</span>
                        <span class="badge">${recipe.difficulty}</span>
                    </div>
                    <button class="view-recipe-btn" onclick="loadSavedRecipe('${recipe.id}')">
                        View Recipe
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// NEW: Load saved recipe
function loadSavedRecipe(recipeId) {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const recipe = savedRecipes.find(r => r.id === recipeId);
    
    if (recipe) {
        const formattedRecipe = formatRecipe(recipe);
        addMessage(formattedRecipe);
    }
}

// Event listeners
sendMessageBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initLuxuryEffects();

    // Welcome message
    setTimeout(() => {
        const welcomeMessage = `
            <div class="welcome-message">
                <h3>🌟 Welcome to Célestique AI</h3>
                <p>I'm your personal AI chef, powered by <strong>DeepSeek AI</strong>. Simply tell me what you'd like to cook, and I'll create a gourmet recipe just for you!</p>

                <div class="example-prompts">
                    <h4>Try asking me:</h4>
                    <div class="prompt-suggestions">
                        <button class="suggestion-btn" onclick="userInput.value='chocolate lava cake'; sendMessage();">🍫 Chocolate Lava Cake</button>
                        <button class="suggestion-btn" onclick="userInput.value='seafood pasta'; sendMessage();">🦐 Seafood Pasta</button>
                        <button class="suggestion-btn" onclick="userInput.value='healthy salad'; sendMessage();">🥗 Healthy Salad</button>
                        <button class="suggestion-btn" onclick="userInput.value='homemade pizza'; sendMessage();">🍕 Homemade Pizza</button>
                    </div>
                </div>

                <!-- NEW: Saved Recipes Viewer -->
                <div class="saved-recipes-section">
                    <h4>📚 Your Recipe Collection</h4>
                    ${createSavedRecipesViewer()}
                </div>
            </div>
        `;
        addMessage(welcomeMessage);
    }, 1000);
});

// Add enhanced CSS for the new components
const style = document.createElement('style');
style.textContent = `
    .luxury-loader {
        display: flex;
        gap: 8px;
        margin-top: 10px;
    }

    .luxury-loader .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(45deg, var(--primary), var(--accent));
        animation: luxuryBounce 1.4s infinite ease-in-out both;
    }

    .luxury-loader .dot:nth-child(1) { animation-delay: -0.32s; }
    .luxury-loader .dot:nth-child(2) { animation-delay: -0.16s; }
    .luxury-loader .dot:nth-child(3) { animation-delay: 0s; }

    @keyframes luxuryBounce {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1.2); opacity: 1; }
    }

    .ai-thinking {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, rgba(110, 69, 226, 0.1), rgba(255, 107, 107, 0.1));
        border-radius: 15px;
        border: 1px solid rgba(110, 69, 226, 0.3);
    }

    .chef-icon {
        font-size: 2rem;
        margin-bottom: 10px;
    }

    .thinking-text {
        font-style: italic;
        color: var(--primary);
        margin-bottom: 15px;
    }

    .recipe-error {
        background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 69, 58, 0.1));
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 15px;
        padding: 20px;
        margin: 10px 0;
    }

    .recipe-error h3 {
        color: var(--accent);
        margin-bottom: 10px;
    }

    .error-suggestions {
        margin-top: 15px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
    }

    .error-suggestions h4 {
        color: var(--gold);
        margin-bottom: 10px;
    }

    .prompt-suggestions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        margin-top: 10px;
    }

    .suggestion-btn {
        background: linear-gradient(135deg, var(--primary), var(--accent));
        border: none;
        color: white;
        padding: 10px 15px;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }

    .suggestion-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(110, 69, 226, 0.4);
    }

    .powered-by {
        font-size: 0.8rem;
        color: var(--secondary);
        text-align: center;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* NEW: Interactive Components Styles */
    .recipe-interactive {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .interactive-section {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .save-recipe-btn {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        border: none;
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .save-recipe-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
    }

    .save-recipe-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .save-feedback {
        margin-top: 8px;
        font-size: 0.8rem;
        text-align: center;
        min-height: 20px;
    }

    .recipe-rating {
        text-align: center;
    }

    .rating-title {
        font-size: 0.9rem;
        margin-bottom: 10px;
        color: var(--secondary);
    }

    .stars-container {
        display: flex;
        gap: 5px;
        justify-content: center;
    }

    .star {
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .star:hover {
        transform: scale(1.2);
        color: #FFD700;
    }

    .rating-feedback {
        margin-top: 8px;
        font-size: 0.8rem;
        min-height: 20px;
    }

    /* Saved Recipes Styles */
    .saved-recipes-section {
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .saved-recipes-empty {
        text-align: center;
        padding: 30px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        margin-top: 15px;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 15px;
    }

    .saved-recipes-list {
        margin-top: 15px;
    }

    .saved-recipe-item {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .saved-recipe-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .saved-recipe-header h5 {
        margin: 0;
        color: var(--primary);
    }

    .saved-date {
        font-size: 0.8rem;
        color: var(--secondary);
    }

    .saved-recipe-meta {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }

    .view-recipe-btn {
        background: rgba(110, 69, 226, 0.2);
        border: 1px solid var(--primary);
        color: var(--primary);
        padding: 8px 15px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.8rem;
    }

    .view-recipe-btn:hover {
        background: var(--primary);
        color: white;
        transform: translateY(-1px);
    }

    @media (max-width: 768px) {
        .recipe-interactive {
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .saved-recipe-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
        }
    }
`;

document.head.appendChild(style);

// Make functions globally available for onclick events
window.loadSavedRecipe = loadSavedRecipe;