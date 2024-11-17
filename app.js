// Import the pipeline function from Hugging Face
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

document.addEventListener("DOMContentLoaded", async () => {
    // DOM Elements
    const textInput = document.getElementById('textInput');
    const outputDiv = document.getElementById('output-div');
    const checkGrammarBtn = document.getElementById('checkGrammar');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const loadingSpinner = document.getElementById('loading-spinner');

    let pipe;

    // Prioritize UI animations
    prioritizeUIAnimations();

    // Lazy-load the Grammar Model
    loadGrammarModel();

    // Initialize Event Listeners
    initializeEventListeners();

    /**
     * Function to prioritize UI animations with optimizations.
     */
    function prioritizeUIAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Hero text animation with GPU-optimized transforms
        const heroTitleLines = document.querySelectorAll('.hero-title > *');
        heroTitleLines.forEach(line => {
            if (!line.classList.contains('gradient-text')) {
                const splitText = new SplitType(line, { types: 'chars' });
                gsap.from(splitText.chars, {
                    opacity: 0,
                    y: 20,
                    z: 0,
                    stagger: 0.02,
                    duration: 0.8,
                    ease: "power3.out",
                });
            } else {
                gsap.from(line, {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                    ease: "power3.out",
                });
            }
        });

        // Features grid animation
        initializeFeaturesGridAnimation();

        // Floating elements optimization
        initializeFloatingElements();
    }

    /**
     * Optimized features grid animation.
     */
    function initializeFeaturesGridAnimation() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.style.opacity = 1; // Ensure visibility before animation
        });

        // Debounce scroll-triggered animation
        gsap.from('.feature-card', {
            scrollTrigger: {
                trigger: '.features-grid',
                start: 'top center+=100',
                toggleActions: 'play none none reverse',
            },
            y: 50,
            opacity: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
        });
    }

    /**
     * Floating elements optimized to match the exact behavior described.
     */
    function initializeFloatingElements() {
        const elements = document.querySelectorAll('.float-element');

        elements.forEach(element => {
            const speed = element.dataset.speed || 1;
            const randomX = Math.random() * window.innerWidth;
            const randomY = Math.random() * window.innerHeight;

            element.style.position = 'absolute';
            element.style.left = `${randomX}px`;
            element.style.top = `${randomY}px`;

            gsap.to(element, {
                x: 'random(-100, 100)', // Random movement on X
                y: 'random(-100, 100)', // Random movement on Y
                duration: 10 * speed,
                repeat: -1, // Infinite loop
                yoyo: true,
                ease: 'sine.inOut',
            });
        });
    }

    /**
     * Lazy-load the grammar correction model.
     */
    async function loadGrammarModel() {
        try {
            pipe = await pipeline('text2text-generation', 'Xenova/t5-base-grammar-correction', {
                num_beams: 5,
                min_length: 1,
                max_length: 100,
            });
            checkGrammarBtn.removeAttribute('disabled');
        } catch (error) {
            console.error("Error loading AI model:", error);
            outputDiv.innerText = "Failed to load AI model. Retrying...";
            outputDiv.style.display = 'block';

            // Retry model loading after a short delay
            setTimeout(() => loadGrammarModel(), 3000);
        }
    }

    /**
     * Event listeners with throttling and debouncing.
     */
    function initializeEventListeners() {
        checkGrammarBtn.addEventListener('click', async () => handleGrammarCheck());
        clearBtn.addEventListener('click', clearEditor);
        copyBtn.addEventListener('click', async () => copyToClipboard(outputDiv.innerText));

        // Input debouncing
        textInput.addEventListener('input', debounce(() => {
            saveToLocalStorage(textInput.value);
            toggleButtonState();
        }, 300));

        // Throttle window resize event
        window.addEventListener('resize', throttle(() => {
            console.log("Window resized");
        }, 200));
    }

    /**
     * Grammar checking logic with error handling and spinner.
     */
    async function handleGrammarCheck() {
        const userInput = textInput.value.trim();
        if (!userInput || !pipe) return;

        checkGrammarBtn.setAttribute('disabled', 'true');
        loadingSpinner.style.display = 'block';
        outputDiv.style.display = 'none';

        try {
            const correctedText = await correctGrammar(userInput);
            outputDiv.innerText = correctedText;
            outputDiv.style.display = 'block';
        } catch (error) {
            console.error("Grammar correction error:", error);
            outputDiv.innerText = "An error occurred. Please try again.";
        } finally {
            loadingSpinner.style.display = 'none';
            checkGrammarBtn.removeAttribute('disabled');
        }
    }

    /**
     * Grammar correction function with capitalization and paragraph splitting.
     */
    async function correctGrammar(text) {
        // Split text into paragraphs based on line breaks
        const paragraphs = text.split('\n').filter(paragraph => paragraph.trim() !== '');

        // Process each paragraph separately
        const correctedParagraphs = [];
        for (const paragraph of paragraphs) {
            const sentences = splitSentences(paragraph);
            const correctedSentences = [];

            // Correct each sentence
            for (let sentence of sentences) {
                sentence = capitalizeFirstLetter(sentence); // Ensure capitalization
                try {
                    const result = await pipe(`grammar: ${sentence}`, {
                        num_beams: 5,
                        min_length: 1,
                        max_length: 100,
                    });
                    correctedSentences.push(result[0].generated_text.trim());
                } catch {
                    correctedSentences.push(sentence); // Fallback to original text on error
                }
            }

            // Join the sentences back with proper punctuation
            correctedParagraphs.push(correctedSentences.join(' '));
        }

        // Join paragraphs with line breaks for the output
        return correctedParagraphs.join('\n\n');
    }

    /**
     * Splits text into sentences, handling punctuation and line breaks.
     */
    function splitSentences(text) {
        // Regular expression to split text by punctuation marks that indicate sentence breaks
        const sentenceEndings = /([.!?])\s+/;
        return text.split(sentenceEndings).filter(Boolean).map((part, index, arr) => {
            if (index % 2 === 0) return part + (arr[index + 1] || '');
            return '';
        }).filter(Boolean);
    }

    /**
     * Capitalizes the first letter of a sentence if it's not capitalized.
     */
    function capitalizeFirstLetter(sentence) {
        if (!sentence) return sentence;
        return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    /**
     * Clears input and output areas.
     */
    function clearEditor() {
        textInput.value = '';
        outputDiv.innerText = '';
        localStorage.removeItem('grammarGenie_text');
        toggleButtonState();
    }

    /**
     * Toggles button states based on input content.
     */
    function toggleButtonState() {
        const hasText = textInput.value.trim().length > 0;
        checkGrammarBtn.disabled = !hasText;
        clearBtn.disabled = !hasText;
        copyBtn.disabled = !hasText;
    }

    /**
     * Copies text to clipboard.
     */
    async function copyToClipboard(text) {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            alert("Copied to clipboard! ✨");
        } catch (error) {
            console.error("Copy error:", error);
            alert("Failed to copy text.");
        }
    }

    /**
     * Debounce function to limit function execution frequency.
     */
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    /**
     * Throttle function to limit execution of frequent events.
     */
    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return (...args) => {
            if (!lastRan) {
                func(...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if (Date.now() - lastRan >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    /**
     * Saves text input to local storage.
     */
    function saveToLocalStorage(text) {
        localStorage.setItem('grammarGenie_text', text);
    }
});
