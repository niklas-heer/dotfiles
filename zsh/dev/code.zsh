# shellcheck disable=SC2148
######################
# Visual Studio Code
######################

c() {
	if [ -z "$1" ]; then
		code .
	else
		code "$1"
	fi
}
