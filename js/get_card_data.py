# coding=utf-8

import urllib.request
import json
import datetime
import logging
import math
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)

# initalization
# original card endpoint
sitURL = "http://schoolido.lu/api/cards/?ordering=-id&is_special=False&page_size=10&rarity=SR%2CSSR%2CUR"
krrURL = "https://sif.kirara.ca/card/"

# keys to grab from json
keysNeeded = ["skill_details", "attribute", "japan_only", "is_promo", "event",
              "skill", "idol", "rarity", "idolized_maximum_statistics_cool",
              "idolized_maximum_statistics_smile", "idolized_maximum_statistics_pure",
              "non_idolized_maximum_statistics_pure", "non_idolized_maximum_statistics_cool",
              "non_idolized_maximum_statistics_smile", "translated_collection", "website_url",
              "round_card_idolized_image", "round_card_image", "id", "release_date"]

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

# function: extract a card's skill level details from sif.kirara.ca
# input: card id #
def getSkillLevel(id):
    logging.info("getSkillLevel():", repr(id))
    response = urllib.request.urlopen(krrURL + repr(id))
    soup = BeautifulSoup(response.read(), "html.parser")
    script_contents = str(soup.find(id="iv").string)
    card_info_str = script_contents[script_contents.find("{"):script_contents.find("}")] + "}}"
    card_info = json.loads(card_info_str)
    skill_levels = {}
    for lvl, info in enumerate(card_info[repr(id)]['skill']):
        skill_levels[lvl+1] = info
    return skill_levels


# function: extract a card's skill details and write averages to card
# input: dict card
def skillDetails(card):
    # logging.info("skillDetails(): init for %s", card['full_name'])
    # initalization
    skillNums = {}
    skillType = card['skill']
    card['skill'] = {}
    card['skill']['category'] = skillType

    # API bug: Fairyland Umi has incorrect skill value in API database
    if card['full_name'] == "SR Land of Fairies Sonoda Umi":
        card['skill_details'] = "For every 25 notes, there is a 35% chance stamina gets recovered by 3."

    # promo skills
    if "Charm" in card['skill']['category']:
        card['skill']['category'] = "Score Up"
    elif "Yell" in card['skill']['category']:
        card['skill']['category'] = "Healer"
    elif "Trick" in card['skill']['category']:
        card['skill']['category'] = "Perfect Lock"

    # extract raw skill data from skill_details string
    # logging.info("skillDetails(): processing skill_details...")
    numCount = 0
    skillWords = card['skill_details'].split()
    for word in skillWords:

        # corner case: star note activated skills
        if "star" in card['skill_details']:
            # star notes per EX song * 85% perfects
            skillNums['interval'] = 65 * .85
            skillNums['type'] = "star"
            if isnumber(word):
                # 3. skill activation value
                #   ("by ___ points/seconds/stamina")
                skillNums['amount'] = float(word)

            if "%" in word:
                # 4. skill activation percentage
                #   ("there is a __% chance")
                skillNums['percent'] = float(word.strip("%")) / 100

        else:
            if isnumber(word) and numCount < 1:
                # 1. skill activation count
                #   ("for every ## notes/seconds/hit combo/perfects...")
                skillNums['interval'] = float(word)

                # 2. skill activation type
                #   ("for every ## notes/seconds/hit combo/perfects...")
                skillNums['type'] = skillWords[
                    skillWords.index(word) + 1].strip(',')
                if skillNums['type'] == 'hit':
                    skillNums['type'] = 'combo'

                numCount = numCount + 1

    card['skill'].update(skillNums)
    card['skill'].update(getSkillLevel(card['id']))
    card.pop('skill_details', None)
    #     card['skill']['hl_heel'] = card['skill']['hl'] * 270

    # logging.info("skillDetails(): done")



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

    # rename translated_collection to be more descriptive/accurate
    # v2 sets: job, animal, pool
    # parse release_date
    if ret['release_date']:
        release_date = datetime.datetime.strptime(
            ret['release_date'], "%Y-%m-%d")
        if ret['translated_collection']:
            if "Job" in ret['translated_collection'] and release_date >= datetime.datetime(2015, 3, 31):
                ret['translated_collection'] = "Job v2"

            if "Animal" in ret['translated_collection'] and release_date >= datetime.datetime(2015, 9, 30):
                ret['translated_collection'] = "Animal v2"

            if "Pool" in ret['translated_collection'] and release_date >= datetime.datetime(2016, 8, 8):
                ret['translated_collection'] = "Pool v2"

    # inaccurately named
    # Taisho Romance -> Taisho Roman
    if ret['translated_collection'] == "Taisho Romance":
        ret['translated_collection'] = "Taisho Roman"

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

    # # handle unicode error output for "e'"
    # if ret['translated_collection'] and "Maid" in ret['translated_collection']:
    #     ret['translated_collection'] = "Café Maid"

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
    # ret['cScore'] = ret['oScore'] = {'base': 0, 'idlz': 0, 'heel': 0, 'idlz_heel': 0}
    # ret['cScore'] = score(ret,"c")
    # ret['oScore'] = score(ret,"o")

    # grab relevant stat only
    ret['stat'] = {}
    if ret['attribute'] == 'Smile':
        ret['stat']['base'] = ret['non_idolized_maximum_statistics_smile']
        ret['stat']['idlz'] = ret['idolized_maximum_statistics_smile']
    elif ret['attribute'] == 'Pure':
        ret['stat']['base'] = ret['non_idolized_maximum_statistics_pure']
        ret['stat']['idlz'] = ret['idolized_maximum_statistics_pure']
    elif ret['attribute'] == 'Cool':
        ret['stat']['base'] = ret['non_idolized_maximum_statistics_cool']
        ret['stat']['idlz'] = ret['idolized_maximum_statistics_cool']

    ret['stat']['display'] = ret['stat']['base']

    ret.pop('non_idolized_maximum_statistics_cool', None)
    ret.pop('non_idolized_maximum_statistics_pure', None)
    ret.pop('non_idolized_maximum_statistics_smile', None)
    ret.pop('idolized_maximum_statistics_cool', None)
    ret.pop('idolized_maximum_statistics_pure', None)
    ret.pop('idolized_maximum_statistics_smile', None)

    return ret



