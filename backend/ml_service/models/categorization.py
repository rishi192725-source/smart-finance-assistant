import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

class CategorizationModel:
    def __init__(self):
        # Base practical model
        self.vectorizer = TfidfVectorizer(lowercase=True, max_features=1000, ngram_range=(1, 2))
        self.model = LogisticRegression(C=1.0, class_weight='balanced')
        self.is_trained = False
        
        # We start with some hardcoded/synthetic training data for the prototype
        self.base_descriptions = [
            "Uber ride", "Lyft", "Taxi", "Gas station", "Shell", "Chevron",
            "Walmart", "Target", "Groceries", "Whole Foods", "Trader Joes",
            "Netflix", "Spotify", "Hulu", "Subscription",
            "Salary", "Payroll", "Direct Deposit",
            "Starbucks", "Coffee", "Restaurant", "McDonalds", "Dining"
        ]
        self.base_categories = [
            "Transport", "Transport", "Transport", "Transport", "Transport", "Transport",
            "Shopping", "Shopping", "Food", "Food", "Food",
            "Entertainment", "Entertainment", "Entertainment", "Entertainment",
            "Income", "Income", "Income",
            "Food", "Food", "Food", "Food", "Food"
        ]
        self.train(self.base_descriptions, self.base_categories)

    def train(self, descriptions, categories):
        if not descriptions or not categories:
            return
        X = self.vectorizer.fit_transform(descriptions)
        self.model.fit(X, categories)
        self.is_trained = True

    def predict(self, description: str):
        if not self.is_trained:
            return None, 0.0
            
        X = self.vectorizer.transform([description])
        probs = self.model.predict_proba(X)[0]
        max_idx = probs.argmax()
        confidence = probs[max_idx]
        category = self.model.classes_[max_idx]
        
        return category, float(confidence)

categorizer = CategorizationModel()
