import os
import cv2
import time
import pytesseract
import requests

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# ==========================================================
# Flask App
# ==========================================================

app = Flask(__name__)
CORS(app)

# ==========================================================
# Load Environment Variables
# ==========================================================

load_dotenv()

VISION_ENDPOINT = os.getenv("VISION_ENDPOINT")
VISION_KEY = os.getenv("VISION_KEY")

OCR_URL = VISION_ENDPOINT + "vision/v3.2/read/analyze"

HEADERS = {
    "Ocp-Apim-Subscription-Key": VISION_KEY,
    "Content-Type": "application/octet-stream"
}

# ==========================================================
# Upload Folder
# ==========================================================

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==========================================================
# Configure Tesseract
# ==========================================================

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ==========================================================
# Traditional OCR
# ==========================================================

def traditional_ocr(image_path):

    start = time.time()

    image = cv2.imread(image_path)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    text = pytesseract.image_to_string(gray)

    end = time.time()

    return {

        "text": text.strip(),

        "characters": len(text),

        "words": len(text.split()),

        "processing_time": round(end-start,2)

    }

# ==========================================================
# Azure AI OCR
# ==========================================================

def azure_ocr(image_path):

    with open(image_path,"rb") as img:

        response = requests.post(

            OCR_URL,

            headers=HEADERS,

            data=img.read()

        )

    if response.status_code != 202:

        return {

            "text":"Azure OCR Failed",

            "characters":0,

            "words":0,

            "processing_time":0

        }

    operation_url = response.headers["Operation-Location"]

    start = time.time()

    while True:

        result = requests.get(

            operation_url,

            headers={

                "Ocp-Apim-Subscription-Key":VISION_KEY

            }

        ).json()

        if result["status"] == "succeeded":

            break

        elif result["status"] == "failed":

            return {

                "text":"OCR Failed",

                "characters":0,

                "words":0,

                "processing_time":0

            }

        time.sleep(1)

    text = ""

    for page in result["analyzeResult"]["readResults"]:

        for line in page["lines"]:

            text += line["text"] + "\n"

    end = time.time()

    return {

        "text": text.strip(),

        "characters": len(text),

        "words": len(text.split()),

        "processing_time": round(end-start,2)

    }

# ==========================================================
# Comparison
# ==========================================================

def compare_results(normal, azure):

    winner = "Tie"

    if azure["words"] > normal["words"]:

        winner = "Azure AI OCR"

    elif normal["words"] > azure["words"]:

        winner = "Traditional OCR"

    return {

        "winner": winner,

        "character_difference":
            azure["characters"]-normal["characters"],

        "word_difference":
            azure["words"]-normal["words"],

        "time_difference":
            round(normal["processing_time"]-
            azure["processing_time"],2)

    }

# ==========================================================
# Home Page
# ==========================================================

@app.route("/")

def home():

    return render_template("index.html")

# ==========================================================
# OCR API
# ==========================================================

@app.route("/extract",methods=["POST"])

def extract():

    try:

        if "image" not in request.files:

            return jsonify({

                "success":False,

                "message":"Please upload an image."

            })

        image = request.files["image"]

        image_path = os.path.join(

            UPLOAD_FOLDER,

            image.filename

        )

        image.save(image_path)

        traditional = traditional_ocr(image_path)

        azure = azure_ocr(image_path)

        comparison = compare_results(

            traditional,

            azure

        )

        return jsonify({

            "success":True,

            "traditional_ocr":traditional,

            "azure_ocr":azure,

            "comparison":comparison

        })

    except Exception as e:

        return jsonify({

            "success":False,

            "error":str(e)

        })

# ==========================================================
# Run
# ==========================================================

if __name__=="__main__":

    app.run(debug=True)