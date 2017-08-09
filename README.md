# Tank From Earth

Tank controlled by mobile device orientation via its own WIFI AP node server running on an Onion Omega2.

## Setup Omega2
"Why is this so complicated?"
..

### Connect fresh omega2 to the internet to install shit.
Fuck all the web stuff, just connect to it's wifi using a laptop with pass:
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

### Remove house wifi connection so it boots into AP mode
	wifisetup list
	wifisetup remove -ssid Zyke
	wifisetup list
	sudo reboot


### Run the node server
	node server
http://192.168.0.30:8081