###########

# function: get card JSON from schoolido.lu
def getJSON(url):
    logging.info("getJSON(): currURL %s" % url)
    response = urllib.request.urlopen(url)
    data = response.read()
    data = "".join(map(chr, data))
    data = json.loads(data)
    return data

def mostRecentSITCard():
    mostRecentSIT= getJSON("http://schoolido.lu/api/cards/?ordering=-id&page=1&page_size=1")
    mostRecentSIT = mostRecentSIT['results'][0]
    return mostRecentSIT['id']

def mostRecentLocalCard(cards):
    mostRecentId = 0
    for card in cards:
        if card['id'] > mostRecentId:
            mostRecentId = card['id']

###########

# function: get raw card data from schoolido.lu API
def getRawCards():
    # initalization
    logging.info("getRawCards(): begin")
    data = getJSON(sitURL)
    nextURL = data['next']
    cards = data['results']

    # iterate through API's paginated data
    while nextURL:
        data = getJSON(nextURL)
        nextURL = data['next']
        for card in data['results']:
            cards.append(card)

    # write raw data to file
    with open('cards.json', 'w', encoding='utf-8') as f:
        logging.info("getRawCards(): writing to file...")
        json.dump(cards, f, indent=2, sort_keys=True)

    logging.info("getRawCards(): done")


# function: grab info needed for use in web app
def processCards():
    logging.info("processCards: begin")
    # initalization
    logging.info("processCards(): loading card data...")
    with open('cards.json', 'r', encoding='utf-8') as infile:
        data = json.loads(infile.read())

    cards = []
    logging.info("processCards(): cleaning cards...")
    for card in data:
        card = cleanCard(card, keysNeeded)
        # addFullName(card)
        cards.append(card)
    # logging.info(cards[0]['cScore'])
    # logging.info(cards[0]['oScore'])
    # write to file with use for angular
    logging.info("processCards(): done cleaning. writing to file...")
    with open('cards.js', 'w', encoding='utf-8') as f:
        f.write("app.constant('CardData',\n")
        json.dump(cards, f, indent=2)
        f.write("\n);")

    logging.info("processCards(): done")


# getRawCards()
# processCards()
