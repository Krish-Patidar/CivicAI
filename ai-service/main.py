from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import re
import time
import difflib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="Grievance AI Classification Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keyword-based NLP classification rules
CATEGORY_KEYWORDS = {
    "road": [
        "road", "pothole", "highway", "bridge", "footpath", "pavement",
        "traffic", "signal", "divider", "flyover", "accident", "speed breaker", "bump"
    ],
    "garbage": [
        "garbage", "waste", "trash", "dump", "litter", "dirty", "stink",
        "smelly", "rubbish", "filth", "refuse", "bin", "collection"
    ],
    "water": [
        "water", "pipe", "leakage", "flood", "drain", "tap", "supply",
        "pipeline", "sewage", "sewer", "overflow", "waterlog", "puddle", "pump"
    ],
    "electricity": [
        "electricity", "power", "light", "electric", "wire", "outage", "pole",
        "voltage", "transformer", "cable", "blackout", "streetlight", "spark"
    ],
    "sanitation": [
        "toilet", "sanitation", "hygiene", "clean", "bathroom", "latrine",
        "public toilet", "washroom", "open defecation", "health", "disease"
    ],
    "public_safety": [
        "crime", "safety", "accident", "danger", "illegal", "encroachment",
        "theft", "harassment", "threat", "violence", "unsafe", "security"
    ],
    "parks": [
        "park", "garden", "tree", "playground", "greenery", "bench",
        "recreation", "sports", "field", "grass", "plants", "maintenance"
    ]
}

PRIORITY_HIGH = [
    "urgent", "emergency", "immediately", "critical", "dangerous", "accident",
    "injury", "death", "fire", "explosion", "hazard", "severe", "children", "hospital"
]
PRIORITY_LOW = [
    "minor", "small", "little", "slight", "whenever", "sometime", "suggestion",
    "improvement", "optional", "nice to have"
]

PHRASE_BOOST = {
    "electricity": ["street light", "streetlight", "street lamp", "lamp post", "light pole", "power cut"],
    "road": ["speed breaker"],
}

def _has(text: str, term: str) -> bool:
    # word-start match: "light" matches "lights" but not "highlight"
    return re.search(rf'\b{re.escape(term)}', text) is not None

def classify_text(text: str) -> dict:
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)

    # Score each category
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if _has(text_lower, kw))
        score += 3 * sum(1 for p in PHRASE_BOOST.get(category, []) if _has(text_lower, p))
        if score > 0:
            scores[category] = score

    category = max(scores, key=scores.get) if scores else "other"

    # Priority detection
    high_score = sum(1 for kw in PRIORITY_HIGH if kw in text_lower)
    low_score = sum(1 for kw in PRIORITY_LOW if kw in text_lower)

    if high_score > 0:
        priority = "high"
    elif low_score > 0:
        priority = "low"
    else:
        # Estimate by text urgency indicators
        if any(c in text_lower for c in ["!", "asap", "immediately"]):
            priority = "high"
        else:
            priority = "medium"

    confidence = min(max(scores.values()) / 3.0, 1.0) if scores else 0.3

    return {
        "category": category,
        "priority": priority,
        "confidence": round(confidence, 2),
        "scores": scores
    }


class TextRequest(BaseModel):
    text: str


class PredictionResponse(BaseModel):
    category: str
    priority: str
    confidence: float
    department_suggestion: str


CATEGORY_DEPARTMENTS = {
    "road": "Roads & Infrastructure",
    "garbage": "Sanitation & Waste",
    "water": "Water Supply",
    "electricity": "Electricity Board",
    "sanitation": "Sanitation & Waste",
    "public_safety": "Public Safety",
    "parks": "Parks & Recreation",
    "other": "General Administration"
}


@app.get("/")
def root():
    return {"message": "Grievance AI Classification Service", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: TextRequest):
    result = classify_text(request.text)
    return {
        "category": result["category"],
        "priority": result["priority"],
        "confidence": result["confidence"],
        "department_suggestion": CATEGORY_DEPARTMENTS.get(result["category"], "General Administration")
    }


