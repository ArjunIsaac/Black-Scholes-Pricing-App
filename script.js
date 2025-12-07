document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - starting app');
    
    const form = document.getElementById('optionForm');
    const resultCard = document.getElementById('result');
    const optionPrice = document.getElementById('optionPrice');
    const formulaInfo = document.getElementById('formulaInfo');
    const errorMessage = document.getElementById('errorMessage');
    const optionTypeDisplay = document.getElementById('optionTypeDisplay');
    const optionStatus = document.getElementById('optionStatus');
    const calcTime = document.getElementById('calcTime');
    
    // Get both option buttons
    const callBtn = document.querySelector('.call-btn');
    const putBtn = document.querySelector('.put-btn');
    const hiddenTypeInput = document.getElementById('optionType');
    
    // Initialize with Call selected
    let selectedOptionType = 'C';
    
    // Initialize empty state
    function initializeEmptyState() {
        optionPrice.textContent = '-';
        optionTypeDisplay.textContent = 'Call';
        optionStatus.textContent = '-';
        calcTime.textContent = '-';
        formulaInfo.textContent = 'Enter values and click "Calculate"';
        resultCard.className = 'card result-card'; // Reset to default state
        errorMessage.classList.add('hidden');
    }
    
    // Initialize on page load
    initializeEmptyState();
    
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
        selectedOptionType = type;
        hiddenTypeInput.value = type;
        optionTypeDisplay.textContent = type === 'C' ? 'Call Option' : 'Put Option';
        
        // Update button styles
        if (type === 'C') {
            callBtn.classList.add('active');
            putBtn.classList.remove('active');
        } else {
            putBtn.classList.add('active');
            callBtn.classList.remove('active');
        }
    }
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await calculateAndDisplay();
    });
    
    // Main calculation function
    async function calculateAndDisplay() {
        // Get form values
        const S = parseFloat(document.getElementById('S').value);
        const K = parseFloat(document.getElementById('K').value);
        const r = parseFloat(document.getElementById('r').value);
        const T = parseFloat(document.getElementById('T').value);
        const sigma = parseFloat(document.getElementById('sigma').value);
        
        // Validate inputs
        if (isNaN(S) || isNaN(K) || isNaN(r) || isNaN(T) || isNaN(sigma)) {
            showError('Please enter valid numbers for all fields');
            return;
        }
        
        if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
            showError('All values must be positive numbers');
            return;
        }
        
        // Show loading state
        const calculateBtn = document.querySelector('.btn-calculate');
        const originalText = calculateBtn.innerHTML;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
        calculateBtn.disabled = true;
        
        // Show loading state in result card
        resultCard.classList.add('calculating');
        optionPrice.textContent = '...';
        optionStatus.textContent = 'Calculating...';
        calcTime.textContent = '-';
        
        // Create request data
        const requestData = {
            'Stock Price': S,
            'Strike Price': K,
            'Risk-free rate': r,
            'Time': T,
            'Volatility': sigma,
            'type': selectedOptionType
        };
        
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Display result
            if (data.price !== undefined) {
                const price = parseFloat(data.price);
                optionPrice.textContent = '$' + price.toFixed(4);
                formulaInfo.textContent = data.formula_used || 'Black-Scholes calculation';
                
                // Determine option status
                const isCall = selectedOptionType === 'C';
                const intrinsicValue = isCall ? Math.max(S - K, 0) : Math.max(K - S, 0);
                const timeValue = price - intrinsicValue;
                
                if (intrinsicValue > 0) {
                    optionStatus.textContent = `In-the-Money ($${intrinsicValue.toFixed(2)} intrinsic + $${timeValue.toFixed(2)} time value)`;
                } else if (intrinsicValue === 0) {
                    optionStatus.textContent = `Out-of-the-Money ($${timeValue.toFixed(2)} time value)`;
                }
                
                // Add timestamp
                const now = new Date();
                const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                calcTime.textContent = timeString;
                
                // Set theme based on option type
                resultCard.className = 'card result-card';
                if (selectedOptionType === 'C') {
                    resultCard.classList.add('call-result');
                } else {
                    resultCard.classList.add('put-result');
                }
                
                errorMessage.classList.add('hidden');
                
                // Log to console for debugging
                console.log('Calculation successful:', {
                    price: price,
                    type: selectedOptionType === 'C' ? 'Call' : 'Put',
                    intrinsicValue: intrinsicValue,
                    timeValue: timeValue
                });
            } else {
                throw new Error('No price in response');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
            optionPrice.textContent = '-';
            optionStatus.textContent = 'Error';
            calcTime.textContent = '-';
            resultCard.className = 'card result-card'; // Reset to default on error
        } finally {
            // Restore button
            calculateBtn.innerHTML = originalText;
            calculateBtn.disabled = false;
            resultCard.classList.remove('calculating');
        }
    }
    
    function showError(message) {
        errorMessage.textContent = 'Error: ' + message;
        errorMessage.classList.remove('hidden');
    }
    
    // Add example buttons
    const exampleButtons = document.createElement('div');
    exampleButtons.className = 'example-buttons';
    
    // Call example button
    const callExampleBtn = document.createElement('button');
    callExampleBtn.type = 'button';
    callExampleBtn.className = 'btn btn-example';
    callExampleBtn.innerHTML = '<i class="fas fa-chart-line"></i> Example: Call Option';
    callExampleBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
    
    callExampleBtn.addEventListener('click', function() {
        document.getElementById('S').value = 105.50;
        document.getElementById('K').value = 100.00;
        document.getElementById('r').value = 0.045;
        document.getElementById('T').value = 0.75;
        document.getElementById('sigma').value = 0.25;
        selectOptionType('C');
    });
    
    // Put example button
    const putExampleBtn = document.createElement('button');
    putExampleBtn.type = 'button';
    putExampleBtn.className = 'btn btn-example';
    putExampleBtn.innerHTML = '<i class="fas fa-chart-line"></i> Example: Put Option';
    putExampleBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
    
    putExampleBtn.addEventListener('click', function() {
        document.getElementById('S').value = 95.50;
        document.getElementById('K').value = 100.00;
        document.getElementById('r').value = 0.045;
        document.getElementById('T').value = 0.75;
        document.getElementById('sigma').value = 0.30;
        selectOptionType('P');
    });
    
    // ATM example button
    const atmExampleBtn = document.createElement('button');
    atmExampleBtn.type = 'button';
    atmExampleBtn.className = 'btn btn-example';
    atmExampleBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Example: ATM Option';
    atmExampleBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    atmExampleBtn.addEventListener('click', function() {
        document.getElementById('S').value = 100.00;
        document.getElementById('K').value = 100.00;
        document.getElementById('r').value = 0.05;
        document.getElementById('T').value = 1.0;
        document.getElementById('sigma').value = 0.20;
        selectOptionType('C');
    });
    
    exampleButtons.appendChild(callExampleBtn);
    exampleButtons.appendChild(putExampleBtn);
    exampleButtons.appendChild(atmExampleBtn);
    form.appendChild(exampleButtons);
    
    // Input validation
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = Math.abs(this.value);
            }
        });
    });
    
    console.log('App initialization complete');
});
