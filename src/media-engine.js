/*!
 * RTLnet JavaScript Media Engine
 *
 * version: 1.1.2
 *
 * description: manage players objects and work with player's API
 *
 * Last update: 25-09-2014
 *
 * What's new:
 * Fix getPos issue param on polling in eStat
 *
 */

(function(window){

	// public vars
	window.MediaEngine 	= window.MediaEngine || {};

	MediaEngine.version =  '1.1.2';
	MediaEngine.config  = {};

	// private vars
	var fileName 		= 'media-engine-'+MediaEngine.version+'.js', // used in debug log console
		ids				= [], // store each player id within this array, prevent adding twice same player ID
		players 		= []; // store each player within an object (api, events, id, type)

	// Save bytes in the minified (but not gzipped) version:
	var ArrayProto		= Array.prototype,
		ObjProto		= Object.prototype,
		FuncProto		= Function.prototype;

	// Create quick reference variables for speed access to core prototypes.
	var slice 			= ArrayProto.slice,
		toString		= ObjProto.toString,
		nativeIsArray	= Array.isArray;

	// default config	
	MediaEngine.config = {

		'JWPlayer': {

			// options: http://www.longtailvideo.com/support/jw-player/
			'defaultOptions' : { 
				'width'		  : '100%',
				'aspectratio' : '16:9',
				'primary'	  : 'flash',
				'autostart'   : 'false',
				'ads'		  : {
					'preroll': null, // both preroll and postroll params are not in jwplayer options, it's just a faster way to ad tags
					'postroll': null
				},
				// eStat param isn't native in jwplayer options
				'eStat' : {
					'enabled': false,
					'live': false, // eStat type live measurement
					'levels': {
						'eStatName'	   : '', // fallback to item filename if empty
						'eStatSection1': '', // fallback to an empty string if empty
						'eStatSection2': '', // fallback to an empty string if empty
						'eStatSection3': '', // fallback to item type "AUDIO" or "VIDEO" if empty
						'eStatSection4': '', // fallback to rendering mode "HTML5" or "FLASH" if empty
						'eStatSection5': '', // fallback to an empty string if empty
						'eStatGenre'   : ''  // fallback to an empty string if empty
					}
				},
				'advertising' : {
					'client': 'vast',
					'skipoffset': 5,
					'skipmessage' : 'XX',
					'skiptext': 'Ignorer',
					'admessage': 'Votre programme commence dans XX seconde(s)',
					'schedule': {
						'adbreak1': {
							'offset': 'pre',
							'tag': null // filled by 'ads.preroll' previous param
						},
						'adbreak2': {
							'offset': 'post',
							'tag': null // filled by 'ads.preroll' previous param
						}
					}
				}
			},

			'api': {
				'path': 'jwplayer/jwplayer-6.8/jwplayer.js',
				'inject': true
			},

			'disableAds': false

		},

		'DMPlayer': {

			// options: http://www.dailymotion.com/doc/api/player.html
			'defaultOptions': {
				'videoid': null,
				'width'	 : '100%',
				'height' : '100%',
				'params' : {
					'autoplay'			 : 0,
					'webkit-playsinline' : 1
				}
			},

			'api': {
				'path': '//api.dmcdn.net/all.js',
				'inject': true
			}

		},

		'YTPlayer': {

			// options: https://developers.google.com/youtube/player_parameters?playerVersion=HTML5
			'defaultOptions': {
				'videoid': null,
				'width'	 : '100%',
				'height' : '100%',
				'params' : {
					'autoplay'		: 0,
					'autohide'		: 1,
					'cc_load_policy': 0,
					'iv_load_policy': 3,
					'enablejsapi' 	: 1,
					'showinfo'		: 0,
					'origin' 		: document.location.protocol+ '//' + document.location.hostname,
					'wmode' 		: 'transparent'
				}
			},

			'api': {
				'path': '//www.youtube.com/iframe_api',
				'inject': true
			}

		},

		'eStat': {
			'disabled' : false
		}

	};

	/*
	---
	name: indexOf Polyfill
	description: Add indexOf method on Array prototype for ECMAScript < v5
	source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
	...
	*/
	if (!ArrayProto.indexOf) {
		ArrayProto.indexOf = function (searchElement , fromIndex) {
			var i,
				pivot = (fromIndex) ? fromIndex : 0,
				length;

			if (!this) {
				throw new TypeError();
			}

			length = this.length;

			if (length === 0 || pivot >= length) {
				return -1;
			}

			if (pivot < 0) {
				pivot = length - Math.abs(pivot);
			}

			for (i = pivot; i < length; i++) {
				if (this[i] === searchElement) {
					return i;
				}
			}
			return -1;
		};
	}

	/*
	---
	name: bind Function Polyfill
	description: Add bind method on Function prototype for ECMAScript < v5
	source: https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Function/bind
	...
	*/
	if (!FuncProto.bind) {
		FuncProto.bind = function (oThis) {

			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5
				// internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs = ArrayProto.slice.call(arguments, 1), 
				fToBind = this, 
				fNOP = function () {},
				fBound = function () {
					return fToBind.apply( this instanceof fNOP && oThis ? this : oThis, aArgs.concat(ArrayProto.slice.call(arguments)) );
				};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

	/*
	---
	name: log
	description: send a debug message to console if present
	argument:[message:string]
	...
	*/

	function log(message){
		if(window.console && window.console.log){
			console.log("File: "+fileName+" - "+message);
		}
	}

	/*
	---
	name: isArray
	description: Is a given value an array?
	source: http://underscorejs.org/underscore.js
	...
	*/

	var isArray = nativeIsArray || function(obj) {
		return toString.call(obj) == '[object Array]';
	};

	/*
	---
	name: isObject
	description: Is a given variable an object?
	source: http://underscorejs.org/underscore.js
	...
	*/

	function isObject(obj) {
		return toString.call(obj) == '[object Object]';
	}

	/*
	---
	name: cloneOf
	description: [Save bytes shortcut: do not call directly]
	...
	*/

	function cloneOf(val) {
		if( isObject(val) ){
			return cloneObj(val);
		} else if( isArray(val) ) {
			return cloneArray(val);
		} else {
			return val;
		}
	}

	/*
	---
	name: cloneArray
	description: Return a copy from an array
	infos: object items within array are cloned without references
	arguments: [obj:Array]
	...
	*/

	function cloneArray(array) {
		var _clone = [];
		for (var i = 0, l = array.length; i < l; i++){
			_clone[i] = cloneOf(array[i]);
		}
		return _clone;
	}

	/*
	---
	name: cloneObj
	description: Return a copy from an object without any references
	infos: pull out null or undefined values
	arguments: [obj:Object]
	...
	*/

	function cloneObj(obj) {
		var _clone = {};
		for (var key in obj){
			if( (obj[key] !== null) && (obj[key] !== undefined) ){
				_clone[key] = cloneOf(obj[key]);
			}
		}
		return _clone;
	}

	/*
	---
	name: mergeObj
	description: Return a merged object from multiples objects without any references
	infos: pull out null or undefined values
	arguments: [obj1, obj2, obj3...]
	...
	*/

	function mergeObj() {
		var _merged = {};
		for(var i = 0, l = arguments.length; i < l; i++){
			var obj = arguments[i];
			for (var key in obj){
				if( (obj[key] !== null) && (obj[key] !== undefined) ){
					if( isObject(obj[key]) ){
						_merged[key] = mergeObj(_merged[key], obj[key]); // if value is an object, iterate function again
					}else {
						_merged[key] = cloneOf(obj[key]); // otherwise, set value
					}
				}
			}
		}
		return _merged;
	}

	/*
	---
	name: getPlayerObjectById
	description: return player object by passed ID
	...
	*/

	function getPlayerObjectById(id){

		for (var i = 0, l = players.length; i<l; i++){
			if(players[i].id === id){
				return players[i];
			}
		}

		log("No player object found for '"+id+"' id [getPlayerObjectById()]");

		return null;
		
	}

	/*
	---
	name: toInteger
	description: convert a "boolean string", a boolean or a number into a boolean integer
	arguments: [toConvert: string or boolean]
	examples: 	- "true" or "TRUE" 		> 1
				- "false" or "false" 	> 0
				- true 					> 1
				- "0" 					> 0
				- "1" 					> 1
				- "hello world" 		> error
				- ..
	...
	*/

	function toInteger(toConvert){
		
		var _typeof = typeof(toConvert);

		if(_typeof == 'string'){
			switch (toConvert.toLowerCase()) {
				case "true":
					return 1;
				break;
				case "false":
					return 0;
				break;
				default:
					log("Cannot convert string to integer. [toInteger()]");
				break;
			}
		}else if( (_typeof == 'boolean') || (_typeof == 'number') ){
			if(toConvert){
				return 1;
			}else {
				return 0;
			}
		}else {
			log("Cannot convert to integer. [toInteger()]");
		}
		
	}

	/*
	---
	name: EventCustom
	description: Manages Custom Events
	source: http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/
	updates from RTLnet: Add arguments in fire() method
	copyright: Copyright (c) 2010 Nicholas C. Zakas. All rights reserved. MIT License
	...
	*/

	function EventCustom(){
	    this._listeners = {};
	}

	EventCustom.prototype = {

	    constructor: EventCustom,

	    addListener: function(type, listener){
	        if (typeof this._listeners[type] == "undefined"){
	            this._listeners[type] = [];
	        }

	        this._listeners[type].push(listener);
	    },

	    fire: function(event){
	        if (typeof event == "string"){
	            event = { type: event };
	        }
	        if (!event.target){
	            event.target = this;
	        }
	        if (!event.type){  // falsy
	            log("Event object missing 'type' property. [EventCustom()]");
	        }

	        // arguments check
	        var args = [];
	        var numOfArgs = arguments.length;
			for (var i=0; i<numOfArgs; i++){
				args.push(arguments[i]);
			}
	        if (args.length > 1){
	        	args = args.splice(1, args.length-1);
	        } else {
	        	args = [];
	        }
	        args = [event].concat(args);

	        if (this._listeners[event.type] instanceof Array){
	            var listeners = this._listeners[event.type];
	            for (var i=0, len=listeners.length; i < len; i++){
	                listeners[i].apply(this, args);
	            }
	        }
	    },

	    removeListener: function(type, listener){
	        if (this._listeners[type] instanceof Array){
	            var listeners = this._listeners[type];
	            for (var i=0, len=listeners.length; i < len; i++){
	                if (listeners[i] === listener){
	                    listeners.splice(i, 1);
	                    break;
	                }
	            }
	        }
	    }
	};

	/*
	---
	name: JWPlayerEstat Class
	description: Attach eStats events on a jwplayer object
	requires : [eStat >= 4.0.36]
	...
	*/

	function JWPlayerEstat(jwp, params, typeLive){

		this.jwp 				= jwp;
		this.params				= params;
		this.typeLive           = typeLive || false;
		this.jwpDomElement 		= this.jwp.container;
		this.eStatSession 		= true;
		this.markerReference 	= null;
		this.eStatDisabled		= false;
		this.attachJWPlayerEvents();
		this.attachEstat();

	};

	JWPlayerEstat.prototype = {

		constructor: JWPlayerEstat,

		getPos: function(){
			if(!this.typeLive){
				var _pos = Math.round(this.jwp.getPosition());
				if(typeof(_pos) === 'number'){
					return(_pos);
				}
			}
			return 0;
		},

		attachJWPlayerEvents: function(){

			var _this = this;

			_this.jwp.onPlay(function(){

				if(_this.eStatDisabled){
					return false;
				}

				try{
					if(!_this.eStatSession){

						eStat_ms.newStreamUI(_this.markerReference,
							_this.params.eStatName,
							_this.params.eStatSection1,
							_this.params.eStatSection2,
							_this.params.eStatSection3,
							_this.params.eStatSection4,
							_this.params.eStatSection5,
							_this.params.eStatGenre);
							eStat_ms.TagDS(_this.jwpDomElement).sendEvent(eStatPlayState.Play, 0);
						_this.eStatSession = true;

					}else {
						eStat_ms.TagDS(_this.jwpDomElement).sendEvent(eStatPlayState.Play, _this.getPos());
					}
				}catch(e){
					log(e + '[JWPlayerEstat.onPlay()]');
				}

		    });

			if(!_this.typeLive){
			    _this.jwp.onPause(function(){
			    	if(_this.eStatDisabled){
						return false;
					}
			    	try{
			    		eStat_ms.TagDS(_this.jwpDomElement).sendEvent(eStatPlayState.Pause, _this.getPos());
			    	}catch(e){
			    		log(e + '[JWPlayerEstat.onPause()]');
			    	}
				});
			}
			
			/*
			 * Each time a stop is called, a new session needs to be created (var eStatSession) on the next play.
			 * This is applicable for both live and replays (eStat doc 4.0.36 is false at this point)
			 */
			_this.jwp.onIdle(function(){
				if(_this.eStatDisabled){
					return false;
				}
				try {
					eStat_ms.TagDS(_this.jwpDomElement).sendEvent(eStatPlayState.Stop, _this.getPos());
					_this.eStatSession = false;
				}catch(e){
					log(e + '[JWPlayerEstat.onIdle()]');
				}
			});

			if(!_this.typeLive){
				_this.jwp.onSeek(function(pos){
					if(_this.eStatDisabled){
						return false;
					}
					try {
				   		eStat_ms.TagDS(_this.jwpDomElement).sendEvent(eStatPlayState.Pause, Math.floor(pos.position));
				   		eStat_ms.TagDS(_this.jwpDomElement).sendEvent(eStatPlayState.Play, Math.floor(pos.offset));
				   	}catch(e){
				   		log(e + '[JWPlayerEstat.onSeek()]');
				   	}
				});
			}

			/*
			 * This part 'tries' to capture the whole duration of the current media,
			 * because untile the media isn't full downloaded, we can't access to the full duration
			 */
			if(!_this.typeLive){
				_this.jwp.onBufferChange(function(obj){
					if(_this.eStatDisabled){
						return false;
					}
					if( (obj.bufferPercent === 100) && (obj.duration > 0) ){
						try {
							eStat_ms.TagDS(_this.jwpDomElement).setDuration( parseInt(obj.duration) );
					   	}catch(e){
					   		log(e + '[JWPlayerEstat.onBufferChange()]');
					   	}
					}
				});
			}

		},

		attachEstat: function(){

			var _this = this;
			var _getPos = _this.getPos.bind(_this);

			eStat_ms.referenceUI(_this.jwpDomElement,
				"DS",
				_this.params.eStatName,
				_this.params.eStatSection1, // in console url params'eStatSection1' & 'eStatSection3' are switched but in eStat panel they're not
				_this.params.eStatSection2,
				_this.params.eStatSection3, // in console url params'eStatSection1' & 'eStatSection3' are switched but in eStat panel they're not
				_this.params.eStatSection4,
				_this.params.eStatSection5,
				_this.params.eStatGenre,
				"",
				_getPos
			);
			eStat_ms.TagDS(_this.jwpDomElement).setUrl(_this.params.eStatName);			
			_this.markerReference = eStat_ms.TagDS(_this.jwpDomElement).player;
		},

		detachEstat: function(){
			try {
				this.eStatDisabled = true;
				eStat_ms.StopMeasurement(this.jwpDomElement);
			}catch(e){}
		}

	};

	/*
	---
	name: eStat
	description: An external service to initialize stream stats on our players
	requires : [eStat >= 4.0.36]
	...
	*/

	var eStat = {

		attachPendingPlayers : function(){

			if( !this.isEstatReady() ){
				log("eStat API isn't loaded or missing [eStat.attachPendingPlayers()]");
				return;
			}

			for(var i = 0, l = this.queue.length; i<l; i++){
				this.attach.apply(this, this.queue[i]); // start eStat for each player in queue
			}

			this.queue.length = 0;

		},

		init: function(playerObj, levels, typeLive){

			if(MediaEngine.config.eStat.disabled){
				return; // do nothing if eStat is disabled
			}

			if(!playerObj.id){
				log("playerObj.id is missing [eStat.attach()]");
				return false;
			}

			if(playerObj.type !== 'JWPlayer'){
				log("eStat isn't working for '"+playerObj.type+"' type. [eStat.init()]");
			}

			if( !this.isEstatReady() ){
				this.queue.push(arguments); // while API isn't loaded, push arguments in queue
			}else {
				this.attach.apply(this, arguments); // if API is loaded, start eStat
			}

		},

		attach: function(playerObj, levels, typeLive) {

			// prevent attaching eStat twice
			for (var i = 0, l = this.players.length; i<l; i++){
				if(playerObj.id === this.players[i].id){
					return;
				}
			}

			// create and eStat object within player object
			playerObj.eStat = {};

			switch(playerObj.type) {
				case 'JWPlayer':
					this.attachJWP(playerObj, levels, typeLive);
				break;
			}

			this.players.push(playerObj); // store player object

		},

		attachJWP: function(playerObj, levels, typeLive){

			var _player = playerObj.api; // get jwplayer instance

			if(!_player){
				log("jwplayer instance within '"+playerObj.id+"' not found [eStat.start()]");
				return false;
			}

			var _item 	= _player.getPlaylistItem(), // get current item playing
				_lvls 	= mergeObj(MediaEngine.config.JWPlayer.defaultOptions.eStat.levels, levels),
				_eS3	= _lvls.eStatSection3, // save bytes
				_eS4	= _lvls.eStatSection4; // save bytes

			// name	
			if(!_lvls.eStatName){
				_lvls.eStatName = _item.file;
			}	

			// type
			if(!_eS3 && _item.sources[0]){
				_eS3  = _item.sources[0].type; // file extension
				if(_eS3){
					if( _eS3 === 'aac' || _eS3 === 'mp3' || _eS3 === 'vorbis' ){
						_eS3 = "AUDIO";
					}else if( _eS3 === 'mp4' || _eS3 === 'flv' || _eS3 === 'webm' ){
						_eS3 = "VIDEO";
					}else {
						_eS3 = 'UNKNOWN';
					}
				}
			}
			_lvls.eStatSection3 = _eS3;

			// environnement
			if(!_eS4){
				if(_player.getRenderingMode() === 'html5'){
					_eS4 = 'HTML5'; 
				}else {
					_eS4 = 'FLASH';
				}
			}
			_lvls.eStatSection4 = _eS4;

			// attach eStat within jwplayer instance
			playerObj.eStat.manager = new JWPlayerEstat(_player, _lvls, typeLive);

		},

		detach: function(playerObj, removeAll){

			if(!playerObj.eStat.manager){
				log("eStat manager isn't found [eStat.destroy()]");
				return false;
			}

			// remove estat
			playerObj.eStat.manager.detachEstat();
			playerObj.eStat = {};

			if(!removeAll){
				// remove id from estat players array
				var index = this.players.indexOf(playerObj);
				if (index > -1) {
					this.players.splice(index, 1);
				}
			}

		},

		isEstatReady: function(){
			if(!window._cmsJS || !window._PJS || !window.eStat_ms){
				return false;
			}else {
				return true;
			}
		},

		queue:   [], // players are stored here when eStat isn't available
		players: [] // players within eStat attached

	};

	// bind some methods accessible in the MediaEngine
	MediaEngine.eStat = {

		attachPendingPlayers: function(){
			eStat.attachPendingPlayers();
		},

		attach: function(id, levels){
			var obj = getPlayerObjectById(id);
			if(obj){
				eStat.init(obj, levels);
			}
		},

		detach: function(id){
			var obj = getPlayerObjectById(id);
			if(obj){
				eStat.detach(obj, false);
			}
		},

		detachAll: function(){
			for(var i = 0, l = eStat.players.length; i<l; i++){
				eStat.detach(eStat.players[i], true);
			}
			eStat.players.length = 0;
		}

	};

	/*
	---
	name: addScript
	description: Better handling of scripts without supplied ids.
	source: http://www.phpied.com/social-button-bffs/
	...
	*/

	var Script = {

		fjs: document.getElementsByTagName('script')[0],

		load: function(url, id, callback){

			var js;
			if (document.getElementById(id)){return;}
			js = document.createElement('script');
			js.src = url;
			js.id = id;

			if(callback){
				if(js.readyState){  // IE
					js.onreadystatechange = function(){
						if (js.readyState == "loaded" || js.readyState == "complete"){
							js.onreadystatechange = null;
							callback();
						}
					};
				}else {  // others
					js.onload = function(){
						callback();
					};
				}
			}
			
			this.fjs.parentNode.insertBefore(js, this.fjs);
		}

	};

	/*
	---
	name: JWPlayer
	description: Module with methods and callbacks to initialize and control a new JWPlayer
	requires: [jwplayer v6.6]
	...
	*/

	var JWPlayer = {

		setPlayer: function(where, options, callback){ // args: dom element, object array, player object returned

			if(!window.jwplayer){
				log("JWPlayer API isn't loaded or missing [JWPlayer.setPlayer()]");
				return;
			}

			var _this = this,
				_id = where.getAttribute('id');
	
			// jwplayer API needs a unique identifier
			// we test if an ID is already present or not, otherwise we generate an id
			if(_id){
				for( var i = 0, l = ids.length; i<l; i++ ){
					if(_id === ids[i]){
						log("ID '"+_id+"' is duplicated, abort player initialization... [JWPlayer.setPlayer()]");
						return false;
					}
				}
				ids.push(_id);
			}else {
				_this.counterId += 1;
				_id = "media_engine_jw_id_" + _this.counterId;
				where.setAttribute('id', _id); // set the generate ID
			}

			// merged options within defaultoptions
			var _options = mergeObj(_this.defaultOptions, options);

			// ads configuration
			_options.advertising = this.getAds(_options);

			// player initialization
			jwplayer(where).setup(_options);

			jwplayer(where).onReady(function(){

				// create an object with both player api and Custom Events
				var _player = {
					'api': this,
					'events' : new EventCustom(),
					'id': _id,
					'type': _this.playerType
				};

				// store player object
				players.push(_player);

				// attach all api events
				_this.addListeners(_player);

				// attach eStat
				if(_options.eStat.enabled){
					eStat.init(_player, _options.eStat.levels, _options.eStat.live);
				}

				// return callback id needed
				if(callback){
					callback(_player);
				}

				// fire 'onReady' event
				_this.fireEvent.call(_player, 'onReady');

			});

		},

		getAds: function(options){
			
			// if ads are disabled or if there is no preroll or postroll, return null
			if(MediaEngine.config.JWPlayer.disableAds || (!options.ads.preroll && !options.ads.preroll) ){
				return null; 
			}else {

				// if preroll, attach it within ova params
				if(options.ads.preroll){
					options.advertising.schedule.adbreak1.tag = options.ads.preroll;
				}else {
					delete options.advertising.schedule.adbreak1; // prevent to call js-ads file
				}

				// if postroll, attach it within ova params
				if(options.ads.postroll){
					options.advertising.schedule.adbreak2.tag = options.ads.postroll;
				}else {
					delete options.advertising.schedule.adbreak2; // prevent to call js-ads file
				}

				return options.advertising;
			}

		},

		addListeners: function(_player){

			var _this = this;

			for(var i = 0, l = _this.apiEvents.length; i < l; i++){

				// need a closure to keep event alive
				(function(i){
					_player.api[_this.apiEvents[i]](function(e){ // attach each api event
						var args = slice.call(arguments, 0, arguments.length); // convert args into a real array
						_this.fireEvent.call(_player, _this.apiEvents[i], args);
					});
				})(i);

			}

		},

		fireEvent: function(e, args){

			// 'this' is the player object and 'args' are player event arguments
			this.events.fire(e, args); // callback events
			JWPlayer.events.fire('dispatchEvent', e, JWPlayer.playerType, this.api, args); // Media Engine Events

		},

		// add custom events listener on JWPlayer
		events: new EventCustom(),

		// player type name
		playerType: 'JWPlayer',

		// players counter (incremented later)
		counterId: 0,

		apiLoaded: false,

		apiCalled: false,

		defaultOptions: MediaEngine.config.JWPlayer.defaultOptions,

		// native api events: http://www.longtailvideo.com/support/jw-player/28851/javascript-api-reference
		apiEvents: ['onSetupError','onPlaylist','onPlaylistItem','onPlaylistComplete','onBufferChange','onPlay','onPause','onBuffer','onIdle','onComplete','onError','onSeek','onMute','onVolume','onFullscreen','onResize','onQualityLevels','onQualityChange','onCaptionsList','onCaptionsChange','onControls','onDisplayClick','onAdClick','onAdCompanions','onAdComplete','onAdError','onAdImpression','onAdSkipped','onBeforePlay','onBeforeComplete','onMeta']

	};

	// attach JWPlayer API load event
	function onJwpAPIReady() {
		if(!MediaEngine.config.JWPlayer.api.inject){
			return;
		}
		JWPlayer.apiLoaded = true;
		JWPlayer.events.fire('onJwpAPIReady');
		JWPlayer.events.fire('dispatchEvent', 'onJwpAPIReady');
	}


	/*
	---
	name: DMPlayer
	description: Module with methods and callbacks to initialize and control a new Dailymotion player
	requires : [Dailymotion API]
	...
	*/
		
	var DMPlayer = {

		setPlayer: function(where, options, callback){ // args: dom element, object array

			if(!window.DM){
				log("Dailymotion API is not loaded or missing [DMPlayer.setPlayer()]");
				return;
			}

			var _this = this,
				_id = where.getAttribute('id');
	
			// dailymotion API needs a unique identifier
			// we test if an ID is already present or not, otherwise we generate an id
			if(_id){
				for( var i = 0, l = ids.length; i<l; i++ ){
					if(_id === ids[i]){
						log("ID '"+_id+"' is duplicated, abort player initialization... [DMPlayer.setPlayer()]");
						return false;
					}
				}
				ids.push(_id);
			}else {
				_this.counterId += 1;
				_id = "media_engine_dm_id_" + _this.counterId;
				where.setAttribute('id', _id); // set the generate ID
			}

			// merged options within defaultoptions
			var _options = mergeObj(_this.defaultOptions, options);

			// convert to integer value for integer params
			for (var i = 0, l = _this.integerParams.length; i < l; i++){
				_options.params[ _this.integerParams[i] ] = toInteger( _options.params[ _this.integerParams[i] ] );
			}

			// player initialization
			DM.player(where, {

				'video'	 : _options.videoid,
				'width'	 : _options.width,
				'height' : _options.height,
				'params' : _options.params

			}).addEventListener('apiready', function(e){

				// create an object with both player api and Custom Events
				var _player = {
					'api': e.target,
					'events' : new EventCustom(),
					'id': _id,
					'type': _this.playerType
				};

				// store player object
				players.push(_player);

				// attach all api events
				_this.addListeners(_player);

				// return callback id needed
				if(callback){
					callback(_player);
				}

				// fire 'onReady' event
				_this.fireEvent.call(_player, 'onReady', e);

			});

		},

		addListeners: function(_player){

			var _this  = this;

			for(var i = 0, l = _this.apiEvents.length; i < l; i++){

				// need a closure to keep event alive
				(function(i){

					var _Evt;

					if(_this.apiEvents[i] === 'ended'){
						_Evt = 'onComplete';
					}else if(_this.apiEvents[i] === 'seeked'){
						_Evt = 'onSeek';
					}else if(_this.apiEvents[i] === 'volumechange'){
						_Evt = 'onVolume';
					}else {
						// transform the current event following this pattern: 'onEvent'
						var _Evt = 'on'+_this.apiEvents[i][0].toUpperCase() + _this.apiEvents[i].substring(1);
					}

					_player.api.addEventListener(_this.apiEvents[i], function(e){ // attach each api event
						var args = slice.call(arguments, 0, arguments.length); // convert args into a real array
						_this.fireEvent.call(_player, _Evt, args);
					});

				})(i);

			}

		},

		fireEvent: function(e, args){

			// 'this' is the player object and 'args' are player event arguments
			this.events.fire(e, args); // callback events
			DMPlayer.events.fire('dispatchEvent', e, DMPlayer.playerType, this.api, args); // Media Engine events

		},

		// add custom events listener on DMPlayer
		events: new EventCustom(),

		// players counter (incremented later)
		counterId: 0,

		// player type name
		playerType: 'DMPlayer',

		apiLoaded: false,

		apiCalled: false,

		defaultOptions: MediaEngine.config.DMPlayer.defaultOptions,

		// warning: boolean integer params only, will be transformed in '0' or '1', see toInteger()
		integerParams : ['autoplay', 'webkit-playsinline'],

		// native api events: http://www.dailymotion.com/doc/api/player.html
		apiEvents: ['play','playing','pause','ended','canplay','canplaythrough','progress','seeking','seeked','volumechange','durationchange','fullscreenchange','error']

	};

	// attach Dailymotion API load event
	window.dmAsyncInit = function() {
		if(!MediaEngine.config.DMPlayer.api.inject){
			return;
		}
		DMPlayer.apiLoaded = true;
		DMPlayer.events.fire('onDailyAPIReady');
		DMPlayer.events.fire('dispatchEvent', 'onDailyAPIReady');
	};

	/*
	---
	name: YTPlayer
	description: Module with methods and callbacks to initialize and control a new Youtube player
	requires : [Youtube API]
	...
	*/
		
	var YTPlayer = {

		setPlayer: function(where, options, callback){ // args: dom element, object array

			if(!window.YT){
				log("Youtube API is not loaded or missing [YTPlayer.setPlayer()]");
				return;
			}

			var _this = this,
				_id = where.getAttribute('id');
	
			// youtube API needs a unique identifier
			// we test if an ID is already present or not, otherwise we generate an id
			if(_id){
				for( var i = 0, l = ids.length; i<l; i++ ){
					if(_id === ids[i]){
						log("ID '"+_id+"' is duplicated, abort player initialization... [YTPlayer.setPlayer()]");
						return false;
					}
				}
				ids.push(_id);
			}else {
				_this.counterId += 1;
				_id = "media_engine_yt_id_" + _this.counterId;
				where.setAttribute('id', _id); // set the generate ID
			}

			// merged options within defaultoptions
			var _options = mergeObj(_this.defaultOptions, options);

			// convert to integer value for integer params
			for (var i = 0, l = _this.integerParams.length; i < l; i++){
				_options.params[ _this.integerParams[i] ] = toInteger( _options.params[ _this.integerParams[i] ] );
			}

			// player initialization
			new YT.Player(where, {
				'width'	 	 : _options.width,
				'height' 	 : _options.height,
				'videoId'	 : _options.videoid,
				'playerVars' : _options.params,
				'events'	 : {
					onReady : function(e){

						// create an object with both player api and Custom Events
						var _player = {
							'api': e.target,
							'events' : new EventCustom(),
							'id': _id,
							'type': _this.playerType
						};

						// store player object
						players.push(_player);

						// attach all api events
						_this.addListeners(_player);

						// return callback id needed
						if(callback){
							callback(_player);
						}

						// fire 'onReady' event
						_this.fireEvent.call(_player, 'onReady', e);

					}
				}
			});

		},

		addListeners: function(_player){

			var _this = this;

			for(var i = 0, l = _this.apiEvents.length; i < l; i++){

				if(_this.apiEvents[i] === 'onStateChange'){

					_player.api.addEventListener(_this.apiEvents[i], function(e){ // attach api event

						var args = slice.call(arguments, 0, arguments.length); // convert args into a real array

						switch(e.data){
							case -1: 
								_this.fireEvent.call(_player, 'onIdle', args);
							break;
							case 0: 
								_this.fireEvent.call(_player, 'onComplete', args);
							break;
							case 1: 
								_this.fireEvent.call(_player, 'onPlay', args);
							break;
							case 2: 
								_this.fireEvent.call(_player, 'onPause', args);
							break;
							case 3: 
								_this.fireEvent.call(_player, 'onBuffer', args);
							break;
							case 5: 
								_this.fireEvent.call(_player, 'onCued', args);
							break;
						}

					});

				}else {

					// need a closure to keep event alive
					(function(i){
						_player.api.addEventListener(_this.apiEvents[i], function(e){ // attach each api event
							var args = slice.call(arguments, 0, arguments.length); // convert args into a real array
							_this.fireEvent.call(_player, _this.apiEvents[i], args);
						});
					})(i);
				}

			}

		},

		fireEvent: function(e, args){

			// 'this' is the player object and 'args' are player event arguments
			this.events.fire(e, args); // callback events
			YTPlayer.events.fire('dispatchEvent', e, YTPlayer.playerType, this.api, args); // Media Engine events

		},

		// add custom events listener on YTPlayer
		events: new EventCustom(),

		// player type name
		playerType: 'YTPlayer',

		// players counter (incremented later)
		counterId: 0,

		apiLoaded: false,

		apiCalled: false,

		defaultOptions: MediaEngine.config.YTPlayer.defaultOptions,

		// warning: boolean integer params only, will be transformed in '0' or '1', see toInteger() 
		integerParams : ['autoplay', 'cc_load_policy', 'enablejsapi', 'showinfo'],

		// native api events: https://developers.google.com/youtube/iframe_api_reference#Events
		apiEvents: ['onStateChange', 'onPlaybackQualityChange', 'onPlaybackRateChange', 'onError', 'onApiChange']

	};

	// attach YTPlayer API load event
	window.onYouTubeIframeAPIReady = function() {
		if(!MediaEngine.config.YTPlayer.api.inject){
			return;
		}
		YTPlayer.apiLoaded = true;
		YTPlayer.events.fire('onYoutubeAPIReady');
		YTPlayer.events.fire('dispatchEvent', 'onYoutubeAPIReady');
	};


	/*
	---
	name: initPlayer
	description: A unique function to initialize a player API
	arguments: [where:dom element, type:string, options:object]
	infos: Somes api's needs to be loaded before initialization start, see below
	...
	*/

	var JWQueue  = [],
		DMQueue  = [],
		YTQueue  = [];

	MediaEngine.initPlayer = function(where, type, options){

		var _module, _id, _queue, _apiPath, _inject, _callback;

		switch(type) {
			case 'jwplayer':
				_module   = JWPlayer;
				_queue    = JWQueue;
				_id       = 'jw-api';
				_apiPath  = MediaEngine.config.JWPlayer.api.path;
				_inject	  = MediaEngine.config.JWPlayer.api.inject;
				_callback = onJwpAPIReady;
			break;
			case 'dmplayer':
				_module   = DMPlayer;
				_queue    = DMQueue;
				_id       = 'dm-api';
				_apiPath  = MediaEngine.config.DMPlayer.api.path;
				_inject	  = MediaEngine.config.DMPlayer.api.inject;
			break;
			case 'ytplayer':
				_module   = YTPlayer;
				_queue    = YTQueue;
				_id       = 'yt-api';
				_apiPath  = MediaEngine.config.YTPlayer.api.path;
				_inject	  = MediaEngine.config.YTPlayer.api.inject;
			break;
			default:
				log("No type found for '"+type+"' [initPlayer()]");
			break;
		}

		if(!_module.apiLoaded && _inject){ // self mode injected
			if(!_module.apiCalled){
				_module.apiCalled = true;
				Script.load(_apiPath, _id, _callback); // if API isn't loaded and isn't called, call it !
			}
			_queue.push(arguments); // while API isn't loaded, push arguments in the queue
		}else {
			_module.setPlayer(where, options, options.callback); // if API is loaded or external injected, set player
		}

	};

	// Attach API ready event for each API and then start the players initialization
	JWPlayer.events.addListener('onJwpAPIReady', function(){
		for(var i = 0, l = JWQueue.length; i<l; i++){
			MediaEngine.initPlayer.apply(null, JWQueue[i]);
		}
		JWQueue.length = 0;
	});

	DMPlayer.events.addListener('onDailyAPIReady', function(){
		for(var i = 0, l = DMQueue.length; i<l; i++){
			MediaEngine.initPlayer.apply(null, DMQueue[i]);
		}
		DMQueue.length = 0;
	});

	YTPlayer.events.addListener('onYoutubeAPIReady', function(){
		for(var i = 0, l = YTQueue.length; i<l; i++){
			MediaEngine.initPlayer.apply(null, YTQueue[i]);
		}
		YTQueue.length = 0;
	});

	/*
	---
	name: MediaEngine Events
	description: Dispatch all api's events on a global event dispatcher
	...
	*/

	MediaEngine.events = new EventCustom();

	// api's events
	JWPlayer.events.addListener('dispatchEvent', function(e, playerEvent, type, api, args){
		MediaEngine.events.fire(playerEvent, type, api, args);
	});

	DMPlayer.events.addListener('dispatchEvent', function(e, playerEvent, type, api, args){
		MediaEngine.events.fire(playerEvent, type, api, args);
	});

	YTPlayer.events.addListener('dispatchEvent', function(e, playerEvent, type, api, args){
		MediaEngine.events.fire(playerEvent, type, api, args);
	});

	/*
	---
	name: MediaEngine Methods
	description: Attach most useful methods on MediaEngine
	...
	*/

	var Methods = {

		dispatch: function(method){
			return function(id, value){

				if(!id){
					log("Player ID not found [Methods.dispatch()]");
					return;
				}

				var _obj = getPlayerObjectById(id);

				if(_obj){

					if(!_obj.type){

						log("object type not found in player object within ID '"+id+"' [Methods.dispatch()]");

					}else if (!_obj.api){

						log("object api not found in player object within ID '"+id+"' [Methods.dispatch()]");

					}else {

						var _cb = Methods[method]( _obj.type, _obj.api, value );

						if(_cb === 'type-notfound'){
							log("method '"+method+"' is not supported for "+_obj.type+" [Methods.dispatch()]");
							return null;
						}else {
							return _cb;
						}

					}
					
				}

			};
		},

		attach: function(){
			for (var i = 0, l = this.methodsArray.length; i<l; i++){
				MediaEngine[ this.methodsArray[i] ] = this.dispatch( this.methodsArray[i] );
			}
		},

		play: function(type, api){
			switch(type){
				case 'JWPlayer':
				case 'DMPlayer':
					api.play();
				break;
				case 'YTPlayer':
					api.playVideo();
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		pause: function(type, api){
			switch(type){
				case 'JWPlayer':
				case 'DMPlayer':
					api.pause();
				break;
				case 'YTPlayer':
					api.pauseVideo();
				break;
				default:
					return 'type-notfound';
				break;
			}
		},


		stop: function(type, api){
			switch(type){
				case 'JWPlayer':
					api.stop();
				break;
				case 'YTPlayer':
					api.stopVideo();
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		seek: function(type, api, value){
			switch(type){
				case 'JWPlayer':
				case 'DMPlayer':
					api.seek( value );
				break;
				case 'YTPlayer':
					api.seekTo( value );
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		mute: function(type, api, value){
			switch(type){
				case 'JWPlayer':
					api.setMute(value);
				break;
				case 'DMPlayer':
					if(value){
						api.setMuted( 1 );
					}else {
						api.setMuted( 0 );
					}
				break;
				case 'YTPlayer':
					if(value){
						api.mute();
					}else {
						api.unMute();
					}
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		setVolume: function(type, api, value){
			switch(type){
				case 'JWPlayer':
				case 'YTPlayer':
					api.setVolume( value );
				break;
				case 'DMPlayer':
					api.setVolume( value / 100 );
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		getDuration: function(type, api){
			switch(type){
				case 'JWPlayer':
				case 'YTPlayer':
					var _d = api.getDuration();
					if(_d === 0){
						_d = -1;
					}
					return _d;
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		getPosition: function(type, api){
			switch(type){
				case 'JWPlayer':
					return api.getPosition();
				break;
				case 'YTPlayer':
					return api.getCurrentTime();
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		getVolume: function(type, api){
			switch(type){
				case 'JWPlayer':
				case 'YTPlayer':
					return api.getVolume();
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		getItemMeta: function(type, api){
			switch(type){
				case 'JWPlayer':
					return api.getPlaylistItem();
				break;
				case 'YTPlayer':
					var _obj = {};
						_obj.file = api.getVideoUrl();
					return _obj;
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		isMuted: function(type, api){
			switch(type){
				case 'JWPlayer':
					return api.getMute();
				break;
				case 'YTPlayer':
					return api.isMuted();
				break;
				default:
					return 'type-notfound';
				break;
			}
		},

		methodsArray: ['play', 'pause', 'stop', 'seek', 'mute', 'setVolume', 'getDuration', 'getPosition', 'getVolume', 'getItemMeta', 'isMuted']

	};

	Methods.attach();

})(window);
