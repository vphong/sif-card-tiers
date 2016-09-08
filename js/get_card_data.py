import urllib.request
import json
import os
import logging

logging.basicConfig(level=logging.INFO)

## initalization
baseURL = "http://schoolido.lu/api/cards/?ordering=-id&is_special=False&page_size=100&rarity=SR%2CSSR%2CUR"

keysNeeded = ["skill_details", "attribute", "japan_only", "is_promo", "event",
              "skill", "idol", "rarity", "idolized_maximum_statistics_cool",
              "idolized_maximum_statistics_smile", "idolized_maximum_statistics_pure",
              "non_idolized_maximum_statistics_pure", "non_idolized_maximum_statistics_cool",
              "non_idolized_maximum_statistics_smile", "translated_collection", "website_url",
              "round_card_idolized_image", "round_card_image", "id"]

aqours = ["Ohara Mari", "Kurosawa Dia", "Matsuura Kanan",
          "Takami Chika", "Sakurauchi Riko", "Watanabe You",
          "Kunikida Hanamaru", "Kurosawa Ruby", "Tsushima Yoshiko"]

muse = ["Toujou Nozomi", "Ayase Eli", "Yazawa Nico",
        "Kousaka Honoka", "Minami Kotori", "Sonoda Umi",
        "Hoshizora Rin", "Nishikino Maki", "Koizumi Hanayo"]

