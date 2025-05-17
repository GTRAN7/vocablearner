// Vocabulary data structure
let vocabulary = JSON.parse(localStorage.getItem('vocabulary')) || [];

// Knowledge levels
const KNOWLEDGE_LEVELS = {
    BEGINNER: 0,
    INTERMEDIATE: 1,
    MASTERED: 2
};

// DOM Elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const vocabList = document.getElementById('vocabList');
const csvFile = document.getElementById('csvFile');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const clearWordsBtn = document.getElementById('clearWordsBtn');
const flashcardWord = document.getElementById('flashcardWord');
const flashcardDefinition = document.getElementById('flashcardDefinition');
const flipCard = document.getElementById('flipCard');
const prevCard = document.getElementById('prevCard');
const nextCard = document.getElementById('nextCard');
const quizContainer = document.getElementById('quizContainer');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const checkAnswer = document.getElementById('checkAnswer');
const nextQuestion = document.getElementById('nextQuestion');
const quizResults = document.getElementById('quizResults');
const quizScore = document.getElementById('quizScore');
const totalQuestions = document.getElementById('totalQuestions');
const restartQuiz = document.getElementById('restartQuiz');
const audioWords = document.getElementById('audioWords');
const audioInterval = document.getElementById('audioInterval');
const startAudio = document.getElementById('startAudio');
const stopAudio = document.getElementById('stopAudio');
const audioPlayer = document.getElementById('audioPlayer');

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;

// Matching Quiz variables
let matchingQuiz = {
    terms: [],
    definitions: [],
    matches: new Map(),
    lives: 3,
    timer: null,
    startTime: null,
    bestTime: localStorage.getItem('matchingBestTime') || '--:--'
};

// Navigation
function initializeNavigation() {
    // Hide all sections except the first one
    sections.forEach((section, index) => {
        section.classList.remove('active');
        if (index === 0) {
            section.classList.add('active');
        }
    });

    // Set first nav link as active
    navLinks.forEach((link, index) => {
        link.classList.remove('active');
        if (index === 0) {
            link.classList.add('active');
        }
    });

    // Add click event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.dataset.section;
            
            // Update active nav link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    updateVocabList();
    updateFlashcard();
    generateQuiz();
    
    // Load best time from localStorage
    const savedBestTime = localStorage.getItem('matchingBestTime');
    if (savedBestTime) {
        matchingQuiz.bestTime = savedBestTime;
        document.getElementById('bestTime').textContent = savedBestTime;
    }

    // Add event listener for new word form
    document.getElementById('newWordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const word = document.getElementById('newWord').value.trim();
        const definition = document.getElementById('newDefinition').value.trim();
        const example = document.getElementById('newExample').value.trim();
        
        if (word && definition) {
            vocabulary.push({
                word,
                definition,
                example,
                knowledgeLevel: KNOWLEDGE_LEVELS.BEGINNER
            });
            saveVocabulary();
            updateVocabList();
            updateFlashcard();
            
            // Clear form
            e.target.reset();
        }
    });
});

// Save vocabulary to local storage
function saveVocabulary() {
    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
}

// Clear all words
clearWordsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all words?')) {
        vocabulary = [];
        saveVocabulary();
        updateVocabList();
        updateFlashcard();
    }
});

// Update vocabulary list
function updateVocabList() {
    vocabList.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVocab = vocabulary.slice(startIndex, endIndex);
    
    // Display paginated words
    paginatedVocab.forEach((item, index) => {
        const actualIndex = startIndex + index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.word}</td>
            <td>${item.definition}</td>
            <td>${item.example}</td>
            <td>
                <span class="badge bg-${getKnowledgeLevelBadgeColor(item.knowledgeLevel)}">
                    ${getKnowledgeLevelText(item.knowledgeLevel)}
                </span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteWord(${actualIndex})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        vocabList.appendChild(row);
    });
    
    // Update pagination
    const totalPages = Math.ceil(vocabulary.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = `
        <nav aria-label="Vocabulary list pagination">
            <ul class="pagination mb-0">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}, event)">Previous</a>
                </li>
                <li class="page-item">
                    <span class="page-link">Page</span>
                </li>
                <li class="page-item">
                    <input type="number" class="form-control page-input" 
                           value="${currentPage}" min="1" max="${totalPages}"
                           onchange="changePage(this.value, event)"
                           style="width: 60px; text-align: center;">
                </li>
                <li class="page-item">
                    <span class="page-link">of ${totalPages}</span>
                </li>
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1}, event)">Next</a>
                </li>
            </ul>
        </nav>
    `;
}