@app.post("/predict-with-image")
async def predict_with_image(
    text: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    # Text-based classification (image model would be added here)
    result = classify_text(text)
    return {
        "category": result["category"],
        "priority": result["priority"],
        "confidence": result["confidence"],
        "department_suggestion": CATEGORY_DEPARTMENTS.get(result["category"], "General Administration"),
        "image_processed": image is not None
    }


@app.get("/categories")
def get_categories():
    return {
        "categories": list(CATEGORY_KEYWORDS.keys()) + ["other"],
        "priorities": ["high", "medium", "low"]
    }


USER_COMPLAINT_HISTORY = {}

class LocationData(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None

class FraudRequest(BaseModel):
    description: str
    userId: str
    location: Optional[LocationData] = None
    imageUrl: Optional[str] = None

class FraudResponse(BaseModel):
    label: str
    confidence: float
    reason: str

@app.post("/fraud-check", response_model=FraudResponse)
async def check_fraud(request: FraudRequest):
    desc_lower = request.description.lower().strip()
    words = desc_lower.split()
    
    # 1. Very short description / Gibberish checking
    if len(words) < 3:
        return {"label": "fraud", "confidence": 0.95, "reason": "Description is too short or gibberish"}

    now = time.time()
    history = USER_COMPLAINT_HISTORY.get(request.userId, [])
    
    # 2. Too many complaints in a short time (> 3 in last 1 hour)
    recent = [record for record in history if now - record['timestamp'] < 3600]
    if len(recent) >= 3:
        return {"label": "fraud", "confidence": 0.88, "reason": "Rate limit: Too many complaints submitted recently"}

    # 3. Location Spam (Same location reported multiple times)
    if request.location and getattr(request.location, "lat", None) and getattr(request.location, "lng", None):
        req_lat = request.location.lat
        req_lng = request.location.lng
        recent_loc = [
            record for record in history 
            if record.get("lat") == req_lat and record.get("lng") == req_lng 
            and now - record['timestamp'] < 86400  # Within 24 hours
        ]
        if len(recent_loc) >= 2:
            return {"label": "suspicious", "confidence": 0.75, "reason": "Location reported multiple times recently"}

    # 4. Image Reuse across all users
    if request.imageUrl and request.imageUrl not in ('null', ''):
        for u_history in USER_COMPLAINT_HISTORY.values():
            for record in u_history:
                if record.get("imageUrl") == request.imageUrl:
                    return {"label": "fraud", "confidence": 0.92, "reason": "Exact same image reused in another complaint"}

    # 5. Advanced Duplicate text NLP checking (TF-IDF + Cosine Similarity)
    if len(history) > 0:
        past_texts = [record['description'] for record in history]
        try:
            vectorizer = TfidfVectorizer(stop_words='english').fit(past_texts + [desc_lower])
            vectors = vectorizer.transform(past_texts + [desc_lower])
            cosine_similarities = cosine_similarity(vectors[-1], vectors[:-1]).flatten()
            max_sim = max(cosine_similarities) if len(cosine_similarities) > 0 else 0.0
        except ValueError:
            # Fallback if vocabulary is empty
            max_sim = 0.0
            for past in past_texts:
                sim = difflib.SequenceMatcher(None, desc_lower, past).ratio()
                if sim > max_sim:
                    max_sim = sim
            
        if max_sim > 0.85:
            return {"label": "fraud", "confidence": round(float(max_sim), 2), "reason": "Duplicate complaint detected by semantic similarity"}
        elif max_sim > 0.60:
            return {"label": "suspicious", "confidence": round(float(max_sim), 2), "reason": "Highly similar phrase structure to past complaints"}
        
    # Valid, append to history memory
    USER_COMPLAINT_HISTORY.setdefault(request.userId, []).append({
        "description": desc_lower, 
        "timestamp": now,
        "lat": getattr(request.location, "lat", None) if request.location else None,
        "lng": getattr(request.location, "lng", None) if request.location else None,
        "imageUrl": request.imageUrl
    })
    
    return {"label": "genuine", "confidence": 0.99, "reason": "Passed all fraud checks"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