# function: helper to determine if a string is a number
def isnumber(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

# function: extract a card's skill details and write averages to card
def skillDetails(card):
    logging.info("skillDetails(): initalization")
    # initalization
    skill = {}
    skillNums = {}
    skill['type'] = card['skill']
    skillType = card['skill']
    card['skill'] = {}
    card['skill']['type'] = skillType

    # API bug: Fairyland Umi has incorrect skill value in API database
    if card['full_name'] == "SR Land of Fairies Sonoda Umi":
        card['skill_details'] = "For every 25 notes, there is a 35% chance stamina gets recovered by 3."

    # promo skills
    if "Charm" in card['skill']['type']:
        card['skill']['type'] = "Score Up"
    elif "Yell" in card['skill']['type']:
        card['skill']['type'] = "Healer"
    elif "Trick" in card['skill']['type']:
        card['skill']['type'] = "Perfect Lock"


    # extract raw skill data from skill_details string
    logging.info("skillDetails(): Processing skill_details...")
    numCount = 0
    skillWords = card['skill_details'].split()
    for word in skillWords:

        if "star" in card['skill_details']:
            # star notes per EX song * 85% perfects
            skillNums['activation_count'] = 65 * .85
            skillNums['activation_type'] = "star"
            if isnumber(word):
                # 3. skill activation value
                skillNums['activation_value'] = float(word)

            if "%" in word:
                # 4. skill activation percentage
                skillNums['activation_percent'] = float(word.strip("%")) / 100

        # elif "Trick" in card['skill']['type']:
            # print(card['skill_details'])
        else:
            if isnumber(word) and numCount < 1:
                # 1. skill activation count
                skillNums['activation_count'] = float(word)

                # 2. skill activation type
                skillNums['activation_type'] = skillWords[
                    skillWords.index(word) + 1].strip(',')

                numCount = numCount + 1

            elif isnumber(word) and numCount < 2:
                # 3. skill activation value
                skillNums['activation_value'] = float(word)

            if "%" in word:
                # 4. skill activation percentage
                skillNums['activation_percent'] = float(word.strip("%")) / 100

    # theoretical 550 note, 125 second song with 85% greats and 65 star notes
    timeActivation = (125 / skillNums['activation_count']) * skillNums[
        'activation_percent'] * skillNums['activation_value']

    card['skill']['su'] = 0
    card['skill']['su_sis'] = 0
    card['skill']['pl'] = 0
    card['skill']['pl_sis'] = 0
    card['skill']['pl_sis_idlz'] = 0
    card['skill']['hl'] = 0

    logging.info("skillDetails(): Calculating average skill contribution...")
    if card['skill']['type'] == "Score Up":

        if skillNums['activation_type'] == "perfects":
            card['skill']['su'] = (550 * .85 / skillNums['activation_count']) * skillNums[
                'activation_percent'] * skillNums['activation_value']
        elif skillNums['activation_type'] == "seconds":
            card['skill']['su'] = timeActivation
        else:  # notes or combo string
            card['skill']['su'] = (550 / skillNums['activation_count']) * \
                skillNums['activation_percent'] * skillNums['activation_value']

        card['skill']['su_sis'] = card['skill']['su'] * 2.5

    elif card['skill']['type'] == "Perfect Lock":

        if (skillNums['activation_type']) == "seconds":
            card['skill']['pl'] = timeActivation
            card['skill']['pl_sis'] = stat_to_mod(
                card, False) * .25 * (125 / skillNums['activation_count']) * skillNums['activation_percent']
            card['skill']['pl_sis_idlz'] = stat_to_mod(
                card, True) * .25 * (125 / skillNums['activation_count']) * skillNums['activation_percent']
        else:  # notes or combo
            card['skill']['pl'] = (550 / skillNums['activation_count']) * \
                skillNums['activation_percent'] * skillNums['activation_value']
            card['skill']['pl_sis'] = stat_to_mod(
                card, False) * .25 * (550 / skillNums['activation_count']) * skillNums['activation_percent']
            card['skill']['pl_sis_idlz'] = stat_to_mod(
                card, True) * .25 * (550 / skillNums['activation_count']) * skillNums['activation_percent']

    elif card['skill']['type'] == "Healer":

        if (skillNums['activation_type']) == "seconds":
            card['skill']['hl'] = timeActivation
        else:  # notes or combo
            card['skill']['hl'] = (550 / skillNums['activation_count']) * \
                skillNums['activation_percent'] * skillNums['activation_value']

        card['skill']['su_sis'] = card['skill']['hl'] * 270

    logging.info("skillDetails(): done")


# calculate stat base cScore and oScore off of
# input: dict card, bool idlz, bool trick
def stat_to_mod(card, idlz):

    if card['attribute'] == "Pure" and idlz:
        stat = card['idolized_maximum_statistics_pure']
    elif (not idlz) and card['attribute'] == "Pure":
        stat = card['non_idolized_maximum_statistics_pure']
    elif idlz and card['attribute'] == "Smile":
        stat = card['idolized_maximum_statistics_smile']
    elif (not idlz) and card['attribute'] == "Smile":
        stat = card['non_idolized_maximum_statistics_smile']
    elif idlz and card['attribute'] == "Cool":
        stat = card['idolized_maximum_statistics_cool']
    elif (not idlz) and card['attribute'] == "Cool":
        stat = card['non_idolized_maximum_statistics_cool']

    if idlz and card['rarity'] == "UR":
        stat += 1000
    elif (not idlz) and (card['rarity'] == "UR" or idlz and card['rarity'] == "SR"):
        stat += 500
    elif (not idlz) and card['rarity'] == "SR":
        stat += 250

    return stat


def cScore(stat):
    # logging.info("cScore(): Calculating cScore..")
    return stat + (stat * (.09 + .03)) * 2


def oScore(stat):
    # logging.info("oScore(): Calculating oScore..")
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

    # idol mini object cleaning
    ret['name'] = ret['idol']['name']
    ret['sub_unit'] = ret['idol']['sub_unit']
    ret['year'] = ret['idol']['year']

    if ret['name'] in aqours:
        ret['main_unit'] = "Aqours"
    elif ret['name'] in muse:
        ret['main_unit'] = "Muse"
    else:
        ret['main_unit'] = "error"

    ret.pop('idol', None)

    # stats/scores
    ret['cScore'] = cScore(stat_to_mod(ret, False))
    ret['cScore_idlz'] = cScore(stat_to_mod(ret, True))
    ret['oScore'] = oScore(stat_to_mod(ret, False))
    ret['oScore_idlz'] = oScore(stat_to_mod(ret, True))

    # full name
    ret['full_name'] = ret['rarity']
    if ret['is_promo']:
        ret['non_idolized_maximum_statistics_smile'] = ret[
            'idolized_maximum_statistics_smile']
        ret['non_idolized_maximum_statistics_pure'] = ret[
            'idolized_maximum_statistics_pure']
        ret['non_idolized_maximum_statistics_cool'] = ret[
            'idolized_maximum_statistics_cool']

        ret['full_name'] = ret['full_name'] + " Promo"
    else:
        if ret['translated_collection']:
            ret['full_name'] = ret['full_name'] + \
                " " + ret['translated_collection']
        else:
            ret['full_name'] = ret['full_name'] + " Unnamed"

    ret['full_name'] = ret['full_name'] + " " + ret['name']

    # # skill
    # ret['skill'] = skillDetails(ret)
    # #print(ret['skill'])
    # ret.pop('skill_details',None)

    if ret['translated_collection'] and "Maid" in ret['translated_collection']:
        ret['translated_collection'] = "Café Maid"

    ret['full_name'] = ret['rarity']
    if ret['is_promo']:
        ret['non_idolized_maximum_statistics_smile'] = ret[
            'idolized_maximum_statistics_smile']
        ret['non_idolized_maximum_statistics_pure'] = ret[
            'idolized_maximum_statistics_pure']
        ret['non_idolized_maximum_statistics_cool'] = ret[
            'idolized_maximum_statistics_cool']

        ret['full_name'] = ret['full_name'] + " Promo"
    else:
        if ret['translated_collection']:
            ret['full_name'] = ret['full_name'] + \
                " " + ret['translated_collection']
        else:
            ret['full_name'] = ret['full_name'] + " Unnamed"

    ret['full_name'] = ret['full_name'] + " " + ret['name']

    return ret


def getJSON(url):
    logging.info("getJSON(): currURL %s" % url)
    response = urllib.request.urlopen(url)
    data = response.read()
    data = "".join(map(chr, data))
    data = json.loads(data)
    # for (key,value) in data.items():
    #     print(key)
    return data


###########

# function: get raw card data from schoolido.lu API
def getRawCards():
    ## initalization
    logging.info("getRawCards(): begin")
    data = getJSON(baseURL)
    nextURL = data['next']
    cards = data['results']

    ## iterate through API's paginated data
    while nextURL:
        data = getJSON(nextURL)
        nextURL = data['next']
        for card in data['results']:
            cards.append(card)


    ## write raw data to file
    with open('js/cardsJSON.js', 'w') as f:
        print("getRawCards(): Writing to js/cardsJSON.js...")
        json.dump(cards, f, sort_keys=True)

    logging.info("getRawCards(): done")


# function: grab info needed for use in web app
def processCards():
    logging.info("processCards: begin")
    # initalization
    logging.info("processCards(): loading card data...")
    with open('js/cardsJSON.js', 'r') as infile:
        data = json.loads(infile.read())

    cards = []
    logging.info("processCards(): cleaning cards...")
    for card in data:
        card = cleanCard(card,keysNeeded)
        # addFullName(card)
        skillDetails(card)
        cards.append(card)

    # write to file with use for angular
    logging.info("processCards(): done cleaning. writing to file...")
    with open('js/cards.js', 'w') as f:
        f.write("app.constant('CardData',\n")
        json.dump(cards, f, sort_keys=True)
        f.write("\n);")

    logging.info("processCards(): done")

processCards()