function getKnowledgeLevelBadgeColor(level) {
    if (level === undefined || level === null) {
        return 'warning'; // Default to beginner (yellow) if no level set
    }
    switch(level) {
        case KNOWLEDGE_LEVELS.BEGINNER: return 'warning';
        case KNOWLEDGE_LEVELS.INTERMEDIATE: return 'info';
        case KNOWLEDGE_LEVELS.MASTERED: return 'success';
        default: return 'warning'; // Default to beginner (yellow) for any invalid level
    }
}

function getKnowledgeLevelText(level) {
    switch(level) {
        case KNOWLEDGE_LEVELS.BEGINNER: return 'Beginner';
        case KNOWLEDGE_LEVELS.INTERMEDIATE: return 'Intermediate';
        case KNOWLEDGE_LEVELS.MASTERED: return 'Mastered';
        default: return 'Beginner';
    }
}

// Delete word
function deleteWord(index) {
    vocabulary.splice(index, 1);
    saveVocabulary();
    updateVocabList();
}

// Load preset vocabulary list
document.getElementById('loadPresetBtn').addEventListener('click', async () => {
    const presetSelect = document.getElementById('presetVocabList');
    const selectedPreset = presetSelect.value;
    
    if (!selectedPreset) {
        alert('Please select a vocabulary list');
        return;
    }
    
    try {
        const response = await fetch(selectedPreset);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        // Parse text format
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('File is empty or has no data');
        }
        
        // Skip header line
        const dataLines = lines.slice(1);
        
        // Clear existing words
        vocabulary = [];
        
        // Add new words
        for (const line of dataLines) {
            // Parse CSV line properly handling quoted values
            const parts = [];
            let currentPart = '';
            let insideQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    parts.push(currentPart.trim());
                    currentPart = '';
                } else {
                    currentPart += char;
                }
            }
            // Add the last part
            parts.push(currentPart.trim());
            
            // Remove surrounding quotes from each part
            const cleanParts = parts.map(part => part.replace(/^"|"$/g, ''));
            
            if (cleanParts.length >= 2) {
                vocabulary.push({
                    word: cleanParts[0],
                    definition: cleanParts[1],
                    example: cleanParts[2] || '',
                    knowledgeLevel: KNOWLEDGE_LEVELS.BEGINNER
                });
            }
        }
        
        if (vocabulary.length === 0) {
            throw new Error('No valid words found in the file');
        }
        
        saveVocabulary();
        updateVocabList();
        updateFlashcard();
        alert(`Successfully loaded ${vocabulary.length} words from ${selectedPreset}`);
    } catch (error) {
        console.error('Error loading preset:', error);
        alert(`Error loading vocabulary list: ${error.message}`);
    }
});

