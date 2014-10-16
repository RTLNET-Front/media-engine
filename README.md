#media-engine
--------------

**MediaEngine** works within **3 API** : JW Player API, Dailymotion API and Youtube API.

APIs can be included by yourself or by the MediaEngine (this is the default behavior):

##Inject Mode 

- Manual : 

In this mode, MediaEngine doesn't handle any ready API state events callbacks, and you need to be sure API's are loaded before invoking player instantiation using MediaEngine.

- Auto: 

In this mode, MediaEngine handle all ready APIs state events and players **are stored in queue if APIs aren't ready.**

APIs paths and APIs inject mode can be configurated in Config section. All APIs aren't needed in order to work with the MediaEngine, you can work with one API only and the MediaEngine will load the appropriate needed API.


##Player Instantiation

Each players has facultative options, see Related Links for each available parameters for each API's.
- They're all native from the API, nothing is custom.
- For each player, a list of default options is set, see Config section.
- You can override these default options when initializing a new player.

###How to initialize a player ?

You don't need an ID to initialize a player, but a DOM Element is required. MediaEngine will generate an ID for each new player.IDs are useful when you need to call methods on a specific player *(see MediaEngine methods)*.

But if you need to call a specific method from the API, the best way is to play with the api directly, see below:

    MediaEngine.initPlayer(where, type, options);

- **where**   : *(DOM Element)*, this element will be replaced.
- **type**    : *(String)*, player type: can be "jwplayer", "dmplayer" or "ytplayer".
- **options** : *(Object)*, player options, each option property override the default media-engine options *(see Config section)*.

####options.callback
A callback can be attached within options, it return an object with two properties:

    options.callback = function(obj) {
        obj.api       // native player API
        obj.events    // media-engine player events
    };

you can then attach a media-engine custom event, see API's Events section:

    obj.events.addListener('onPlay', function(e, args){
        e.type  // event name
        args    // native player event arguments
    });
    
..or call a specific native API method..

    obj.api.nativeMethod();
    
##media-engine Events API


Unlike options, MediaEngine tries to makes all APIs events common. Each event fired by the MediaEngine is custom and based on the native API event.

* All of these events can be attached within the global MediaEngine Events Dispatcher. 
* All of these events are not natives from the API, they are custom and fired by the media-engine.

#### media-engine JW Player Custom Events :

    ['onReady','onSetupError','onPlaylist','onPlaylistItem','onPlaylistComplete','onBufferChange','onPlay','onPause','onBuffer','onIdle','onComplete','onError','onSeek','onMute','onVolume','onFullscreen','onResize','onQualityLevels','onQualityChange','onCaptionsList','onCaptionsChange','onControls','onDisplayClick','onAdClick','onAdCompanions','onAdComplete','onAdError','onAdImpression','onAdSkipped','onBeforePlay','onBeforeComplete','onMeta']
    
**Infos** : natives events 'onTime' and 'onAdTime' are not fired by default because of recursive calls, there is no custom event fired for these events.

