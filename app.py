from flask import Flask, request, render_template, jsonify
import numpy as np
import scipy.stats as stats
import traceback

app = Flask(__name__)

def blackScholes(S, K, r, T, sigma, type='C'):
    try:
        # Convert inputs to appropriate types
        S = float(S)  # stock price
        K = float(K)  # strike price
        r = float(r)  # interest rate
        T = float(T)  # time to expiration
        sigma = float(sigma)  # volatility

        # Validate inputs
        if T <= 0:
            return None, "Time to maturity must be positive"
        if sigma <= 0:
            return None, "Volatility must be positive"

        # calculate d1 and d2
        d1 = (np.log(S/K) + (r + (sigma**2/2)) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        if type == 'C':  # call option
            price = S * stats.norm.cdf(d1, 0, 1) - K * np.exp(-r * T) * stats.norm.cdf(d2, 0, 1)
        elif type == 'P':  # put option
            price = K * np.exp(-r * T) * stats.norm.cdf(-d2, 0, 1) - S * stats.norm.cdf(-d1, 0, 1)
        else:
            return None, "Invalid option type. Use 'C' for Call or 'P' for Put."

        return round(price, 4), None

    except Exception as e:
        return None, f"Calculation error: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        print("Calculate endpoint called")
        print("Request data:", request.data)
        
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        print("Parsed JSON:", data)
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract data
        S = data.get('Stock Price')
        K = data.get('Strike Price')
        r = data.get('Risk-free rate')
        T = data.get('Time')
        sigma = data.get('Volatility')
        option_type = data.get('type', 'C')

        print(f"Extracted values: S={S}, K={K}, r={r}, T={T}, sigma={sigma}, type={option_type}")

        # Validate inputs
        if None in [S, K, r, T, sigma]:
            missing = []
            if S is None: missing.append('Stock Price')
            if K is None: missing.append('Strike Price')
            if r is None: missing.append('Risk-free rate')
            if T is None: missing.append('Time')
            if sigma is None: missing.append('Volatility')
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        # Calculate option price
        price, error = blackScholes(S, K, r, T, sigma, option_type)

        if error:
            return jsonify({'error': error}), 400
        
        # Prepare response
        formula_text = f'Black-Scholes formula for {"Call" if option_type == "C" else "Put"} Option'
        
        response_data = {
            'price': price,
            'formula_used': formula_text
        }
        
        print("Sending response:", response_data)
        return jsonify(response_data)
    
    except Exception as e:
        print("Error in calculate endpoint:", str(e))
        print(traceback.format_exc())
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/test', methods=['GET'])
def test():
    """Test endpoint to check if server is working"""
    return jsonify({'status': 'ok', 'message': 'Server is running'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