// Import file
importBtn.addEventListener('click', () => {
    const file = csvFile.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    throw new Error('File is empty or has no data');
                }
                
                // Skip header line
                const dataLines = lines.slice(1);
                
                // Clear existing words
                vocabulary = [];
                
                // Add new words
                for (const line of dataLines) {
                    // Parse CSV line properly handling quoted values
                    const parts = [];
                    let currentPart = '';
                    let insideQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        
                        if (char === '"') {
                            insideQuotes = !insideQuotes;
                        } else if (char === ',' && !insideQuotes) {
                            parts.push(currentPart.trim());
                            currentPart = '';
                        } else {
                            currentPart += char;
                        }
                    }
                    // Add the last part
                    parts.push(currentPart.trim());
                    
                    // Remove surrounding quotes from each part
                    const cleanParts = parts.map(part => part.replace(/^"|"$/g, ''));
                    
                    if (cleanParts.length >= 2) {
                        vocabulary.push({
                            word: cleanParts[0],
                            definition: cleanParts[1],
                            example: cleanParts[2] || '',
                            knowledgeLevel: KNOWLEDGE_LEVELS.BEGINNER
                        });
                    }
                }
                
                if (vocabulary.length === 0) {
                    throw new Error('No valid words found in the file');
                }
                
                saveVocabulary();
                updateVocabList();
                updateFlashcard();
                alert(`Successfully imported ${vocabulary.length} words`);
            } catch (error) {
                console.error('Error importing file:', error);
                alert(`Error importing file: ${error.message}`);
            }
        };
        reader.onerror = function() {
            alert('Error reading file');
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file first');
    }
});

// Export CSV
exportBtn.addEventListener('click', () => {
    const csv = Papa.unparse(vocabulary);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary.csv';
    a.click();
    window.URL.revokeObjectURL(url);
});

// Flashcards
let currentCardIndex = 0;
let isFlipped = false;
let isShuffled = false;

function updateFlashcard() {
    if (vocabulary.length === 0) {
        flashcardWord.textContent = 'No words added yet';
        flashcardDefinition.textContent = '';
        return;
    }
    
    const card = vocabulary[currentCardIndex];
    
    // Add fade out transition
    flashcardWord.style.opacity = '0';
    flashcardDefinition.style.opacity = '0';
    
    // Update content after a short delay
    setTimeout(() => {
        flashcardWord.textContent = card.word;
        flashcardDefinition.textContent = `${card.definition}\n\nExample: ${card.example || 'No example provided'}`;
        
        // Reset flip state
        isFlipped = false;
        const flashcard = document.querySelector('.flashcard');
        flashcard.classList.remove('flipped');
        
        // Add fade in transition
        flashcardWord.style.opacity = '1';
        flashcardDefinition.style.opacity = '1';
    }, 150);
}

// Add flip card functionality
flipCard.addEventListener('click', () => {
    isFlipped = !isFlipped;
    const flashcard = document.querySelector('.flashcard');
    flashcard.classList.toggle('flipped');
});

// Add click to flip functionality
document.querySelector('.flashcard').addEventListener('click', (e) => {
    // Don't flip if clicking on navigation buttons
    if (e.target.closest('.flashcard-navigation')) return;
    flipCard.click();
});

// Add shuffle functionality
function toggleShuffle() {
    isShuffled = !isShuffled;
    if (isShuffled) {
        // Shuffle the vocabulary array
        vocabulary = vocabulary.sort(() => Math.random() - 0.5);
        currentCardIndex = 0;
        updateFlashcard();
        updateKnowledgeLevelDisplay();
    } else {
        // Restore original order
        vocabulary = JSON.parse(localStorage.getItem('vocabulary')) || [];
        currentCardIndex = 0;
        updateFlashcard();
        updateKnowledgeLevelDisplay();
    }
}

// Add event listener for shuffle button
document.getElementById('shuffleCards').addEventListener('click', toggleShuffle);

// Knowledge level controls for flashcards
function changeKnowledgeLevel(direction) {
    if (vocabulary.length === 0) return;
    
    const card = vocabulary[currentCardIndex];
    if (!card.knowledgeLevel) {
        card.knowledgeLevel = KNOWLEDGE_LEVELS.BEGINNER;
    }
    
    const newLevel = Math.max(KNOWLEDGE_LEVELS.BEGINNER, 
                            Math.min(KNOWLEDGE_LEVELS.MASTERED, 
                                   card.knowledgeLevel + direction));
    
    if (newLevel !== card.knowledgeLevel) {
        card.knowledgeLevel = newLevel;
        saveVocabulary();
        updateVocabList();
        updateKnowledgeLevelDisplay();
    }
}

