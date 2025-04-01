# https://www.w3schools.com/python/python_json.asp
# https://flask.palletsprojects.com/en/stable/quickstart/

from flask import Flask
import json as JS

app = Flask(__name__)

@app.route("/signup/")
def sign_process():
    