#### media-engine Dailymotion Custom Events

    ['onReady', onPlay','onPlaying','onPause','onComplete','onCanplay','onCanplaythrough','onProgress','onSeeking','onSeek','onVolume','onDurationchange','onFullscreenchange','onError']

**Infos** : native event 'onTimeupdate' isn't fired by default because of recursive calls, there is no custom event fired for it.

#### media-engine Youtube Custom Events

    ['onReady','onIdle','onPlay','onPause','onBuffer','onCued','onComplete', 'onStateChange','onPlaybackQualityChange','onPlaybackRateChange', 'onError', 'onApiChange']

####Commons APIs events are:

    ['onReady', 'onPlay', 'onPause', 'onComplete', 'onError']
    
####Other events fired:

    ['onJwpAPIReady']      // Fired when the JWPlayer API is loaded and ready.
    ['onDailyAPIReady']    // Fired when the Dailymotion API is loaded and ready.
    ['onYoutubeAPIReady']  // Fired when the Youtube API is loaded and ready.
**Infos** : - These events aren't fired in api 'inject' mode, see API's section.    

##media-engine Events   

A global dispatcher fire all APIs custom events listed above, example:

    MediaEngine.events.addListener(['APIsCustomEvent'], function(e, type, api, args){
        e       // CustomEvent event ex: {type: "onPlay", target: EventCustom} 
        type    // player type name, can be: "jwplayer", "dmplayer" or "ytplayer"
        api     // native player API
        args    // native event arguments
    });
    
example:

    MediaEngine.events.addListener('onPlay', function(e, type, api, args){
        // ..all APIs 'play' events are fired here
    });
    
##media-engine Methods

MediaEngine has also his own methods too, listed below.
If you need more specific API method not listed here, you can attach methods from the API within the player initialization callback, see player instantiation.

**play(string)**    // Play the player.

    MediaEngine.play('playerId');

**pause(string)**   // Pause the player.

    MediaEngine.pause('playerId');

**stop(string)** // Stops the player and unloads the currently playing media file. *This method is not supported in Dailymotion player*

    MediaEngine.stop('playerId');

**seek(string,number)** // Jump to the specified position within the currently playing item. The position is required and must be provided as an integer, in seconds.

    MediaEngine.seek('playerId', position);

**mute(string,boolean)** // Change the player's mute state (no sound). Mute the player if true, and unmute if false.

    MediaEngine.mute('playerId', state);

**setVolume(string, number)** // Sets the player's audio volume percentage, as a number between 0 and 100.

    MediaEngine.setVolume('playerId', volume);

**getDuration(string)** // Returns the duration in seconds of the currently playing video. Note that getDuration() will return -1 until the video's metadata is loaded.
This method is not supported in Dailymotion player

    MediaEngine.getDuration('playerId');

**getPosition(string)** // Returns the current playback position in seconds, as a number.
This method is not supported in Dailymotion player

    MediaEngine.getPosition('playerId');

**getVolume(string)** // Returns the player's current volume, an integer between 0 and 100. Note that getVolume() will return the volume even if the player is muted. *This method is not supported in Dailymotion player*

    MediaEngine.getVolume('playerId');

**getItemMeta(string)** // Returns the current playing item object metadatas.*This method is not supported in Dailymotion player*

    MediaEngine.getItemMeta('playerId');

**isMuted(string)** // Returns true if the player is muted, false if not.*This method is not supported in Dailymotion player*

    MediaEngine.isMuted('playerId');

**Infos** : *'playerId' is related to the ID passed in the 'where' argument when invoking MediaEngine.initPlayer() method, see Player Instantiation section.*

##Config    
MediaEngine has a default config which is accessible through a console to:

    MediaEngine.config;

This config store an object for each API. Each object can contain the following params:

###Defaults API's Options:
You can easily modifying or accessing to the default options. Data object structure is the same has native API.

*Example for the Dailymotion API default options:*

    MediaEngine.config.DMPlayer.defaultOptions; // access
    MediaEngine.config.DMPlayer.defaultOptions.params.autoplay = 1; // override

###API Path:
You can easily modifying or accessing to the default API path. This only works when **'inject mode'** is enabled.

*Example for the Dailymotion API path:*

    MediaEngine.config.DMPlayer.api.path = 'http://new-path-api/';

###Default API Paths:
- **JWPLayer:**:    'jwplayer/jwplayer-6.7.4227/jwplayer.js'
- **DailyMotion:** '//api.dmcdn.net/all.js'
- **YouTube:**     '//www.youtube.com/iframe_api'

###API Inject Mode *(true is default)*:
You can choose to inject by yourself the API.

*Example for the Dailymotion API:*

    MediaEngine.config.DMPlayer.api.inject = false; // Manual mode, API isn't injected
    MediaEngine.config.DMPlayer.api.inject = true;  // Auto mode, API is injected by MediaEngine if needed
    
##Advertising   
*(JWPlayer Only)*

A pre-roll and a post-roll tag can be added to JWPlayer by passing an "ads" property to JWPlayer instantiation options.
*(These options are corresponding to the options object configuration using MediaEngine.initPlayer() method, see Player Instantiation section)*

    options.ads = {
        'preroll': 'preroll-tag-url.xml',
        'postroll': 'postroll-tag-url.xml'
    };

**disableAds** *(false is default)*
    
Within the Config, it's possible to disable all JW Player ads once (even if ads tags are set in options) by editing the following boolean:

    MediaEngine.config.JWPlayer.disableAds = true;
    
##eStat 

MediaEngine has one stream stats tools called "eStat".

eStat isn't called and loaded by the MediaEngine, you must call it by yourself. (Because of specifics params and specific ways to implement it.) 
eStat is disabled by default.
###eStat options:

    options.eStat = {
        'enabled' : true, // disable or enable eStat for this player
        'live'  : true,   // enable/disable eStat live measurement for this player
        'levels'  : {}    // custom eStat levels, see below
    };
    
*(These options are corresponding to the options object configuration using MediaEngine.initPlayer() method, see Player Instantiation section)*    
    
###eStat levels (see above)
eStat levels are optional but may be very useful for stats tracking.

    {   
        'eStatName'     : 'player_name',      // fallback to item filename if empty
        'eStatSection1' : 'player_level_1',   // fallback to an empty string if empty
        'eStatSection2' : 'player_level_2',   // fallback to an empty string if empty
        'eStatSection3' : 'player_level_3',   // fallback to item type "AUDIO" or "VIDEO" if empty
        'eStatSection4' : 'player_level_4',   // fallback to rendering mode "HTML5" or "FLASH" if empty
        'eStatSection5' : 'player_level_5',   // fallback to an empty string if empty
        'eStatGenre'    : 'player_genre'      // fallback to an empty string if empty
    }    

###Disable eStat *(false is default)*

Within the Config, it's possible to disable eStat (even eStat is instantiated) for all players by editing the following boolean:

    MediaEngine.config.eStat.disabled = true;

**attachPendingPlayers()** // This method attach eStat for all pending players waiting for eStat API ready. This is useful when you don't control eStat and player orders loading event. If eStat is called synchonously and before players instantiation, you don't need to work with this method.

*Example*: You set a player with eStat but eStat isn't loaded yet. The player is instantiated and ready but eStat will keep this player in a queue. You will have to call this method when eStat API is ready. This will bind eStat on ready players.

    MediaEngine.eStat.attachPendingPlayers();
    
**attach(string, object)** // This method attach eStat for a specific player.

    MediaEngine.eStat.attach('playerId', levels); // eStat is now attached

**detach(string)** // This method detach eStat for a specific player.

    MediaEngine.eStat.detach('playerId'); // eStat is now removed

**detachAll()** // This method detach eStat for all players within eStat attached

    MediaEngine.eStat.detachAll(); // eStat is now removed from all players in current page

**Infos** : *'playerId' is related to the ID passed in the 'where' argument when invoking MediaEngine.initPlayer() method, see Player Instantiation section.*

##Related Links 

- JWPlayer Options : http://www.longtailvideo.com/support/jw-player/
- JWPlayer Events : http://www.longtailvideo.com/support/jw-player/28851/javascript-api-reference
- Dailymotion Options : http://www.dailymotion.com/doc/api/player.html
- Dailymotion Events : http://www.dailymotion.com/doc/api/player.html
- Youtube Options : https://developers.google.com/youtube/player_parameters?playerVersion=HTML5
- Youtube Events : https://developers.google.com/youtube/iframe_api_reference#Events

## Releases

#### **1.1.2** - *25-09-2014*
- Fix getPos() polling issue within eStat