function updateKnowledgeLevelDisplay() {
    const card = vocabulary[currentCardIndex];
    const levelDisplay = document.getElementById('currentKnowledgeLevel');
    if (levelDisplay && card) {
        levelDisplay.textContent = getKnowledgeLevelText(card.knowledgeLevel || KNOWLEDGE_LEVELS.BEGINNER);
        levelDisplay.className = `badge bg-${getKnowledgeLevelBadgeColor(card.knowledgeLevel)}`;
    }
}

document.addEventListener('keydown', (e) => {
    if (vocabulary.length === 0) return;
    
    switch(e.key) {
        case ' ':
            if (e.target === document.body) {
                e.preventDefault();
                flipCard.click();
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            prevCard.click();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextCard.click();
            break;
        case 'ArrowUp':
            e.preventDefault();
            changeKnowledgeLevel(1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            changeKnowledgeLevel(-1);
            break;
    }
});

// Update knowledge level display when changing cards
prevCard.addEventListener('click', () => {
    if (vocabulary.length === 0) return;
    currentCardIndex = (currentCardIndex - 1 + vocabulary.length) % vocabulary.length;
    updateFlashcard();
    updateKnowledgeLevelDisplay();
});

nextCard.addEventListener('click', () => {
    if (vocabulary.length === 0) return;
    currentCardIndex = (currentCardIndex + 1) % vocabulary.length;
    updateFlashcard();
    updateKnowledgeLevelDisplay();
});

// Initialize knowledge level display
updateKnowledgeLevelDisplay();

// Quiz
let currentQuizIndex = 0;
let quizScoreCount = 0;
let quizQuestions = [];
let selectedAnswer = null;

function generateQuiz() {
    if (vocabulary.length < 4) {
        quizQuestion.textContent = 'Add at least 4 words to start a quiz';
        quizOptions.innerHTML = '';
        checkAnswer.classList.add('d-none');
        return;
    }
    
    quizQuestions = [];
    // Weight words based on knowledge level
    const weightedVocab = vocabulary.flatMap(word => {
        const weight = 3 - (word.knowledgeLevel || KNOWLEDGE_LEVELS.BEGINNER);
        return Array(weight).fill(word);
    });
    
    const shuffledVocab = [...weightedVocab].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(10, vocabulary.length); i++) {
        const correctWord = shuffledVocab[i];
        const options = [correctWord];
        
        while (options.length < 4) {
            const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
            if (!options.includes(randomWord)) {
                options.push(randomWord);
            }
        }
        
        quizQuestions.push({
            question: correctWord.definition,
            options: options.sort(() => Math.random() - 0.5),
            correctAnswer: correctWord.word
        });
    }
    
    currentQuizIndex = 0;
    quizScoreCount = 0;
    showQuestion();
}

function showQuestion() {
    if (currentQuizIndex >= quizQuestions.length) {
        showResults();
        return;
    }
    
    const question = quizQuestions[currentQuizIndex];
    quizQuestion.innerHTML = `Question ${currentQuizIndex + 1}/${quizQuestions.length}<br><br>What word matches this definition?<br><br>"${question.question}"`;
    
    quizOptions.innerHTML = '';
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary d-block w-100 mb-2';
        button.textContent = option.word;
        button.onclick = () => {
            if (selectedAnswer === null) {
                selectedAnswer = option.word;
                checkQuizAnswer(option.word);
            }
        };
        quizOptions.appendChild(button);
    });
    
    selectedAnswer = null;
    checkAnswer.classList.remove('d-none');
    nextQuestion.classList.add('d-none');
}

