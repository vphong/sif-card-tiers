import urllib.request
import json
import os
import logging
import math

logging.basicConfig(level=logging.INFO)

# initalization
# original card endpoint
baseURL = "http://schoolido.lu/api/cards/?ordering=-id&is_special=False&page_size=100&rarity=SR%2CSSR%2CUR"

# keys to grab from json
keysNeeded = ["skill_details", "attribute", "japan_only", "is_promo", "event",
              "skill", "idol", "rarity", "idolized_maximum_statistics_cool",
              "idolized_maximum_statistics_smile", "idolized_maximum_statistics_pure",
              "non_idolized_maximum_statistics_pure", "non_idolized_maximum_statistics_cool",
              "non_idolized_maximum_statistics_smile", "translated_collection", "website_url",
              "round_card_idolized_image", "round_card_image", "id"]

# constants
aqours = ["Ohara Mari", "Kurosawa Dia", "Matsuura Kanan",
          "Takami Chika", "Sakurauchi Riko", "Watanabe You",
          "Kunikida Hanamaru", "Kurosawa Ruby", "Tsushima Yoshiko"]

muse = ["Toujou Nozomi", "Ayase Eli", "Yazawa Nico",
        "Kousaka Honoka", "Minami Kotori", "Sonoda Umi",
        "Hoshizora Rin", "Nishikino Maki", "Koizumi Hanayo"]

first = ["Hoshizora Rin", "Nishikino Maki", "Koizumi Hanayo",
         "Kunikida Hanamaru", "Kurosawa Ruby", "Tsushima Yoshiko"]

second = ["Takami Chika", "Sakurauchi Riko", "Watanabe You",
          "Kousaka Honoka", "Minami Kotori", "Sonoda Umi", ]

third = ["Toujou Nozomi", "Ayase Eli", "Yazawa Nico", "Ohara Mari",
         "Kurosawa Dia", "Matsuura Kanan", ]


