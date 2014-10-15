#media-engine
-------------
**MediaEngine** works within **3 API** : JWPlayer API, Dailymotion API and Youtube API.

These API's can be called by yourself or by the MediaEngine (by default):

#####Inject Mode :
* Manual : 

In this mode, MediaEngine doesn't handle any ready API state events callbacks, and you need to be sure API's are loaded before player instantiation.

* Inject Mode: 

In this mode, MediaEngine handle all ready API state events callbacks and players are stored in queue if API's aren't ready.

API's paths and API's inject mode can be configurated in Config section.

All API's aren't needed in order to work with the MediaEngine, you can work with one API only.