function checkQuizAnswer(answer) {
    const question = quizQuestions[currentQuizIndex];
    const buttons = quizOptions.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === question.correctAnswer) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-success');
        } else if (button.textContent === answer && answer !== question.correctAnswer) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-danger');
        }
    });
    
    if (answer === question.correctAnswer) {
        quizScoreCount++;
        
        // Increase knowledge level for correct answer
        const wordIndex = vocabulary.findIndex(item => item.word === answer);
        if (wordIndex !== -1) {
            const word = vocabulary[wordIndex];
            if (word.knowledgeLevel < KNOWLEDGE_LEVELS.MASTERED) {
                word.knowledgeLevel = (word.knowledgeLevel || KNOWLEDGE_LEVELS.BEGINNER) + 1;
                word.lastUsed = Date.now();
                saveVocabulary();
            }
        }
    }
    
    checkAnswer.classList.add('d-none');
    nextQuestion.classList.remove('d-none');
}

nextQuestion.addEventListener('click', () => {
    currentQuizIndex++;
    showQuestion();
});

function showResults() {
    quizContainer.classList.add('d-none');
    quizResults.classList.remove('d-none');
    quizScore.textContent = quizScoreCount;
    totalQuestions.textContent = quizQuestions.length;
}

restartQuiz.addEventListener('click', () => {
    quizContainer.classList.remove('d-none');
    quizResults.classList.add('d-none');
    generateQuiz();
});

// Audio Learning
let availableVoices = [];
const voiceSelect = document.getElementById('voiceSelect');
let isPlaying = false;
let audioIntervalValue = 2.5; // Default interval in seconds
let selectedVoice = 'default';

// Load available voices when the page loads
window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
    updateVoiceOptions();
};