# function: helper to determine if a string is a number
def isnumber(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

# function: extract a card's skill details and write averages to card
# input: dict card


def skillDetails(card):
    logging.info("skillDetails(): init")
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
    logging.info("skillDetails(): processing skill_details...")
    numCount = 0
    skillWords = card['skill_details'].split()
    for word in skillWords:

        # corner case: star note activated skills
        if "star" in card['skill_details']:
            # star notes per EX song * 85% perfects
            skillNums['activation_count'] = 65 * .85
            skillNums['activation_type'] = "star"
            if isnumber(word):
                # 3. skill activation value
                #   ("by ___ points/seconds/stamina")
                skillNums['activation_value'] = float(word)

            if "%" in word:
                # 4. skill activation percentage
                #   ("there is a __% chance")
                skillNums['activation_percent'] = float(word.strip("%")) / 100

        else:
            if isnumber(word) and numCount < 1:
                # 1. skill activation count
                #   ("for every ## notes/seconds/hit combo/perfects...")
                skillNums['activation_count'] = float(word)

                # 2. skill activation type
                #   ("for every ## notes/seconds/hit combo/perfects...")
                skillNums['activation_type'] = skillWords[
                    skillWords.index(word) + 1].strip(',')

                numCount = numCount + 1

            elif isnumber(word) and numCount < 2:
                # 3. skill activation value
                #   ("...by ___ points/seconds/stamina")

                skillNums['activation_value'] = float(word)

            if "%" in word:
                # 4. skill activation percentage
                #   ("...there is a ##% chance of...")
                skillNums['activation_percent'] = float(word.strip("%")) / 100

    card['skill'].update(skillNums)
    # static skill contribution calculation
    # theoretical 550 note, 125 second song with 85% greats and 65 star notes
    # timeActivation = (125 / skillNums['activation_count']) * skillNums[
    #     'activation_percent'] * skillNums['activation_value']
    #
    # card['skill']['su'] = 0
    # card['skill']['pl'] = 0
    # card['skill']['hl'] = 0
    # card['skill']['hl_heel'] = 0
    #
    # logging.info("skillDetails(): calculating skill contribution...")
    # if card['skill']['type'] == "Score Up":
    #
    #     if skillNums['activation_type'] == "perfects":
    #         card['skill']['su'] = (550 * .85 / skillNums['activation_count']) * skillNums[
    #             'activation_percent'] * skillNums['activation_value']
    #     elif skillNums['activation_type'] == "seconds":
    #         card['skill']['su'] = timeActivation
    #     else:  # notes or combo string
    #         card['skill']['su'] = (550 / skillNums['activation_count']) * \
    #             skillNums['activation_percent'] * skillNums['activation_value']
    #
    # elif card['skill']['type'] == "Perfect Lock":
    #
    #     if (skillNums['activation_type']) == "seconds":
    #         card['skill']['pl'] = timeActivation
    #     else:  # notes or combo
    #         card['skill']['pl'] = (550 / skillNums['activation_count']) * \
    #             skillNums['activation_percent'] * skillNums['activation_value']
    #
    # elif card['skill']['type'] == "Healer":
    #
    #     if (skillNums['activation_type']) == "seconds":
    #         card['skill']['hl'] = timeActivation
    #     else:  # notes or combo
    #         card['skill']['hl'] = (550 / skillNums['activation_count']) * \
    #             skillNums['activation_percent'] * skillNums['activation_value']
    #
    #     card['skill']['hl_heel'] = card['skill']['hl'] * 270

    logging.info("skillDetails(): done")


# grab on-attribute stat + bond bonus for c/o-score
# input: dict card, bool idlz
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
    elif (not idlz) and card['rarity'] == "SSR":
        stat += 375
    elif idlz and card['rarity'] == "SSR":
        stat += 750

    return stat

def rawScoringFormula(stat,kiss,ring,perfume,cross):
    return (stat + kiss*200 + perfume*450 + math.ceil(stat*ring*0.1) + math.ceil(stat*cross*0.16))

def score(card,scoreType):
    ## init
    unidlz_stat = stat_to_mod(card, False)
    idlz_stat = stat_to_mod(card, True)

    # sis
    kiss = 0 # +200
    perfume = 0 # 450
    ring = 0 # x0.10
    cross = 0 # x0.16

    # leader bonuses
    cLead = (1.0+.09+.03)*(1.0+.09+.03)
    oLead = (1.0+.09+.06)*(1.0+.09+.06)

    if card['is_promo']:

        if card['rarity'] == "SR":
            # 1 slot
            card['cScore'] = card['cScore_heel'] = card['cScore_heel_idlz'] = card['cScore_idlz'] = (idlz_stat + kiss)*cLead

            card['oScore'] = card['oScore_heel'] = card['oScore_heel_idlz'] = card['oScore_idlz'] = (idlz_stat + kiss)*oLead

        elif card['rarity'] == "UR":
            # 2 slots
            if idlz_stat < 4500:
                card['cScore'] = card['cScore_heel'] = card['cScore_heel_idlz'] = card['cScore_idlz'] = (idlz_stat + perfume)*cLead

                card['oScore'] = card['oScore_heel'] = card['oScore_heel_idlz'] =  card['oScore_idlz'] = (idlz_stat + perfume)*oLead

            else:
                card['cScore'] = card['cScore_heel'] = card['cScore_heel_idlz'] = card['cScore_idlz'] = (idlz_stat + math.ceil(idlz_stat*ring))*cLead

                card['oScore'] = card['oScore_heel'] = card['oScore_heel_idlz'] = card['oScore_idlz'] = (idlz_stat + math.ceil(idlz_stat*ring))*oLead


    else:
        if scoreType == "c":
            # unidlz: 2/3/4 slots
            # idlz: 3/3/4 slots
            if card['rarity'] == "SR":
                # unidlz: 2 slots
                if unidlz_stat < 4500:
                    kiss = 0
                    perfume = 1
                    ring = 0
                    cross = 0
                else:
                    kiss = 0
                    perfume = 0
                    ring = 1
                    cross = 0

                # idlz: 3 slots
                if idlz_stat < 4100:
                    kiss = 1
                    perfume = 1
                    ring = 0
                    cross = 0
                else:
                    kiss = 0
                    perfume = 0
                    ring = 0
                    cross = 1
                card['cScore'] = card['cScore_heel'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*cLead
                card['cScore_idlz'] = card['cScore_idlz_heel'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*cLead

            elif card['rarity'] == "SSR":
                # unidlz: 3 slots
                if unidlz_stat < 4100:
                    kiss = 1
                    perfume = 1
                    ring = 0
                    cross = 0
                else:
                    kiss = 0
                    perfume = 0
                    ring = 0
                    cross = 1

                # idlz: 3 slots
                if idlz_stat < 4100:
                    kiss = 1
                    perfume = 1
                    ring = 0
                    cross = 0
                else:
                    kiss = 0
                    perfume = 0
                    ring = 0
                    cross = 1
                card['cScore'] = card['cScore_heel'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*cLead
                card['cScore_idlz'] = card['cScore_idlz_heel'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*cLead

            else: # UR
                # unidlz: 4 slots
                if unidlz_stat < 2000:
                    kiss = 2
                    perfume = 1
                    ring = 0
                    cross = 0
                elif unidlz_stat >= 2000 and unidlz_stat < 4200:
                    kiss = 0
                    perfume = 1
                    ring = 1
                    cross = 0
                else:
                    kiss = 1
                    perfume = 0
                    ring = 0
                    cross = 1

                # idlz: 4 slots
                if idlz_stat < 2000:
                    kiss = 2
                    perfume = 1
                    ring = 0
                    cross = 0
                elif idlz_stat >= 2000 and idlz_stat < 4200:
                    kiss = 0
                    perfume = 1
                    ring = 1
                    cross = 0
                else:
                    kiss = 1
                    perfume = 0
                    ring = 0
                    cross = 1
                card['cScore'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*cLead
                card['cScore_idlz'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*cLead

                card['cScore_heel'] = rawScoringFormula(unidlz_stat,0,0,0,0)*cLead
                card['cScore_idlz_heel'] = rawScoringFormula(idlz_stat,0,0,0,0)*cLead


        elif scoreType == "o":
            # unidlz: 2/3/4 slots
            # idlz: 4/4/5 slots

            if card['rarity'] == "SR":
                # unidlz: 2 slots
                if unidlz_stat < 4500:
                    kiss = 0
                    perfume = 1
                    ring = 0
                    cross = 0
                else:
                    kiss = 0
                    perfume = 0
                    ring = 1
                    cross = 0

                # idlz: 4 slots
                if idlz_stat < 2000:
                    kiss = 2
                    perfume = 1
                    ring = 0
                    cross = 0
                elif idlz_stat >= 2000 and idlz_stat < 4200:
                    kiss = 0
                    perfume = 1
                    ring = 1
                    cross = 0
                else:
                    kiss = 1
                    perfume = 0
                    ring = 0
                    cross = 1
                card['oScore'] = card['oScore_heel'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*oLead
                card['oScore_idlz'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*oLead

                card['oScore_idlz_heel'] = rawScoringFormula(idlz_stat,0,0,0,0)*oLead

            elif card['rarity'] == "SSR":
                # unidlz: 3 slots
                if unidlz_stat < 4100:
                    kiss = 1
                    perfume = 1
                    ring = 0
                    cross = 0
                else:
                    kiss = 0
                    perfume = 0
                    ring = 0
                    cross = 1

                # idlz: 4 slots
                if idlz_stat < 2000:
                    kiss = 2
                    perfume = 1
                    ring = 0
                    cross = 0
                elif idlz_stat >= 2000 and idlz_stat < 4200:
                    kiss = 0
                    perfume = 1
                    ring = 1
                    cross = 0
                else:
                    kiss = 1
                    perfume = 0
                    ring = 0
                    cross = 1
                card['oScore'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*oLead
                card['oScore_idlz'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*oLead
                card['oScore'] = card['oScore_heel'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*oLead
                card['oScore_idlz'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*oLead

                card['oScore_idlz_heel'] = rawScoringFormula(idlz_stat,0,0,0,0)*oLead

            else: # UR
                # unidlz: 4 slots
                if unidlz_stat < 2000:
                    kiss = 2
                    perfume = 1
                    ring = 0
                    cross = 0
                elif unidlz_stat >= 2000 and unidlz_stat < 4200:
                    kiss = 0
                    perfume = 1
                    ring = 1
                    cross = 0
                else:
                    kiss = 1
                    perfume = 0
                    ring = 0
                    cross = 1

                # idlz: 5 slots
                if idlz_stat < 3300:
                    kiss = 1
                    perfume = 1
                    ring = 1
                    cross = 0
                elif idlz_stat >= 3300 and idlz_stat < 4500:
                    kiss = 0
                    perfume = 1
                    ring = 0
                    cross = 1
                else:
                    kiss = 0
                    perfume = 0
                    ring = 1
                    cross = 1
                card['oScore'] = rawScoringFormula(unidlz_stat,kiss,perfume,ring,cross)*oLead
                card['oScore_idlz'] = rawScoringFormula(idlz_stat,kiss,perfume,ring,cross)*oLead

                card['oScore_heel'] = rawScoringFormula(unidlz_stat,0,0,0,0)*cLead
                card['oScore_idlz_heel'] = rawScoringFormula(idlz_stat,1,0,0,0)*cLead


def cleanCard(d, keys):
    ret = {key: d[key] for key in keys}
    # origin: set premium bool
    if ret['event']:
        ret['event'] = True
    if not ret['event'] and not ret['is_promo']:
        ret['premium'] = True
    else:
        ret['premium'] = False

    # idol mini object cleaning
    ret['name'] = ret['idol']['name']
    ret['sub_unit'] = ret['idol']['sub_unit']

    # main unit
    if ret['name'] in aqours:
        ret['main_unit'] = "Aqours"
    elif ret['name'] in muse:
        ret['main_unit'] = "Muse"
    else:
        ret['main_unit'] = "error"

    # year
    if ret['name'] in first:
        ret['year'] = "first"
    elif ret['name'] in second:
        ret['year'] = "second"
    elif ret['name'] in third:
        ret['year'] = "third"

    ret.pop('idol', None)

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

    # handle unicode error output for "é"
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

    # stats/scores
    skillDetails(ret)
    score(ret,"c")
    score(ret,"o")

    # load links over https
    # ret['website_url'] = "https" + ret['website_url'][4:]
    # ret['round_card_image'] = "https" + repr(ret['round_card_image'])[5:]
    # ret['round_card_idolized_image'] = "https" + \
    #     repr(ret['round_card_idolized_image'])[5:]

    return ret


# function: get card JSON from schoolido.lu
def getJSON(url):
    logging.info("getJSON(): currURL %s" % url)
    response = urllib.request.urlopen(url)
    data = response.read()
    data = "".join(map(chr, data))
    data = json.loads(data)
    return data


###########

# function: get raw card data from schoolido.lu API
def getRawCards():
    # initalization
    logging.info("getRawCards(): begin")
    data = getJSON(baseURL)
    nextURL = data['next']
    cards = data['results']

    # iterate through API's paginated data
    while nextURL:
        data = getJSON(nextURL)
        nextURL = data['next']
        for card in data['results']:
            cards.append(card)

    # write raw data to file
    with open('js/cards.json', 'w') as f:
        logging.info("getRawCards(): writing to file...")
        json.dump(cards, f, sort_keys=True)

    logging.info("getRawCards(): done")


# function: grab info needed for use in web app
def processCards():
    logging.info("processCards: begin")
    # initalization
    logging.info("processCards(): loading card data...")
    with open('js/cards.json', 'r') as infile:
        data = json.loads(infile.read())

    cards = []
    logging.info("processCards(): cleaning cards...")
    for card in data:
        card = cleanCard(card, keysNeeded)
        # addFullName(card)
        cards.append(card)
    logging.info(cards[0])
    # write to file with use for angular
    logging.info("processCards(): done cleaning. writing to file...")
    with open('js/cards.js', 'w') as f:
        f.write("app.constant('CardData',\n")
        json.dump(cards, f, indent=2, sort_keys=True)
        f.write("\n);")

    logging.info("processCards(): done")

# getRawCards()
processCards()
