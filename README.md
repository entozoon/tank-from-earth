# Tank From Earth

Tank controlled by mobile device orientation via its own WIFI AP node server running on an Onion Omega2.

## Setup Omega
"Why is this so complicated?"
..

### Connect fresh Omega to the internet to install stuff
Sod all the web interface stuff, just connect to it's wifi using a laptop with pass:
	12345678
Then SSH straight into it:
	192.168.3.1
	root
	onioneer

From here we can connect it to a proper house wifi
	wifisetup

### Connect to omega2 via the house wifi
SSH into Omega-A3BF (or whatever last 4 bold digits on the chip) or actual IP, see router.

### Install node and stuff
	opkg update
	opkg install nodejs
	opkg install nano
	df -h
	cd /root
	mkdir tank-from-earth
	cd tank-from-earth
	wget https://raw.githubusercontent.com/entozoon/tank-from-earth/master/server.js
	chmod -R 755 /root/tank-from-earth

### Remove house wifi connection so it boots into AP mode
Not entirely sure if this is at all necessary as it can possibly run AP mode and also be connected to house WIFI.. passing it through. Dead hard to test though and I doubt it because ESP8266s can't. ANYWAYS

Let's change the SSID and also remove all encryption while we're at it, because we're grownups now.. If baddies come within hacking range we'll frickin' chin 'em.
	uci set wireless.@wifi-iface[0].key=
	uci set wireless.@wifi-iface[0].ssid=tank-from-earth
	uci set wireless.@wifi-iface[0].encryption=none
	uci set wireless.@wifi-iface[0].ApCliEnable='0'
	uci commit wireless
	uci show wireless
	halt
Turn it off and on then connect to its updated WIFI AP after a little while.

(Maybe this too, probably not though:)
	wifisetup remove -ssid Zyke

### Allow it to be accessible at port 80
SSH back into the Omega now in its AP mode, as earlier on, at:
	192.168.3.1
Free up port 80 (used by the default web interface) by editing:
	nano /etc/config/uhttpd
Change the two occurrences of 80 to 81. Boom.
	halt (off and on)

### Run the node server manually
	cd tank-from-earth
	node server

Boom, accessible now via device's WIFI at:
	http://192.168.3.1

### Make it run on startup for the win!
	chmod 755 /etc/rc.local
	nano /etc/rc.local
Before exit, add:
	sh /root/tank-from-earth/run.sh &

And to stop it, you'd be like
	killall node

NOTE: rc.local doesn't seem to be kicking in!? Docs wrong maybe? I mean, it does run but .. node isn't hitting it off. Can't be permissions. ERM

### TODO
Now, if I could just make it automatically load that URL when you connect to the WIFI, oh boy!