function updateVoiceOptions() {
    voiceSelect.innerHTML = '<option value="default">Default Voice</option>';
    availableVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

function getFilteredWords() {
    const knowledgeLevel = document.getElementById('audioKnowledgeLevel').value;
    let filteredWords = vocabulary;
    
    if (knowledgeLevel !== 'all') {
        const levelMap = {
            'beginner': KNOWLEDGE_LEVELS.BEGINNER,
            'intermediate': KNOWLEDGE_LEVELS.INTERMEDIATE,
            'mastered': KNOWLEDGE_LEVELS.MASTERED
        };
        filteredWords = vocabulary.filter(word => word.knowledgeLevel === levelMap[knowledgeLevel]);
    }
    
    if (document.getElementById('audioShuffle').checked) {
        filteredWords = [...filteredWords].sort(() => Math.random() - 0.5);
    }
    
    return filteredWords;
}

// Add event listener for knowledge level change
document.getElementById('audioKnowledgeLevel').addEventListener('change', () => {
    if (isPlaying) {
        stopAudio.click();
    }
});

async function playWordSequence() {
    if (isPlaying) return;
    
    const wordsToPlay = getFilteredWords();
    
    if (wordsToPlay.length === 0) {
        alert('No words available for the selected knowledge level');
        return;
    }
    
    isPlaying = true;
    startAudio.classList.add('d-none');
    stopAudio.classList.remove('d-none');
    
    for (const word of wordsToPlay) {
        if (!isPlaying) break;
        
        try {
            // Ensure we have valid word and definition
            if (!word.word || !word.definition) {
                console.warn('Skipping invalid word entry:', word);
                continue;
            }

            // Speak the word and wait for completion
            await speakText(word.word);
            await new Promise(resolve => setTimeout(resolve, audioIntervalValue * 1000));
            
            // Speak the definition and wait for completion
            await speakText(word.definition);
            await new Promise(resolve => setTimeout(resolve, audioIntervalValue * 1000));
            
            // Speak the example if it exists and wait for completion
            if (word.example && word.example.trim()) {
                await speakText(word.example);
                await new Promise(resolve => setTimeout(resolve, audioIntervalValue * 1000));
            }
            
            // Add a longer pause between words
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Error during audio playback:', error);
            break;
        }
    }
    
    isPlaying = false;
    startAudio.classList.remove('d-none');
    stopAudio.classList.add('d-none');
}

function speakText(text, rate = 0.8) {
    return new Promise((resolve, reject) => {
        if (!text || !text.trim()) {
            resolve();
            return;
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = rate;
        
        const selectedVoiceIndex = voiceSelect.value;
        if (selectedVoiceIndex !== 'default' && availableVoices[selectedVoiceIndex]) {
            utterance.voice = availableVoices[selectedVoiceIndex];
        }
        
        let hasEnded = false;
        
        utterance.onend = () => {
            if (!hasEnded) {
                hasEnded = true;
                resolve();
            }
        };
        
        utterance.onerror = (error) => {
            if (!hasEnded) {
                hasEnded = true;
                reject(error);
            }
        };
        
        // Add a timeout to prevent hanging
        setTimeout(() => {
            if (!hasEnded) {
                hasEnded = true;
                window.speechSynthesis.cancel();
                resolve();
            }
        }, 10000); // 10 second timeout
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
    });
}

startAudio.addEventListener('click', () => {
    playWordSequence();
});

stopAudio.addEventListener('click', () => {
    isPlaying = false;
    window.speechSynthesis.cancel();
    startAudio.classList.remove('d-none');
    stopAudio.classList.add('d-none');
});

// Add event listener for the audio interval input
audioInterval.addEventListener('change', () => {
    const value = parseFloat(audioInterval.value);
    if (value < 1) {
        audioInterval.value = 1;
    }
    audioIntervalValue = value;
});

// Load the features
updateVocabList();
updateFlashcard();
generateQuiz();

// Add pagination function
function changePage(newPage, event) {
    if (event) {
        event.preventDefault();
    }
    const totalPages = Math.ceil(vocabulary.length / itemsPerPage);
    newPage = parseInt(newPage);
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateVocabList();
    }
}

// Matching Quiz Functions
function startMatchingQuiz() {
    if (vocabulary.length < 10) {
        alert('Please add at least 10 words to start the matching quiz');
        return;
    }

    // Reset quiz state
    matchingQuiz.matches.clear();
    matchingQuiz.lives = 3;
    matchingQuiz.terms = [];
    matchingQuiz.definitions = [];

    // Reset hearts - show all hearts as active
    const hearts = document.querySelectorAll('#matchingLives i');
    hearts.forEach(heart => {
        heart.classList.remove('broken', 'heart-break');
    });

    // Weight words based on knowledge level and recent usage
    const weightedVocab = vocabulary.flatMap(word => {
        // Base weight from knowledge level (lower level = higher weight)
        const baseWeight = 3 - (word.knowledgeLevel || KNOWLEDGE_LEVELS.BEGINNER);
        
        // Additional weight for words that haven't been used recently
        const lastUsed = word.lastUsed || 0;
        const timeSinceLastUse = Date.now() - lastUsed;
        const recencyWeight = Math.min(2, Math.floor(timeSinceLastUse / (24 * 60 * 60 * 1000))); // Max 2 extra weight for words not used in 2+ days
        
        return Array(baseWeight + recencyWeight).fill(word);
    });
    
    // Select 10 random words, ensuring no duplicates
    const selectedWords = new Set();
    const shuffled = [...weightedVocab].sort(() => Math.random() - 0.5);
    const uniqueWords = [];
    
    for (const word of shuffled) {
        if (!selectedWords.has(word.word)) {
            selectedWords.add(word.word);
            uniqueWords.push(word);
            if (uniqueWords.length === 10) break;
        }
    }
    
    matchingQuiz.terms = uniqueWords.map(item => item.word);
    matchingQuiz.definitions = uniqueWords.map(item => item.definition);

    // Combine terms and definitions and shuffle them
    const allItems = [
        ...matchingQuiz.terms.map(term => ({ type: 'term', content: term })),
        ...matchingQuiz.definitions.map(def => ({ type: 'definition', content: def }))
    ].sort(() => Math.random() - 0.5);

    // Update UI with scattered layout
    const container = document.getElementById('matchingTerms');
    container.innerHTML = allItems
        .map(item => {
            const dataAttr = item.type === 'term' ? 'term' : 'definition';
            return `<button class="list-group-item list-group-item-action" 
                           data-${dataAttr}="${item.content}">${item.content}</button>`;
        })
        .join('');

    // Show/hide appropriate buttons
    document.getElementById('startMatching').classList.add('d-none');
    document.getElementById('matchingResults').classList.add('d-none');
    document.getElementById('matchingContainer').classList.remove('d-none');

    // Start timer
    matchingQuiz.startTime = Date.now();
    updateTimer();
    matchingQuiz.timer = setInterval(updateTimer, 1000);

    // Add click handlers
    addMatchingClickHandlers();
}

function addMatchingClickHandlers() {
    const buttons = document.querySelectorAll('#matchingTerms button');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.term) {
                handleTermClick(button);
            } else if (button.dataset.definition) {
                handleDefinitionClick(button);
            }
        });
    });
}

