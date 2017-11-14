# coding=utf-8

import urllib.request
import json
import datetime
import logging
import pprint
from bs4 import BeautifulSoup

pp = pprint.PrettyPrinter(indent=2)

logging.basicConfig(level=logging.INFO)

# initalization
# original card endpoint
sitURL = "http://schoolido.lu/api/cards/?ordering=-id&is_special=False&page_size=10&rarity=SR%2CSSR%2CUR"
sitIDs = "http://schoolido.lu/api/cardids/?&is_special=False&rarity=SR%2CSSR%2CUR"
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
def getSkillLevels(id):
    logging.info("getSkillLevels():" + repr(id))
    response = urllib.request.urlopen(krrURL + repr(id))
    soup = BeautifulSoup(response.read(), "lxml")
    script_contents = str(soup.find(id="iv").string)
    card_info_str = script_contents[script_contents.find("{"):script_contents.find("}")] + "}}"
    card_info = json.loads(card_info_str)
    skill_levels = {"levels": {}}
    for lvl, info in enumerate(card_info[repr(id)]['skill']):
        percent = info[0]/100.0
        if info[1] != 0:
            amount = info[1]
        else:
            amount = info[2]
        skill_levels['levels'][lvl+1] = {'percent': percent, 'amount': amount}
    # logging.info(skill_levels)
    return skill_levels
# getSkillLevels(1289)
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
    card.pop('skill_details', None)



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
    if ret['translated_collection'] and "Maid" in ret['translated_collection']:
        ret['translated_collection'] = "Cafe Maid"

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
    ret['skill']['lvl'] = 1
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


    if ret['rarity'] == "UR":
        ret['stat']['base'] += 500
        ret['stat']['idlz'] += 1000
    elif ret['rarity'] == "SSR":
        ret['stat']['base'] += 375
        ret['stat']['idlz'] += 750
    elif ret['rarity'] == "SR":
        ret['stat']['base'] += 250
        ret['stat']['idlz'] += 500

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


def difference(cards):
    # extract ids from cards
    # logging.info(cards.keys())
    ids = [int(i) for i in cards.keys()]

    # compare to sit
    sit = getJSON(sitIDs)

    diff = set(sit) - set(ids)
    worldwide_poster = set(range(2001, 2010))
    diff = diff - worldwide_poster

    logging.info("difference():")
    logging.info(diff)
    return diff

###########
def populateCardSkills():
    logging.info("populateCardSkills: begin")
    response = urllib.request.urlopen(sitIDs)
    ids = json.loads(response.read())

    logging.info("populateCardSkills: getting")
    logging.info(ids)

    # print(firstHalf)
    skills = []
    for i in ids:
        if i not in range(2001,2010):
            skill = {}
            skill[repr(i)] = {'id': i}
            try:
                skill[repr(i)].update(getSkillLevels(i))
                skills.update(skill)
            except:
                break

    logging.info("populateCardSkills: writing to skills.json ")
    with open("skills.json", 'w') as f:
        json.dump(skills, f, sort_keys=True)

# populateCardSkills()
def updateSkillLevels():
    skills = []
    with open("skills.json", 'r') as f:
        skills = json.loads(f.read())

    diff = difference(skills)

    if diff:
        for i in diff:
            skill = {}
            skill[repr(i)] = {'id': i}

            try:
                skill[repr(i)].update(getSkillLevels(i))
                skills.update(skill)
            except Exception as e:
                print(e)
                print(skill)
                break

        logging.info("updateSkillLevels: appending to skills.json ")
        with open("skills.json", 'w') as f:
            json.dump(skills, f, sort_keys=True, indent=2)
    else:
        logging.info("updateSkillLevels: up to date")



# function: get raw card data from schoolido.lu API
def getRawCards():
    # initalization
    logging.info("getRawCards(): begin")
    data = getJSON(sitURL)
    nextURL = data['next']
    cardsList = data['results']

    # iterate through API's paginated data
    while nextURL:
        data = getJSON(nextURL)
        nextURL = data['next']
        for card in data['results']:
            if card['id'] not in range(2001,2010):
                cardsList.append(card)

    cards = temp = {}
    for card in cardsList:
        temp[repr(card['id'])] = card
        cards.update(temp)

    # write raw data to file
    with open('cards.json', 'w', encoding='utf-8') as f:
        logging.info("getRawCards(): writing to file...")
        json.dump(cards, f, indent=2, sort_keys=True)

    logging.info("getRawCards(): done")
# getRawCards()
# function: only make http requests to SIT for new cards
def updateCardsJSON():
    logging.info("updateCardsJSON(): begin")
    with open('cards.json', 'r', encoding='utf-8') as f:
        old = json.loads(f.read())

    diff = difference(old)

    if diff:
        logging.info("updateCardsJSON(): getting new card info from schoolido.lu")

        diffStr = ",".join([repr(i) for i in diff])
        newData = getJSON(sitURL+"&ids=" + diffStr)

        new = temp = {}
        for card in newData['results']:
            temp[repr(card['id'])] = card
            new.update(temp)

        logging.info("updateCardsJSON(): combining new & old cards")
        old.update(new)

        logging.info("updateCardsJSON(): writing to cards.json")
        with open('cards.json', 'w', encoding='utf-8') as f:
            json.dump(old, f, indent=2, sort_keys=True)

    else:
        logging.info("updateCardsJSON(): up to date")


def consolidate():
    cardData = {}
    logging.info("consolidate(): reading cards")
    with open("cards.json", 'r') as c:
        cardData = json.loads(c.read())

    logging.info("consolidate(): reading skills")
    with open("skills.json", 'r') as s:
        skills = json.loads(s.read())
        
    logging.info("consolidate(): cleaning cards")
    data = temp = {}
    for card in cardData.values():
        card = cleanCard(card, keysNeeded)
        # search for skill in skills
        skill = skills[repr(card['id'])]
        levels = {'levels': skill['levels']}
        card['skill'].update(levels)
        # update card['skill'] w/ levels
        temp[repr(card['id'])] = card
        data.update(temp)


    logging.info("consolidate(): writing to data.json")
    with open('data.json', 'w') as f:
        json.dump(data, f, indent=2, sort_keys=True)


# updateSkillLevels()
# updateCardsJSON()
consolidate()
