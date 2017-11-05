# SIF Card Tiers
An analysis of 800+ cards from **Love Live! School Idol Festival** (a mobile game on [Android](https://play.google.com/store/apps/details?id=klb.android.lovelive_en&hl=en) and [iOS](https://itunes.apple.com/us/app/love-live-school-idol-festival/id834030294?mt=8).) Breaks down some [in-game scoring formulas](http://decaf.kouhi.me/lovelive/index.php?title=Scoring#Calculating_the_Score) to find the true value of [card Skills](http://decaf.kouhi.me/lovelive/index.php?title=Gameplay#Skills.2FAppeals). More info on [the homepage of the project](http://vanna.io/sif-card-tiers/#/).

Built with AngularJS, Angular Bootstrap, and Python; [Sandstone theme by Bootswatch](https://bootswatch.com/sandstone/); game data from [schoolido.lu](http://schoolido.lu/) and [sif.kirara.ca](http://sif.kirara.ca), [the community wiki](http://decaf.kouhi.me/lovelive/), [kach again](http://kachagain.com/).

## Basic process
How it works:
1. Using Python:
    1. Fetch and clean data from schoolido.lu API
    2. Calculate and save relevant scores for each data
    3. Write new data as JSON in an AngularJS-consumable file
2. Using AngularJS, HTML, CSS:
    1. Display data to user on web interface with:
        - filters
        - images
        - sorting

Also allows registered schoolido.lu users to view their own deck of cards, rather than the entire database of cards.
