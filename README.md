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


#media-engine Events API


Unlike options, MediaEngine tries to makes all API's events common. Each event fired by the MediaEnigine is custom and based on the native API event.

* All of these options can be attached within the global MediaEngine Events Dispatcher. 
* All of these events are not natives from the API, they are custom.

####JWPlayer Custom Events :

    ['onReady','onSetupError','onPlaylist','onPlaylistItem','onPlaylistComplete','onBufferChange','onPlay','onPause','onBuffer','onIdle','onComplete','onError','onSeek','onMute','onVolume','onFullscreen','onResize','onQualityLevels','onQualityChange','onCaptionsList','onCaptionsChange','onControls','onDisplayClick','onAdClick','onAdCompanions','onAdComplete','onAdError','onAdImpression','onAdSkipped','onBeforePlay','onBeforeComplete','onMeta']
    
**Infos** : natives events 'onTime' and 'onAdTime' are not fired by default because of recursive calls, there is no custom event fired for these events.

####Dailymotion Custom Events

    ['onReady', onPlay','onPlaying','onPause','onComplete','onCanplay','onCanplaythrough','onProgress','onSeeking','onSeek','onVolume','onDurationchange','onFullscreenchange','onError']

**Infos** : native event 'onTimeupdate' isn't fired by default because of recursive calls, there is no custom event fired for it.

####Youtube Custom Events

    ['onReady','onIdle','onPlay','onPause','onBuffer','onCued','onComplete', onStateChange','onPlaybackQualityChange','onPlaybackRateChange', 'onError', 'onApiChange']

####All Commons API's events are:

    ['onReady', 'onPlay', 'onPause', 'onComplete', 'onError']

#media-engine Events	

A global dispatcher fire all API's custom events listed above, example:

    MediaEngine.events.addListener(['APICustomEvent'], function(e, type, api, args){
        e       // APICustomEvent event ex :{type: "onPlay", target: EventCustom} 
        type    // event player name ex : "JWPlayer"
        api     // player API
        args    // player event arguments
    });
    
example:

    MediaEngine.events.addListener('onPlay', function(e, type, api, args){
        // ..all API's 'play' events are fired here
    });
Other events fired:

    ['onJwpAPIReady']      // Fired when the JWPlayer API is loaded and ready.
    ['onDailyAPIReady']    // Fired when the Dailymotion API is loaded and ready.
    ['onYoutubeAPIReady']  // Fired when the Youtube API is loaded and ready.
**Infos** : - These events aren't fired in api 'inject' mode, see API's section.

#media-engine Methods	

MediaEngine has also his own methods too, listed below.
If you need more specific API method not listed here, you can attach methods from the API within the player initialization callback, see player instantiation.

**play(string)**    //Play the player.

    MediaEngine.play('playerId');

**pause(string)**   //Pause the player.

    MediaEngine.pause('playerId');

**stop(string)** //Stops the player and unloads the currently playing media file. *This method is not supported in Dailymotion player*

    MediaEngine.stop('playerId');

**seek(string,number)** // Jump to the specified position within the currently playing item. The position is required and must be provided as an integer, in seconds.

    MediaEngine.seek('playerId', position);

**mute(string,boolean)** //Change the player's mute state (no sound). Mute the player if true, and unmute if false.

    MediaEngine.mute('playerId', state);

**setVolume(string, number)** //Sets the player's audio volume percentage, as a number between 0 and 100.

    MediaEngine.setVolume('playerId', volume);

**getDuration(string)** // Returns the duration in seconds of the currently playing video. Note that getDuration() will return -1 until the video's metadata is loaded.
This method is not supported in Dailymotion player

    MediaEngine.getDuration('playerId');

**getPosition(string)** // Returns the current playback position in seconds, as a number.
This method is not supported in Dailymotion player

    MediaEngine.getPosition('playerId');

**getVolume(string)** //Returns the player's current volume, an integer between 0 and 100. Note that getVolume() will return the volume even if the player is muted. *This method is not supported in Dailymotion player*

    MediaEngine.getVolume('playerId');

**getItemMeta(string)** //Returns the current playing item object metadatas.*This method is not supported in Dailymotion player*

    MediaEngine.getItemMeta('playerId');

**isMuted(string)** // Returns true if the player is muted, false if not.*This method is not supported in Dailymotion player*

    MediaEngine.isMuted('playerId');

**Infos** : - 'playerId' argument is the ID passed into the 'where' argument when calling MediaEngine.initPlayer().