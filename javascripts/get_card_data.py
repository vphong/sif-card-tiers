import urllib.request
import json


baseURL = "http://schoolido.lu/api/cards/?ordering=-id&is_special=False&page_size=100&rarity=SR%2CSSR%2CUR"

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
# def skillDetails(card):
#     ## given a card, extract:
#     # 0. skill type
#     print("skillDetails()")
#     skill = {}
#     skillNums = {}
#     skill['type'] = card['skill']
#
#
#     # TODO: handle promo skills
#     # if not skill['type'] == "Perfect Lock" or not skill['type'] == "Healer" or not skill['type'] == "Score Up":
#     #     return skill
#
#
#     numCount = 0;
#     skillWords = card['skill_details'].split()
#     for word in skillWords:
#
#         if isnumber(word) and numCount < 1:
#             # 1. skill activation count
#             skillNums['activation_count'] = float(word)
#
#             # 2. skill activation type
#             skillNums['activation_type'] = skillWords[skillWords.index(word)+1]
#
#             numCount = numCount + 1;
#
#         elif isnumber(word) and numCount < 2:
#             # 3. skill activation value
#             skillNums['activation_value'] = float(word)
#
#         if "%" in word:
#             # 4. skill activation percentage
#             skillNums['activation_percent'] = float(word.strip("%")) / 100
#
#
#
#
#
#     ## TODO: and calculate
#     # 4. score up value w/ and w/o Charm or Heel
#
#     #### theoretical 550 note, 125 second song with 85% greats
#     notesActivation = (550 / skillNums['activation_value']) * skillNums['activation_percent'];
#
#     if skill['type'] == "Score Up":
#
#         if skillNums['activation_type'] == "perfects":
#             skill['su'] = notesActivation * .85 * skillNums['activation_value']
#         elif skillNums['activation_type'] == "time":
#             skill['su'] = (125 / skillNums['activation_num']) * skillNums['activation_percent'] * skillNums['activation_value']
#         else: # notes or combo string
#             skill['su'] = notesActivation * skillNums['activation_value']
#
#         skill['su_charm'] = skill['su'] * 2.5;
#         skill['su_heel'] = 0
#         skill['pl'] = 0
#         skill['pl_trick'] = 0
#         skill['pl_trick_idlz'] = 0
#         skill['hl'] = 0
#
#     elif skill['type'] == "Perfect Lock":
#         skill['su'] = 0
#         skill['su_charm'] = 0
#         skill['su_heel'] = 0
#         skill['pl'] = notesActivation * skillNums['activation_value']
#         skill['pl_trick'] = stat_to_mod(card,False) * .25 * notesActivation
#         skill['pl_trick_idlz'] = stat_to_mod(card,True) * .25 * notesActivation
#         skill['hl'] = 0
#
#     elif skill['type'] == "Healer":
#         skill['su'] = 0
#         skill['su_charm'] = 0
#         skill['pl'] = 0
#         skill['pl_trick'] = 0
#         skill['pl_trick_idlz'] = 0
#         skill['hl'] = notesActivation * skillNums['activation_value']
#         skill['su_heel'] = skill['hl'] * 270
#
#
#
#
#     # 5. perfect lock value
#
#     # 6. heal value
#     print(type(skill))
#     return skill
#


# calculate stat base cScore and oScore off of
# input: dict card, bool idlz, bool trick
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

    # # skill
    # ret['skill'] = skillDetails(ret)
    # #print(ret['skill'])
    # ret.pop('skill_details',None)

    return ret

def addFullName(card):
    ret = card
    ret['full_name'] = card['rarity']
    if card['is_promo']:
        ret['full_name'] = ret['full_name'] + " Promo"
    else:
        if card['translated_collection']:
            ret['full_name'] = ret['full_name'] + " " + card['translated_collection']
        else:
            ret['full_name'] = ret['full_name'] + " Unnamed"

    ret['full_name'] = ret['full_name'] + " " + card['name']

    return ret

def getJSON(url):
    print("getJSON(): currURL %s" % url)
    response = urllib.request.urlopen(url)
    data = response.read()
    data = "".join(map(chr, data))
    data = json.loads(data)
    # for (key,value) in data.items():
    #     print(key)
    return data



###########

# with open('javascripts/cards','r') as infile:
#     data = json.loads(infile.read())
#
# cards = []
#
#
# for card in data:
#     #print(card)
#     cards.append(cleanCard(card, keysNeeded))

# print(cards)
data = getJSON(baseURL)
nextURL = data['next']
cards = [];
for card in data['results']:
    cards.append(cleanCard(card,keysNeeded))
while nextURL:

    data = getJSON(nextURL)
    nextURL = data['next']
    for card in data['results']:
        cards.append(cleanCard(card,keysNeeded))

    print("len(cards) = %d" % len(cards))
    print("total cards = %d" % data['count'])

with open('javascripts/cards.js', 'w') as f:
    f.write("app.constant('CardData',\n")
    json.dump(cards,f,sort_keys=True)
    f.write("\n);")



# while (nextURL):
#     setData(data,nextURL, nextURL, cards);
