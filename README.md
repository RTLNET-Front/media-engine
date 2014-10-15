#media-engine
-------------
**MediaEngine** works within **3 API** : JWPlayer API, Dailymotion API and Youtube API.

These API's can be called by yourself or by the MediaEngine (by default):

#Inject Mode 

* Manual : 

In this mode, MediaEngine doesn't handle any ready API state events callbacks, and you need to be sure API's are loaded before player instantiation.

* Auto: 

In this mode, MediaEngine handle all ready API state events callbacks and players are stored in queue if API's aren't ready.

API's paths and API's inject mode can be configurated in Config section.

All API's aren't needed in order to work with the MediaEngine, you can work with one API only.


#Player Instantiation

Each players has facultative options, see Related Links for each available parameters for each API's.
* They're all native from the API, nothing is custom.
* For each player, a list of default options is set, see Configsection.
* You can override these default options when initializing a new player

###How to initialize a player ?

You don't need an ID to initialize a player, but a dom element is required. MediaEngine will generate an ID for each new player.ID's are useful when you need to call methods on a specific player, see MediaEngine methods. But if you need to call a specific method from the API, the best way is to play with the api directly, see below.</p>

    MediaEngine.initPlayer(where, type, options);

    where   : dom element, the player will replace it
    type    : string, can be "jwplayer, dmplayer or ytplayer"
    options : object, player options, each option override the default one

options.callback : A callback can be attached within options, return an object.

    options.callback = function(obj) {
        obj.api       // player API
        obj.events    // player events
    };

you can then attach a custom event, see API's Events.

    obj.events.addListener('onPlay', function(e, args){
        e.type  // event name
        args    // player event arguments
    });
    
..call a specific native API method..

    obj.api.methodName();
    
...or attach a specific native API event regarding the way you have to bind it !