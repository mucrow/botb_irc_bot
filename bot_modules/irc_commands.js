var bot = require('./irc_bot.js');
var botb_api = require('./botb_api.js');
var config = require('./config.js');
var kudos = require('./commands/kudos.js');
var memory = require('./memory.js');
var request = require('request');

module.exports = {

	/**
	 *	battle
	 *
	 */
	battle: function(info, words) {
		var p = botb_api.request('battle/current');
		return p.then(function(data) {
				var response = [];
				var text = '';
				data.forEach(function(battle) {
					text += battle.title;
					// XXX bit period v entry period stuff
					text += ' :: ' + battle.entry_count + ' entries';
					text += ' :: ' + battle.period + ' period deadline';
					text += ' ' + battle.period_end_date;
					text += ' ' + battle.period_end_time_left;
					text += ' :: final results ' + battle.end_date;
					text += ' ' + battle.end_time_left;
					text += ' :: ' + battle.profile_url;
					response.push(text);
				});
				console.log(response);
				bot.say(channel.info, response);

			},
			function(error) {
				bot.say(channel.info, 'No current Battles teh running! =0');
			});
	},

	/**
	 *	botbr
	 *
	 */
	botbr: function(info, words) {
		var name = words.slice(1).join(' ');
		if (typeof name === 'undefined' || name.length < 2) {
			bot.say(info.channel, 'Moar characters!! =X');
			return;
		}

		var p = botb_api.request('botbr/search/' + name);
		var none_found = 'BotBr no found! =0';

		p.then(function(data) {
			if (data.length == 0) {
				bot.say(info.channel, none_found);
				return;
			}

			var botbr;
			if (data.length > 1) {
				var response;
				var botbrs = [];
				data.forEach(function(botbr_object) {
					botbrs.push(botbr_object.name);
					if (name == botbr_object.name) {
						botbr = botbr_object;
					}
				});

				if (typeof botbr === 'undefined') {
					response = 'Possible matches :: ';
					response += botbrs.join(', ');
					bot.say(info.channel, response);
					return;
				}
			}

			if (data.length == 1) {
				botbr = data[0];
			}

			var response = botbr.name;
			response += ' :: Lvl ' + botbr.level;
			response += ' ' + botbr.class;
			response += ' :: ' + botbr.profile_url;
			bot.say(info.channel, response);
		}).catch(function(error) {
			bot.say(info.channel, none_found);
		});
	},

	/**
	 *	entry
	 *
	 */
	entry: function(info, words) {
		var title = words.slice(1).join(' ');
		var p;
		if (typeof title === 'undefined' || title.length < 2) {
			p = botb_api.request('entry/random');
		} else {
			p = botb_api.request('entry/search/' + title);
		}

		var none_found = 'String "' + title + '" does not match entry %title%;';

		p.then(function(data) {
			if (data.length == 0) {
				bot.say(info.channel, none_found);
				return;
			}

			var entry;
			if (data.length == 1) {
				entry = data[0];
			}

			if (data.length > 1) {
				entry = data[Math.floor(Math.random() * data.length)];
			}

			var response = entry.botbr.name;
			response += ' - ' + entry.title;
			response += ' :: ' + entry.profile_url;
			bot.say(info.channel, response);
		}).catch(function(error) {
			bot.say(info.channel, none_found);
		});
	},

	/**
	 *	help
	 *
	 */
	help: function(info, words) {
		// define command helper texts
		var prefix = config.command_prefix;
		var command_help_text = {
			battle: "Usage: " + prefix + "battle | Aliases: " + prefix + "compo, " + prefix + "b | Returns a list of the current battles taking place.",
			botbr: "Usage: " + prefix + "botbr <botbr> | Returns information about BotBrs whose name matched the query.",
			entry: "Usage: " + prefix + "entry <name> | Returns information about a specific entry.",
			google: "Usage: " + prefix + "google <query> | Aliases: " + prefix + "g | Returns a URL of the Google search of your query.",
			help: "Usage: " + prefix + "help [command] | Aliases: " + prefix + "h | Returns a list of commands, or specific help with a command.",
			image: "Usage: " + prefix + "image <query> | Aliases: " + prefix + "gi, " + prefix + "images | Returns a URL of the Google Images search of your query.",
			imdb: "Usage: " + prefix + "imdb <query> | Aliases: " + prefix + "i | Returns a URL of the IMDB search of your query.",
			levelup: "Usage: " + prefix + "levelup <botbr> | Returns BotBr's current level, current points, calculated points per year, estimated time to level up, estimated time to reach GRAND WIZARD STATUS of level 33, current boons, and calculated boons per year.",
			pix: "Usage: " + prefix + "pix <botbr> | Aliases: " + prefix + "pic | Returns a URL of a picture of the BotBr in the flesh, if one has been submitted.",
			top: "Usage: " + prefix + "top [class] | Returns list of top BotBrs over all or by class.",
			ultrachord: "Usage: " + prefix + "ultrachord <notes> [timbre] | Aliases: " + prefix + "uc," + prefix + "chord | Returns a URL to a .wav file of the notes and timbre provided, in a format such as 'C4 E4 G4 sawtooth'. Available notes range from C0 to B7. If number is omitted it will pick octave 2. Default timbre is sine. Available timbres are sine, sawtooth, square, triangle, and pluck.",
			uptime: "Usage: " + prefix + "uptime | Aliases: " + prefix + "up | Displays how long the bot has been running.",
			wikipedia: "Usage: " + prefix + "wikipedia <query> | Aliases: " + prefix + "wiki, " + prefix + "w | Returns a URL of the Wikipedia search of your query.",
			youtube: "Usage: " + prefix + "youtube <query> | Aliases: " + prefix + "yt, " + prefix + "y | Returns a URL of the YouTube search of your query.",
		};
		// general help or command helper?
		var command_help = false;
		if (words.length > 1) {
			// check for alias
			command_help = bot.alias_check(words[1]);
			// make sure command is defined and available
			if (!bot.command_check(info.channel_type, command_help)) {
				bot.say(info.channel, 'teh command no defined and/or availables  D:');
				return;
			}
		}
		// no command defined for help
		if (command_help === false) {
			// list commands available
			bot.say(info.channel, 'Available commands are: battle, levelup, pix, google, youtube, wikipedia, image, imdb, botbr, entry, top, ultrachord, uptime, help');
			return;
		}
		// finally, give usage definition
		if (typeof command_help_text[command_help] !== 'undefined') {
			// XXX this could dynamically list and append aliases of a command
			bot.say(info.channel, command_help_text[command_help]);
		} 
		else {
			bot.say(info.channel, command_help + ' has no defined help  :C');
		}
	},
	
	/**
	 *	giphy
	 *
	 */
	giphy: function(info, words) {
		bot.say(info.channel, "http://giphy.com/search/" + words.slice(1).join('%20'));
	},

	/**
	 *	google
	 *
	 */
	google: function(info, words) {
		bot.say(info.channel, "https://encrypted.google.com/search?q=" + words.slice(1).join('%20'));
	},

	/**
	 *	image
	 *
	 */
	image: function(info, words) {
		bot.say(info.channel, "https://www.google.com/search?tbm=isch&q=" + words.slice(1).join('%20'));
	},
	
	/**
	 *	imdb
	 *
	 */
	imdb: function(info, words) {
		bot.say(info.channel, "http://www.imdb.com/find?s=all&q=" + words.slice(1).join('%20'));
	},

	/**
	 *	imgur
	 *
	 */
	imgur: function(info, words) {
		bot.say(info.channel, "http://imgur.com/search?q=" + words.slice(1).join('%20'));
	},

	/**
	 * lyceum
	 *
	 */
	lyceum: function(info, words) {
		var title = words.slice(1).join(' ');
		if (typeof title === 'undefined' || title.length < 3) {
			bot.say(info.channel, 'Moar characters!! =X');
			return;
		}

		var p = botb_api.request('lyceum_article/search/' + title);
		var none_found = 'Article no found! =0';

		p.then(function(data) {
			if (data.length == 0) {
				bot.say(info.channel, none_found);
				return;
			}

			var article;
			if (data.length > 1) {
				var response;
				var articles = [];
				data.forEach(function(article_object) {
					articles.push(article_object.title);
					if (title == article_object.title) {
						article = article_object;
					}
				});

				if (typeof article === 'undefined') {
					response = 'Possible matches :: ';
					response += articles.join(', ');
					bot.say(info.channel, response);
					return;
				}
			}

			if (data.length == 1) {
				article = data[0];
			}

			var response = article.title;
			response += ' :: ' + article.profile_url;
			bot.say(info.channel, response);
		}).catch(function(error) {
			bot.say(info.channel, none_found);
		});
	},

	/**
	 *	top
	 *
	 */
	top: function(info, words) {
		var filter = words.slice(1).join(' ');
		var p;
		if (typeof filter === 'undefined' || filter.length < 2) {
			p = botb_api.request('botbr/list/0/5?sort=points&desc=true');
		} else {
			p = botb_api.request('botbr/list/0/5?filters=class~' + filter + '&sort=points&desc=true');
		}

		var none_found = "Couldn't find anything! Did you spell the class right?";
		var response = '';

		return p.then(function(data) {
				if (data.length == 0) {
					bot.say(info.channel, none_found);
					return;
				}

				var botbrs = [];

				var i = 1;
				var esc = '\x03';
				data.forEach(function(botbr_object) {
					if (response !== '') {
						response += ', ';
					}

					response += esc;
					if (i === 1) {
						response += "08,01"
					} else if (i === 2) {
						response += "15,01"
					} else if (i === 3) {
						response += "07,01"
					} else {
						response += "04,01"
					}

					response += botbr_object.name;
					response += ' :: ';
					response += 'Lvl ' + botbr_object.level;
					if (typeof filter === 'undefined' || filter.length < 2) {
						response += ' ' + botbr_object.class;
					}
					i++;
				});
				if (response === '') {
					bot.say(info.channel, none_found);
				} 
				else {
					bot.say(info.channel, response);
				}
			},
			function(error) {
				bot.say(info.channel, none_found);
			});
	},
	
	/**
	 *	kudos info
	 *
	 */
	kudos: function(info, words) {
		bot.say(info.channel, kudos.info(words));
	},

	/**
	 *	kudos minus
	 *
	 */
	kudos_minus: function(info, words) {
		bot.say(info.channel, kudos.minus(words));
	},

	/**
	 *	kudos plus
	 *
	 */
	kudos_plus: function(info, words) {
		bot.say(info.channel, kudos.plus(words));
	},

	/**
	 *	levelup
	 *
	 */
	levelup: function(info, words) {
		// point array for levels (indexes) 0-34.
		var points_array = [
			25,
			34,
			41,
			53,
			73,
			109,
			173,
			284,
			477,
			816,
			1280,
			1922,
			2682,
			3478,
			4331,
			5421,
			6500,
			7677,
			8972,
			10266,
			11677,
			13796,
			16856,
			21799,
			28640,
			36512,
			45596,
			56049,
			72335,
			92645,
			118353,
			245792,
			510494,
			1060247,
			99999999
		];

		// This function is a helper to the main levelup function.
		// it takes a floating point number which represents the number
		// of days ahead of right now. It outputs a string formatted:
		//     x years x months x days
		// Due to the way it's calculated, it takes month lengths, leap years,
		// hell even leap seconds into account. All thanks to Javascript Date.
		function ymd_distance(days) {
			// this is used to convert days into milliseconds for the Date constructor
			var milliseconds_per_day = 24 * 60 * 60 * 1000;
			var current_date = new Date(Date.now());
			var future_date = new Date(Math.round(
				// (ms / d) * d = ms
				current_date.getTime() + (milliseconds_per_day * days)
			));
			// Calculate how many years ahead the future date is.
			// Notice: this can be inaccurate! Example: dec 25th 2015 and 
			//         jan 23rd 2016 would say 1 year apart! We check for
			//         this later in the code however.
			var years = future_date.getUTCFullYear() - current_date.getUTCFullYear();
			// Next we set the current date to its current date + how many years
			// we calculated!
			current_date.setUTCFullYear(current_date.getUTCFullYear() + years);
			// Calculate the number of months ahead the future date is.
			// If the month crosses over the 12th month border, the difference
			// is negative. This is checked for further in the program.
			var months = future_date.getUTCMonth() - current_date.getUTCMonth();
			// If it IS negative, we subtract the months to set the correct month. 
			current_date.setUTCMonth(current_date.getUTCMonth() + months);
			if (months < 0) {
				// if we did get a negative month number, that means we went
				// ahead one year too far earlier. Lets take it back!...
				current_date.setUTCFullYear(current_date.getUTCFullYear() - 1);
				years--;
				// ...and lets get that month out of the negatives!
				months += 12;
			}
			// Lastly, we check the days. Once again, if we cross a month threshold, we will go into the
			// negatives. This is made up for though by checking how many days are in the month at hand, 	
			// and adding that to the negative days. 
			var days = future_date.getUTCDate() - current_date.getUTCDate();
			if (days < 0) {
				// if the days roll over into the next month...
				months--; // we were lied to earlier a la the years calculation
				current_date.setUTCMonth(current_date.getUTCMonth() - 1);
				days += new Date(current_date.getUTCFullYear(), current_date.getUTCMonth() + 1, 0).getDate();
			}
			// Only display the lowest level of day display that you can. This is to save space!
			var formatted_ymd = days + " days";
			if (years > 0) {
				formatted_ymd = years + " years " + months + " months " + formatted_ymd;
			} else if (months > 0) {
				formatted_ymd = months + " months " + formatted_ymd;
			}
			return formatted_ymd;
		}
		// == Target Response ==
		// Points: 55306 - Level: 26 - Points per year: 23139 - 
		// Next level ETA: 0 years 0 months 11 days - 
		// for Level 33: 43 years 5 months 4 days - Boons: 6265 , Boons per year: 2621
		// ==================
		var username = "";
		for (var i = 1; i < words.length; i++) username = username.concat(words[i] + ' ');
		// Get a list of botbrs using the API.
		var botbr_list = botb_api.request('botbr/list?filters=name~' + username);
		return botbr_list.then(function(data) {
			var botbr = data[0];
			var level = parseInt(botbr.level);
			var points = parseInt(botbr.points);
			var boons = parseFloat(botbr.boons);
			// get the current date and the date of the botbr's creation.
			var time_current = Date.now();
			var time_botbr = new Date(botbr.create_date).getTime();
			var milliseconds_per_day = 24 * 60 * 60 * 1000;
			//                         hr   mn   sec  milli
			var botbrs_age = (time_current - time_botbr) / milliseconds_per_day; // in days
			var points_per_day = points / botbrs_age;
			var boons_per_day = boons / botbrs_age;
			var days_until_levelup = (points_array[level + 1] - points) / points_per_day;
			var days_until_level33 = (points_array[33] - points) / points_per_day;
			var levelup = ymd_distance(days_until_levelup);
			var level33 = ymd_distance(days_until_level33);
			var response = "Points: " + points +
				" - Level: " + botbr.level +
				" - Points per year: " + Math.round(points_per_day * 365) +
				" - Next level ETA: " + levelup +
				" - for Level 33: " + level33 +
				" - Boons: " + boons + ", Boons per year: " + Math.round(boons_per_day * 365);
			bot.say(info.channel, response);
		}, function(error) {
			bot.say(info.channel, "BotBr unfound!  :O");
		});
	},

	/**
	 *	pix
	 *
	 */
	pix: function(info, words) {
		var botbr = words.slice(1).join(" ");
		var picurl;

		if (botbr === "") {
			bot.say(info.channel, "00,03 Pox of whose???? 04,01");
			return;
		}

		var fs = require('fs');
		var response;

		return new Promise(function(resolve, reject) {
			fs.readFile("pix.json", "utf-8", function(err, data) {
				if (err) {
					console.log(err);
					bot.say(info.channel, "00,03 Couldn't read pix JSON! 04,01");
				} 
				else {
					console.log("The file was read!");
					JSON.parse(data, function(k, v) {
						if (k.toLowerCase() === botbr.toLowerCase()) {
							picurl = v;
							botbr = k;
						}
					});
					if (picurl != null) {
						bot.say(info.channel, "00,03 Pixies of " + botbr + ": " + picurl + " 04,01");
					} 
					else {
						bot.say(info.channel, "00,03 BotBr not pixelated! 04,01");
					}
				}
			});
		});
	},

	/**
	 *	ultrachord
	 *
	 */
	ultrachord: function(info, words) {
		var ultrachord = require('./commands/ultrachord.js');
		var chat_text = ultrachord.ultrachord(words);
		if (chat_text != null) {
			bot.say(info.channel, info.nick + ": " + chat_text);
		}
	},

	/**
	 *	unknown
	 *
	 */
	unknown: function(info, words) {
		console.log(info.from + ' unknown command');
		bot.say(info.channel, 'you are in need of ' + info.command_prefix + 'help');
	},

	/**
	 *	update_ip
	 *
	 */
	update_ip: function(info, word) {
		// get public facing ip from free service
		request('http://ipinfo.io/ip', function(error, response, body) {
			var host_domain = body.trim() + ':' + config.http.port;
			memory.set('host_domain', host_domain);
			console.log('host domain ' + host_domain + ' saved to memory');
			var request_uri = 'irc_bot' + '/update_ip/' + config.botb_api_key + '/' + host_domain + '.json';
			botb_api.request(request_uri).then(function(data) {
				console.log('battleofthebits.org response:');
				console.log(data);
				bot.say(info.channel, 'irc bot host domain updated');
			},
			function(error) {
				var response = 'battleofthebits.org domain update error';
				console.log(response);
				bot.say(info.channel, response);
			});
		});
	},

	/**
	 *	uptime
	 *
	 */
	uptime: function(info, words) {
		String.prototype.toWWDDHHMMSS = function() {
			var sec_num = parseInt(this, 10); // don't forget the second param
			var days = 0;
			var hours = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours >= 24) {
				days = Math.floor(hours / 24);
				hours = hours % 24;
			}

			var time = days

			if (days == 1) {
				time += " day, "
			} else {
				time += " days, "
			}

			time += hours;
			if (hours == 1) {
				time += " hour, "
			} else {
				time += " hours, "
			}

			time += minutes;
			if (minutes == 1) {
				time += " minute, and "
			} else {
				time += " minutes, and "
			}

			time += seconds;
			if (seconds == 1) {
				time += " second. "
			} else {
				time += " seconds. "
			}
			return time;
		}

		var time = process.uptime();
		var uptime = (time + "").toWWDDHHMMSS();

		bot.say(info.channel, "BotB has been running for " + uptime);
	},
	
	/**
	 *	wikipedia
	 *
	 */
	wikipedia: function(info, words) {
		bot.say(info.channel, "https://en.wikipedia.org/w/index.php?search=" + words.slice(1).join('%20'));
	},

	/**
	 *	youtube
	 *
	 */
	youtube: function(info, words) {
		bot.say(info.channel, "https://www.youtube.com/results?search_query=" + words.slice(1).join('%20'));
	},

};