function showNotification(message) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create and show new notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after animation completes
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateLivesDisplay() {
    const hearts = document.querySelectorAll('#matchingLives i');
    const remainingLives = matchingQuiz.lives;
    
    hearts.forEach((heart, index) => {
        if (index < remainingLives) {
            heart.classList.remove('broken', 'heart-break');
        } else {
            heart.classList.add('heart-break');
            setTimeout(() => heart.classList.add('broken'), 500);
        }
    });
}

function handleTermClick(termButton) {
    // Don't allow clicking on already matched items
    if (termButton.classList.contains('matched')) {
        return;
    }

    // If clicking the same button that's already selected, deselect it
    if (termButton.classList.contains('selected')) {
        termButton.classList.remove('selected');
        return;
    }

    const selectedTerm = termButton.dataset.term;
    const selectedDef = document.querySelector('#matchingTerms button[data-definition].selected');
    
    if (selectedDef) {
        // Check if match is correct
        const correctDef = vocabulary.find(item => item.word === selectedTerm).definition;
        if (selectedDef.dataset.definition === correctDef) {
            termButton.classList.add('matched');
            selectedDef.classList.add('matched');
            matchingQuiz.matches.set(selectedTerm, correctDef);
            
            // Update word's knowledge level and last used time
            const wordIndex = vocabulary.findIndex(item => item.word === selectedTerm);
            if (wordIndex !== -1) {
                const word = vocabulary[wordIndex];
                // Increase knowledge level if not already mastered
                if (word.knowledgeLevel < KNOWLEDGE_LEVELS.MASTERED) {
                    word.knowledgeLevel = (word.knowledgeLevel || KNOWLEDGE_LEVELS.BEGINNER) + 1;
                }
                // Update last used time
                word.lastUsed = Date.now();
                saveVocabulary();
            }

            // Check if all matches are complete
            if (matchingQuiz.matches.size === matchingQuiz.terms.length) {
                clearInterval(matchingQuiz.timer);
                endMatchingQuiz(true);
            }
        } else {
            matchingQuiz.lives--;
            updateLivesDisplay();
            
            // Show error notification
            showNotification('Incorrect match! Try again.');

            if (matchingQuiz.lives <= 0) {
                clearInterval(matchingQuiz.timer);
                endMatchingQuiz(false);
            }
        }
        selectedDef.classList.remove('selected');
    } else {
        // Select term
        document.querySelectorAll('#matchingTerms button[data-term]').forEach(btn => {
            if (!btn.classList.contains('matched')) {
                btn.classList.remove('selected');
            }
        });
        termButton.classList.add('selected');
    }
}

