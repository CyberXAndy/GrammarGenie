// Initialize core functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Remove preload class to enable transitions
    document.body.classList.remove('preload');
    
    // Initialize all components
    initializeAnimations();
    initializeEditor();
    initializeFloatingElements();
});

// GSAP Animations Setup
function initializeAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero text animation - Fixed to preserve gradient text
    const heroTitleLines = document.querySelectorAll('.hero-title > *');
    
    heroTitleLines.forEach(line => {
        if (!line.classList.contains('gradient-text')) {
            // Only split non-gradient text
            const splitText = new SplitType(line, { types: 'chars' });
            gsap.from(splitText.chars, {
                opacity: 0,
                y: 20,
                rotateX: -90,
                stagger: 0.02,
                duration: 1,
                ease: "back.out(1.7)",
            });
        } else {
            // Animate gradient text as a whole
            gsap.from(line, {
                opacity: 0,
                y: 20,
                duration: 1,
                ease: "back.out(1.7)",
            });
        }
    });

    // Animate the entire title container
    gsap.from('.hero-title', {
        scale: 0.9,
        duration: 1.5,
        ease: "expo.out",
    });

    // Feature cards animation
    gsap.from('.feature-card', {
        scrollTrigger: {
            trigger: '.features-grid',
            start: 'top center+=100',
            toggleActions: 'play none none reverse'
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
    });
}

// Editor Functionality
function initializeEditor() {
    const editor = {
        textInput: document.getElementById('textInput'),
        checkBtn: document.getElementById('checkGrammar'),
        clearBtn: document.getElementById('clearBtn'),
        copyBtn: document.getElementById('copyBtn'),
        highlights: document.getElementById('highlights'),
        corrections: new Map(),
        isChecking: false
    };

    // Event Listeners
    editor.textInput.addEventListener('input', debounce(() => {
        saveToLocalStorage(editor.textInput.value);
        updateEditorState(editor);
    }, 500));

    editor.checkBtn.addEventListener('click', () => handleGrammarCheck(editor));
    editor.clearBtn.addEventListener('click', () => clearEditor(editor));
    editor.copyBtn.addEventListener('click', () => copyText(editor));

    // Load saved content
    loadFromLocalStorage(editor);

    // Initialize button hover animations
    initializeButtonAnimations();
}

// Button Hover Animations
function initializeButtonAnimations() {
    const buttons = document.querySelectorAll('.check-btn, .action-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            gsap.to(button, {
                '--x': `${x}px`,
                '--y': `${y}px`,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                '--x': '50%',
                '--y': '50%',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

// Floating Elements Animation
function initializeFloatingElements() {
    const elements = document.querySelectorAll('.float-element');
    
    elements.forEach(element => {
        const speed = element.dataset.speed || 1;
        const randomX = Math.random() * window.innerWidth;
        const randomY = Math.random() * window.innerHeight;
        
        element.style.left = `${randomX}px`;
        element.style.top = `${randomY}px`;

        gsap.to(element, {
            x: 'random(-100, 100)',
            y: 'random(-100, 100)',
            duration: 10 * speed,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    });
}

// Grammar Checking Logic
async function handleGrammarCheck(editor) {
    if (editor.isChecking || !editor.textInput.value.trim()) return;

    try {
        editor.isChecking = true;
        const originalText = showLoadingState(editor.checkBtn);

        // Simulated API call (replace with actual grammar checking implementation)
        const corrections = await simulateGrammarCheck(editor.textInput.value);
        displayCorrections(editor, corrections);

    } catch (error) {
        showToast('Grammar check failed. Please try again.', 'error');
    } finally {
        editor.isChecking = false;
        hideLoadingState(editor.checkBtn);
    }
}

// Simulate Grammar Check (replace with actual implementation)
async function simulateGrammarCheck(text) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Example corrections
    return text.split('.').map((sentence, index) => ({
        original: sentence.trim(),
        suggestion: sentence.trim(),
        type: 'grammar',
        confidence: Math.random() * 100,
        position: {
            start: text.indexOf(sentence),
            end: text.indexOf(sentence) + sentence.length
        }
    })).filter(correction => correction.original);
}

// Display Corrections
function displayCorrections(editor, corrections) {
    editor.corrections.clear();
    editor.highlights.innerHTML = '';

    corrections.forEach(correction => {
        const mark = document.createElement('div');
        mark.className = 'correction-highlight';
        mark.style.cssText = `
            position: absolute;
            background: rgba(236, 72, 153, 0.1);
            border-bottom: 2px wavy #ec4899;
            pointer-events: auto;
            cursor: pointer;
        `;

        // Position the highlight
        const coords = getTextCoordinates(editor.textInput, correction.position);
        Object.assign(mark.style, coords);

        mark.addEventListener('click', () => showCorrectionPopup(correction, mark));
        editor.highlights.appendChild(mark);
        editor.corrections.set(mark, correction);
    });

    // Animate corrections
    gsap.from('.correction-highlight', {
        opacity: 0,
        y: -5,
        stagger: 0.05,
        duration: 0.3,
        ease: "power2.out"
    });
}

// Get text coordinates for highlighting
function getTextCoordinates(textarea, position) {
    const text = textarea.value;
    const beforeText = text.substring(0, position.start);
    const lines = beforeText.split('\n');
    
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const top = lines.length * lineHeight;
    
    return {
        top: `${top}px`,
        left: '4px',
        height: `${lineHeight}px`,
        width: `${(position.end - position.start) * 8}px`
    };
}

// UI State Management
function showLoadingState(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Checking...</span>
    `;
    return originalText;
}

function hideLoadingState(button) {
    button.disabled = false;
    button.innerHTML = `
        <span class="btn-text">Check Writing</span>
        <span class="btn-icon">→</span>
    `;
}

// Local Storage Management
function saveToLocalStorage(text) {
    localStorage.setItem('grammarGenie_text', text);
}

function loadFromLocalStorage(editor) {
    const savedText = localStorage.getItem('grammarGenie_text');
    if (savedText) {
        editor.textInput.value = savedText;
        updateEditorState(editor);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateEditorState(editor) {
    const hasText = editor.textInput.value.trim().length > 0;
    editor.checkBtn.disabled = !hasText;
    editor.clearBtn.disabled = !hasText;
    editor.copyBtn.disabled = !hasText;
}

async function copyText(editor) {
    try {
        await navigator.clipboard.writeText(editor.textInput.value);
        showToast('Copied to clipboard! ✨');
    } catch (err) {
        showToast('Failed to copy text', 'error');
    }
}

function clearEditor(editor) {
    editor.textInput.value = '';
    editor.highlights.innerHTML = '';
    localStorage.removeItem('grammarGenie_text');
    updateEditorState(editor);
    
    gsap.from(editor.textInput, {
        scale: 0.98,
        duration: 0.3,
        ease: "back.out(1.7)"
    });
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    gsap.fromTo(toast, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
    
    setTimeout(() => {
        gsap.to(toast, {
            y: -50,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => toast.remove()
        });
    }, 3000);
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e);
    showToast(e.message, 'error');
});