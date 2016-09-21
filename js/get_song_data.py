import urllib.request
import json
import os
import logging
import io

logging.basicConfig(level=logging.INFO)

# initalization
# original songs endpoint
baseURL = "http://schoolido.lu/api/songs/"

keysNeeded = ["name", "romaji_name", "translated_name", "attribute", "time", "main_unit",
              "easy_notes", "normal_notes", "hard_notes", "expert_notes", "master_notes"]


songs = []

songTitleKeys = ["name", "romaji_name", "translated_name"]


def byteify(input):
    if isinstance(input, dict):
        return {byteify(key): byteify(value)
                for key, value in input.items()}
    elif isinstance(input, list):
        return [byteify(element) for element in input]
    elif isinstance(input, str):
        return input.encode('utf-8')
    else:
        return input

#################


def cleanSong(song, keys):
    # logging.info(song)
    ret = {key: song[key] for key in keys}
    # ret['name'] = ret['name'].encode('utf-8').decode('utf-8')
    # logging.info(ret['name'])
    # logging.info(type(ret['name']))
    return ret


def getAllSongTitles(songs):
    logging.info("getAllSongTitles(): begin")
    songTitles = []
    for song in songs:
        # grab all titles if their key returns a value
        songTitle = {key: song[key] for key in songTitleKeys if song[key] is not None}

        # append pure song titles to list
        for (key,title) in songTitle.items():
            title = title.encode("utf-8").decode("utf-8")
            songTitles.append(title)

    logging.info("getAllSongTitles(): done ")
    return songTitles

# function: convert list of dicts of songs to string
def listOfSongsToString(songs):
    string = "["

    for songDict in songs:
        # convert individual song into string
        songStr = str(songDict)
        logging.info(songStr)

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

    logging.info(songs)
    # write raw data to file
    with open('js/songs.json', 'w') as f:
        logging.info("getRawSongs(): writing to file...")
        json.dump(songs, f, indent=2, sort_keys=True)#, ensure_ascii=False)

    logging.info("getRawSongs(): done")


# function: grab info needed for use in web app
def processSongs():
    logging.info("processSongs(): begin")
    # initalization
    logging.info("processSongs(): loading card data...")
    with open('js/songs.json', 'r') as infile:
        # logging.info(infile.read())
        data = json.loads(infile.read())

    # logging.info(type(data))
    songs = []
    logging.info("processSongs(): cleaning songs...")
    for song in data:
        logging.info(song['name'])
        song = cleanSong(song, keysNeeded)
        # addFullName(card)
        songs.append(song)

    ## turn list of dicts of songs into string of songs for json.dump

    songTitles = getAllSongTitles(songs)

    # logging.info(songTitles)

    # write to file with use for angular
    logging.info("processSongs(): writing to file...")
    with open('js/songs.js', 'w') as f:
        f.write("app.constant('SongData',\n")
        json.dump(songs, f, indent=2, sort_keys=True)#,ensure_ascii=False).encode('utf-8')
        f.write("\n\n);")
        f.write("app.constant('SongTitles',\n")
        json.dump(str(songTitles), f, indent=2, sort_keys=True)#ensure_ascii=False).encode('utf-8')
        f.write("\n);")

    logging.info("processSongs(): done")

# getRawSongs()
processSongs()