function handleDefinitionClick(defButton) {
    // Don't allow clicking on already matched items
    if (defButton.classList.contains('matched')) {
        return;
    }

    // If clicking the same button that's already selected, deselect it
    if (defButton.classList.contains('selected')) {
        defButton.classList.remove('selected');
        return;
    }

    const selectedTerm = document.querySelector('#matchingTerms button[data-term].selected');
    
    if (selectedTerm) {
        // Check if match is correct
        const correctDef = vocabulary.find(item => item.word === selectedTerm.dataset.term).definition;
        if (defButton.dataset.definition === correctDef) {
            selectedTerm.classList.add('matched');
            defButton.classList.add('matched');
            matchingQuiz.matches.set(selectedTerm.dataset.term, correctDef);
            
            // Update word's knowledge level and last used time
            const wordIndex = vocabulary.findIndex(item => item.word === selectedTerm.dataset.term);
            if (wordIndex !== -1) {
                const word = vocabulary[wordIndex];
                // Increase knowledge level if not already mastered
                if (word.knowledgeLevel < KNOWLEDGE_LEVELS.MASTERED) {
                    word.knowledgeLevel = (word.knowledgeLevel || KNOWLEDGE_LEVELS.BEGINNER) + 1;
                }
                // Update last used time
                word.lastUsed = Date.now();
                saveVocabulary();
            }

            // Check if all matches are complete
            if (matchingQuiz.matches.size === matchingQuiz.terms.length) {
                clearInterval(matchingQuiz.timer);
                endMatchingQuiz(true);
            }
        } else {
            matchingQuiz.lives--;
            updateLivesDisplay();
            
            // Show error notification
            showNotification('Incorrect match! Try again.');

            if (matchingQuiz.lives <= 0) {
                clearInterval(matchingQuiz.timer);
                endMatchingQuiz(false);
            }
        }
        selectedTerm.classList.remove('selected');
    } else {
        // Select definition
        document.querySelectorAll('#matchingTerms button[data-definition]').forEach(btn => {
            if (!btn.classList.contains('matched')) {
                btn.classList.remove('selected');
            }
        });
        defButton.classList.add('selected');
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - matchingQuiz.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('matchingTimer').textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function endMatchingQuiz(isWin) {
    clearInterval(matchingQuiz.timer);
    
    // Calculate final time
    const elapsed = Math.floor((Date.now() - matchingQuiz.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update best time if won and time is better
    if (isWin) {
        const currentBestTime = parseTime(matchingQuiz.bestTime);
        if (matchingQuiz.bestTime === '--:--' || elapsed < currentBestTime) {
            matchingQuiz.bestTime = timeString;
            localStorage.setItem('matchingBestTime', timeString);
            document.getElementById('bestTime').textContent = timeString;
        }
    }
    
    // Show results
    const resultsDiv = document.getElementById('matchingResults');
    resultsDiv.innerHTML = `
        <h4>Matching Results</h4>
        <div class="alert ${isWin ? 'alert-success' : 'alert-danger'}">
            <h5>${isWin ? 'Congratulations!' : 'Game Over'}</h5>
            <p>${isWin ? 'You matched all terms correctly!' : 'You ran out of lives!'}</p>
        </div>
        <p>Time: <span id="finalTime">${timeString}</span></p>
        <p>Best Time: <span id="displayBestTime">${matchingQuiz.bestTime}</span></p>
        <button class="btn btn-primary" id="restartMatching">Try Again</button>
    `;
    
    document.getElementById('matchingContainer').classList.add('d-none');
    resultsDiv.classList.remove('d-none');

    // Add event listener to the new restart button
    document.getElementById('restartMatching').addEventListener('click', startMatchingQuiz);
}

function parseTime(timeString) {
    if (timeString === '--:--') return Infinity;
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
}

// Add event listeners for matching quiz
document.getElementById('startMatching').addEventListener('click', startMatchingQuiz);

// Add event listener for clear best time button
document.getElementById('clearBestTime').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your best time?')) {
        matchingQuiz.bestTime = '--:--';
        localStorage.removeItem('matchingBestTime');
        document.getElementById('bestTime').textContent = '--:--';
    }
});

// Add event listener for deselect button
document.getElementById('deselectBtn').addEventListener('click', () => {
    document.querySelectorAll('#matchingTerms button').forEach(btn => {
        if (!btn.classList.contains('matched')) {
            btn.classList.remove('selected');
        }
    });
}); 
