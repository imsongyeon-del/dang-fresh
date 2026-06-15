from flask import Flask, send_from_directory, jsonify
import requests
import os

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/breeds')
def get_breeds():
    url = "https://apis.data.go.kr/1543061/abandonmentPublicSrvc/kind"
    params = {
        'up_kind_cd': '417000', 
        '_type': 'json',
        'serviceKey': '정부에서받은_서비스키_혹은_테스트키' 
    }
    
    try:
        # Request dog breed list from government API
        response = requests.get(url, params=params, timeout=4)
        if response.status_code == 200:
            data = response.json()
            body = data.get('response', {}).get('body', {})
            if body and 'items' in body and body['items'] and 'item' in body['items']:
                items = body['items']['item']
                if isinstance(items, list):
                    breed_list = [item['KNm'] for item in items if item.get('KNm')]
                elif isinstance(items, dict) and 'KNm' in items:
                    breed_list = [items['KNm']]
                else:
                    breed_list = []
                
                if breed_list:
                    # Deduplicate and sort
                    breed_list = sorted(list(set(breed_list)))
                    return jsonify(breed_list)
    except Exception as e:
        print("API request failed:", e)
        
    # Fallback to rich list if server fails or key is invalid
    fallback = ["말티즈", "포메라니안", "푸들", "치와와", "골든 리트리버", "시바견", "웰시코기", "진돗개", "시츄", "요크셔 테리어", "비숑 프리제", "닥스훈트", "비글", "리트리버"]
    return jsonify(fallback)

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True)
