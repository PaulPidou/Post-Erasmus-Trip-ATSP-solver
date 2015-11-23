Run Node.js as a Service on Ubuntu

The core of our new project runs on Node.js. With Node you can write very fast JavaScript programs serverside. It's pretty easy to install Node, code your program, and run it. But how do you make it run nicely in the background like a true server?

Clever chaps will have noticed you can just use the '&' like so:

$ node ./yourprogram.js &
and send your program to the background. But:

if Node ever prints something and your console is closed, the STDOUT no longer exists and yourprogram.js will die
what if the process crashes, what if your server reboots?
Ok, so we needed something more robust. More like a real daemon, one that's recognized by the Operating System as such.

Upstart

Our servers run Ubuntu's latest: Karmic Koala, which packs a pretty decent version of upstart. Upstart will eventually replace the well-known /etc/init.d scripts, and will bring some additional advantages to the table like: speed, health checking, simplicity, etc.

Writing an upstart script

Turns out, writing your own upstart scripts is way easier than building init.d files based on the /etc/skeleton file.

Ok so here's how it looks like; You should store the script in /etc/init/yourprogram.conf, create one for each Node program you write.

description "node.js server"
author      "kvz - http://kevin.vanzonneveld.net"

# used to be: start on startup
# until we found some mounts weren't ready yet while booting:
start on started mountall
stop on shutdown

# Automatically Respawn:
respawn
respawn limit 99 5

script
    # Not sure why $HOME is needed, but we found that it is:
    export HOME="/root"

    exec /usr/local/bin/node /where/yourprogram.js >> /var/log/node.log 2>&1
end script

post-start script
   # Optionally put a script here that will notifiy you node has (re)started
   # /root/bin/hoptoad.sh "node.js has started!"
end script
Wow how easy was that? Told you, upstart scripts are childsplay. In fact they're so compact, you may find yourself changing almost every line cause they contain specifics to our environment.

non-root

Node can do a lot of stuff. Or break it if you're not careful. So you may want to run it as a user with limited privileges. We decided to go conventional and chose www-data.

We found the easiest way was to prepend the Node executable with a sudo like this:

exec sudo -u www-data /usr/local/bin/node
Don't forget to change your export HOME accordingly.

Restarting your Node.js daemon

This is so ridiculously easy..

$ start yourprogram
$ stop yourprogram