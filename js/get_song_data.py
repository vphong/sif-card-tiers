import urllib.request
import json
import os
import logging

logging.basicConfig(level=logging.INFO)

# initalization
# original songs endpoint
baseURL = "http://schoolido.lu/api/songs/"

keysNeeded = ["name", "romaji_name", "translated_name", "attribute", "time", "main_unit",
              "easy_notes", "normal_notes", "hard_notes", "expert_notes", "master_notes"]

songs = []

#################

def cleanSong(song, keys):
    ret = {key: song[key] for key in keys};
    return ret

#################


def getJSON(url):
    logging.info("getJSON(): currURL %s" % url)
    response = urllib.request.urlopen(url)
    data = response.read()
    data = "".join(map(chr, data))
    data = json.loads(data)
    return data

# function: get raw card data from schoolido.lu API
def getRawSongs():
    # initalization
    logging.info("getSongs(): begin")
    data = getJSON(baseURL)
    nextURL = data['next']
    songs = data['results']

    # iterate through API's paginated data
    while nextURL:
        data = getJSON(nextURL)
        nextURL = data['next']
        for song in data['results']:
            # logging.info(song)
            songs.append(song)

    # logging.info(songs)
    # write raw data to file
    with open('js/songs.json', 'w') as f:
        logging.info("getRawSongs(): writing to file...")
        json.dump(songs, f, indent=2, sort_keys=True)

    logging.info("getRawSongs(): done")


# function: grab info needed for use in web app
def processSongs():
    logging.info("processSongs: begin")
    # initalization
    logging.info("processSongs(): loading card data...")
    with open('js/songs.json', 'r') as infile:
        data = json.loads(infile.read())

    songs = []
    logging.info("processSongs(): cleaning songs...")
    for song in data:
        song = cleanSong(song, keysNeeded)
        # addFullName(card)
        songs.append(song)

    # write to file with use for angular
    logging.info("processSongs(): done cleaning. writing to file...")
    with open('js/songs.js', 'w') as f:
        f.write("app.constant('SongData',\n")
        json.dump(songs, f, indent=2, sort_keys=True)
        f.write("\n);")

    logging.info("processSongs(): done")

# getRawSongs()
processSongs()
