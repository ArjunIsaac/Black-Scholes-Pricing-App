
from flask import Flask, request, render_template, jsonify
import numpy as np
import scipy.stats as stats
import json



app = Flask(__name__)


def blackScholes(S,K,r,T,sigma, type='C'):

    S = float(S) # stock price
    K = float(K) # risk-free price
    r = float(r) # interest rate
    T = float(T) # time
    sigma = float(sigma) # volatitlity

    # calculate blacksholes option for a call/put
    d1 = (np.log(S/K) + (r+(sigma**2/2)) *T) / (sigma* np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)

    try:
        if type=='C': # call option
            price= S*stats.norm.cdf(d1,0,1) - K*np.exp(-r*T)*stats.norm.cdf(d2,0,1)
        elif type=='P': #put option
            price = K*np.exp(-r*T)*stats.norm.cdf(-d2,0,1) - S*stats.norm.cdf(-d1,0,1)

        return price 
    

    except:
        print('Invalid')



@app.route('/')
def index():
    return render_template('index.html')


@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_jason()
        S = data.get('Stock Price')
        K = data.get('Strike Price')
        r = data.get('Risk-free rate')
        T = data.get('Time')
        sigma= data.get('Volatility')
        type= data.get('type', 'C')

        #validate inputs 
        if None in [S,K,r,T,sigma,type]:
            return jsonify({'error: All inputs are required'}), 400
        price, error = blackScholes(S,K,r,T, sigma, type)

        if error:
            return jsonify({'error:', error}), 400
        
        return jsonify({
            'Price': price, 'Formula' : f'Black scholes formula for {'Call' if type=='C' else 'Put'} Option'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}),500
    

@app.route('/batch calculate', methods=['POST'])
def batch_calculate():
    try:
        data = request.get_json()
        calculations = data.get('calculations', [])
        results=[]

        for calc in calculations:
            price, error = blackScholes(
                calc.get('Stock Price'),
                calc.get('Strike Price'),
                calc.get('Risk-free rate'),
                calc.get('Time'),
                calc.get('Volatility'),
                calc.get('type'=='C')  
            )

            results.append({'input':calc, 'price' : price if not error else None, 'error':error})

            return jsonify({'Results': results})
        
    except Exception as e:
        return jsonify({'error':str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
    