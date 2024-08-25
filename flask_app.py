import nltk
import json
from flask import Flask, request, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

# Load the SentenceTransformer model
model = SentenceTransformer('all-MiniLM-L6-v2')


# Initialize sentiment analyzer
nltk.download('vader_lexicon')
sia = SentimentIntensityAnalyzer()

with open('reviews.json') as f:
    reviews_data = json.load(f)

@app.route('/embed', methods=['POST'])
def embed_text():
    # Get the text from the request
    data = request.json
    text = data['text']
    
    print(text)
    # Generate the embeddings
    embeddings = model.encode(text).tolist()
    
    
    
    # Return the embeddings as JSON
    return jsonify({'embeddings': embeddings})

@app.route('/get_professor_sentiment', methods=['POST'])
def analyze_sentiment():

    professor_name = request.args.get('professor')
    
    # Filter reviews for the specified professor
    reviews = [review for review in reviews_data['reviews'] if review['professor'] == professor_name]
    
    if not reviews:
        return jsonify({'error': 'Professor not found'}), 404
    
    # Analyze sentiment for each review
    sentiments = []
    for review in reviews:
        sentiment = sia.polarity_scores(review['review'])
        sentiments.append({
            'professor': review['professor'],
            'review': review['review'],
            'sentiment': sentiment
        })
    
    # Aggregate sentiment analysis
    aggregated_sentiment = {
        'positive': sum(s['sentiment']['pos'] for s in sentiments) / len(sentiments),
        'neutral': sum(s['sentiment']['neu'] for s in sentiments) / len(sentiments),
        'negative': sum(s['sentiment']['neg'] for s in sentiments) / len(sentiments),
        'compound': sum(s['sentiment']['compound'] for s in sentiments) / len(sentiments)
    }
    
   
    return jsonify({'sentiment': aggregated_sentiment, 'reviews': sentiments})



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)