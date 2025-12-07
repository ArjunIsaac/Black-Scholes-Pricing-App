document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('optionForm');
    const resultCard = document.getElementById('result');
    const optionPrice = document.getElementById('optionPrice');
    const formulaInfo = document.getElementById('formulaInfo');
    const errorMessage = document.getElementById('errorMessage');
    const hiddenTypeInput = document.getElementById('optionType');
    
    // Get both option buttons
    const callBtn = document.querySelector('.call-btn');
    const putBtn = document.querySelector('.put-btn');
    
    // Initialize with Call selected
    let selectedOptionType = 'C';
    
    // Handle Call button click
    callBtn.addEventListener('click', function() {
        selectOptionType('C');
    });
    
    // Handle Put button click
    putBtn.addEventListener('click', function() {
        selectOptionType('P');
    });
    
    // Function to select option type
    function selectOptionType(type) {
        // Update selected type
        selectedOptionType = type;
        hiddenTypeInput.value = type;
        
        // Update button styles
        if (type === 'C') {
            callBtn.classList.add('active');
            putBtn.classList.remove('active');
            
            // Update result card theme if it's visible
            if (!resultCard.classList.contains('hidden')) {
                resultCard.classList.remove('put-result');
                resultCard.classList.add('call-result');
            }
        } else {
            putBtn.classList.add('active');
            callBtn.classList.remove('active');
            
            // Update result card theme if it's visible
            if (!resultCard.classList.contains('hidden')) {
                resultCard.classList.remove('call-result');
                resultCard.classList.add('put-result');
            }
        }
        
        // Auto-calculate if form is already filled (optional)
        if (shouldAutoRecalculate()) {
            debouncedRecalculate();
        }
    }
    
    // Optional: Auto-recalculate when option type changes
    function shouldAutoRecalculate() {
        const S = document.getElementById('S').value;
        const K = document.getElementById('K').value;
        return S && K; // Only auto-recalculate if basic fields are filled
    }
    
    // Debounced recalculation
    const debouncedRecalculate = debounce(recalculateOption, 500);
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await calculateAndDisplay();
    });
    
    // Main calculation function
    async function calculateAndDisplay() {
        // Get form values
        const stockPrice = document.getElementById('S').value;
        const strikePrice = document.getElementById('K').value;
        const riskFreeRate = document.getElementById('r').value;
        const time = document.getElementById('T').value;
        const volatility = document.getElementById('sigma').value;
        
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // CHANGED HERE: Using descriptive key names
                body: JSON.stringify({
                    'Stock Price': stockPrice,
                    'Strike Price': strikePrice,
                    'Risk-free rate': riskFreeRate,
                    'Time': time,
                    'Volatility': volatility,
                    'type': selectedOptionType
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Display result
                optionPrice.textContent = data.price.toFixed(4);
                formulaInfo.textContent = data.formula_used;
                
                // Apply theme based on option type
                resultCard.className = 'result-card';
                if (selectedOptionType === 'C') {
                    resultCard.classList.add('call-result');
                } else {
                    resultCard.classList.add('put-result');
                }
                resultCard.classList.remove('hidden');
                
                errorMessage.classList.add('hidden');
            } else {
                showError(data.error || 'An error occurred');
            }
        } catch (error) {
            showError('Network error: ' + error.message);
        }
    }
    
    // Optional: Recalculate function for auto-updates
    async function recalculateOption() {
        if (shouldAutoRecalculate()) {
            await calculateAndDisplay();
        }
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        resultCard.classList.add('hidden');
    }
    
    // Input validation
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = Math.abs(this.value);
            }
            
            // Optional: Auto-recalculate when inputs change
            if (shouldAutoRecalculate()) {
                debouncedRecalculate();
            }
        });
    });
    
    // Debounce utility function
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
    
    // Example button (optional enhancement)
    const exampleButton = document.createElement('button');
    exampleButton.type = 'button';
    exampleButton.className = 'btn btn-example';
    exampleButton.innerHTML = '<i class="fas fa-rocket"></i> Load Call Example';
    exampleButton.style.marginTop = '15px';
    exampleButton.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
    
    exampleButton.addEventListener('click', function() {
        // Load example values for a Call option
        document.getElementById('S').value = 105.50;
        document.getElementById('K').value = 100.00;
        document.getElementById('r').value = 0.045;
        document.getElementById('T').value = 0.75;
        document.getElementById('sigma').value = 0.25;
        
        // Select Call option
        selectOptionType('C');
        
        // Auto-calculate
        calculateAndDisplay();
    });
    
    // Add a second example button for Put
    const putExampleButton = document.createElement('button');
    putExampleButton.type = 'button';
    putExampleButton.className = 'btn btn-example';
    putExampleButton.innerHTML = '<i class="fas fa-rocket"></i> Load Put Example';
    putExampleButton.style.marginTop = '15px';
    putExampleButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
    putExampleButton.style.marginLeft = '10px';
    
    putExampleButton.addEventListener('click', function() {
        // Load example values for a Put option
        document.getElementById('S').value = 95.50;
        document.getElementById('K').value = 100.00;
        document.getElementById('r').value = 0.045;
        document.getElementById('T').value = 0.75;
        document.getElementById('sigma').value = 0.30;
        
        // Select Put option
        selectOptionType('P');
        
        // Auto-calculate
        calculateAndDisplay();
    });
    
    // Add buttons to form
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.appendChild(exampleButton);
    buttonContainer.appendChild(putExampleButton);
    form.appendChild(buttonContainer);
    
    // Keyboard shortcuts (optional)
    document.addEventListener('keydown', function(e) {
        // Ctrl+1 for Call, Ctrl+2 for Put
        if (e.ctrlKey) {
            if (e.key === '1') {
                e.preventDefault();
                selectOptionType('C');
            } else if (e.key === '2') {
                e.preventDefault();
                selectOptionType('P');
            } else if (e.key === 'Enter' && e.altKey) {
                e.preventDefault();
                calculateAndDisplay();
            }
        }
    });
    
    // Show keyboard shortcut hint
    const shortcutHint = document.createElement('div');
    shortcutHint.className = 'shortcut-hint';
    shortcutHint.innerHTML = '<small>Tip: Use Ctrl+1 for Call, Ctrl+2 for Put, Alt+Enter to calculate</small>';
    shortcutHint.style.marginTop = '10px';
    shortcutHint.style.color = '#64748b';
    shortcutHint.style.fontSize = '0.85rem';
    form.appendChild(shortcutHint);
});