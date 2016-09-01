import json

url = "http://schoolido.lu/api/cards/?&page_size=10&ordering=-id&rarity=SR,SSR,UR"

response = urllib.request.get(url)
print(response)
