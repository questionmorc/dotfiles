#!/usr/bin/env bash
set -x

systemctl --user start swww-daemon.service
systemctl --user start hypridle.service
nm-applet --indicator &

# idle
# swayidle -w timeout 600 "swaylock" before-sleep "swaylock" & # lock screen after 10 min of idle
# swayidle -w timeout 1200 "systemctl hibernate" &             # hibernate after 20 mins of idle

swww img ~/wallpapers/batman.png &
# dunst &
