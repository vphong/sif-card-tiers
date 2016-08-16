import urllib.request
import json

url = "https://schoolido.lu/api/cards/?&page_size=10&ordering=-id&rarity=SR,SSR,UR"

response = urllib.request.urlopen(url)
data = (response.read().decode("utf-8").encode('utf-8'))
#data = eval(data).stringify(eval(data))
print(data)
