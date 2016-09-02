import urllib.request
import json
import math


baseURL = "https://schoolido.lu/api/cards/?&page_size=10&ordering=-id&rarity=SR,SSR,UR"

keysNeeded = ["skill_details", "attribute", "japan_only","is_promo","event",
                "skill","idol","rarity", "idolized_maximum_statistics_cool",
                "idolized_maximum_statistics_smile","idolized_maximum_statistics_pure",
                "non_idolized_maximum_statistics_pure", "non_idolized_maximum_statistics_cool",
                "non_idolized_maximum_statistics_smile","translated_collection","website_url",
                "round_card_idolized_image","round_card_image","id"]

aqours = ["Ohara Mari", "Kurosawa Dia", "Matsuura Kanan",
            "Takami Chika", "Sakurauchi Riko", "Watanabe You",
            "Kunikida Hanamaru", "Kurosawa Ruby", "Tsushima Yoshiko"]

muse = ["Toujou Nozomi", "Ayase Eli", "Yazawa Nico",
            "Kousaka Honoka", "Minami Kotori", "Sonoda Umi",
            "Hoshizora Rin", "Nishikino Maki", "Koizumi Hanayo"]

def isnumber(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

#TODO: make dict of card skill specifications
def skill(card):
    ## given a card, extract:
    # 0. skill type
    skill = {}
    skill['type'] = card['skill']
    print(card['skill_details'])

    numCount = 0;
    skillWords = card['skill_details'].split()
    for word in skillWords:

        if isnumber(word) and numCount < 1:
            # 1. skill activation count
            skill['activation_count'] = float(word)

            # 2. skill activation type
            skill['activation_type'] = skillWords[skillWords.index(word)+1]
            
            numCount = numCount + 1;
        elif isnumber(word) and numCount < 2:
            # 3. skill activation value
            skill['activation_value'] = float(word)

        if "%" in word:
            # 4. skill activation percentage
            skill['activation_percent'] = float(word.strip("%")) / 100





        ## and calculate
        # 4. score up value w/ and w/o Charm or Heel

        # 5. perfect lock value

        # 6. heal value
    print(skill)
    return skill


# TODO: cScore, oScore, stat to mod

# calculate stat base cScore and oScore off of
# input: dict card, bool idlz
def stat_to_mod(card, idlz):

    if card['attribute'] == "Pure" and idlz:
        stat = card['idolized_maximum_statistics_pure'];
    elif (not idlz) and card['attribute'] == "Pure":
        stat = card['non_idolized_maximum_statistics_pure'];
    elif idlz and card['attribute'] == "Smile":
        stat = card['idolized_maximum_statistics_smile'];
    elif (not idlz) and card['attribute'] == "Smile":
        stat = card['non_idolized_maximum_statistics_smile'];
    elif idlz and card['attribute'] == "Cool":
        stat = card['idolized_maximum_statistics_cool'];
    elif (not idlz) and card['attribute'] == "Cool":
        stat = card['non_idolized_maximum_statistics_cool'];


    if idlz and card['rarity'] == "UR":
        stat += 1000;
    elif (not idlz) and (card['rarity'] == "UR" or idlz and card['rarity'] == "SR"):
        stat += 500;
    elif (not idlz) and card['rarity'] == "SR":
        stat += 250;

    return stat;

def cScore(stat):
    return stat + (stat * (.09 + .03)) * 2

def oScore(stat):
    return stat + (stat * (.09 + .06)) * 2


def cleanCard(d, keys):
    ret = {key: d[key] for key in keys}

    # origin
    if ret['event']:
        ret['event'] = True
    if not ret['event'] and not ret['is_promo']:
        ret['premium'] = True
    else:
        ret['premium'] = False

    # idol mini object
    ret['name'] = ret['idol']['name']

    if ret['name'] in aqours:
        ret['main_unit'] = "Aqours"
    elif ret['name'] in muse:
        ret['main_unit'] = "Muse"
    else:
        ret['main_unit'] = "error"

    ret.pop('idol',None)

    # stats/scores
    ret['cScore'] = cScore(stat_to_mod(ret,False))
    ret['cScore_idlz'] = cScore(stat_to_mod(ret,True))
    ret['oScore'] = oScore(stat_to_mod(ret,False))
    ret['oScore_idlz'] = oScore(stat_to_mod(ret,True))

    # skill
    ret['skill'] = skill(ret)

    return ret


def getJSON(url):
    response = urllib.request.urlopen(url)
    data = response.read()
    data = "".join(map(chr, data))
    data = json.loads(data)
    # for (key,value) in data.items():
    #     print(key)
    return data


def setData(data,nextURL,cards):
    data = getJSON(nextURL)
    nextURL = data['next']

    for card in data['results']:
        cards.append(cleanCard(card,keysNeeded))



###########

data = getJSON(baseURL)
nextURL = data['next']
cards = [];
for card in data['results']:
    cards.append(cleanCard(card,keysNeeded))
i = 0
# while i < 2:
#     setData(data,nextURL,cards)
#     print("i = %d" % i)
#     i = i + 1

# with open('cards.js', 'w') as f:
#     f.write("app.constant('CardData',\n")
#     json.dump(cards,f,sort_keys=True)
#     f.write("\n);")



# while (nextURL):
#     setData(data,nextURL, nextURL, cards);
