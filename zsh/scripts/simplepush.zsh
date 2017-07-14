###################
# Simplepush
###################

# Simplepush helper - https://simplepush.io/#about
alias sp="simplepush"

simplepush() {
	key="$SIMPLEPUSH_KEY"
	title="$1"
	message="$2"
	e="$3"

	if [ -n "${e}" ]; then
		event="&event=${e}"
	else
		event=""
	fi

	wget --post-data "key=${key}&title=${title}&msg=${message}${event}" https://api.simplepush.io/send > /dev/null 2>&1

	if [ -n "$e" ]; then
		echo "Alert to ${key} with event ${e}: ${title} ${message}"
	else
		echo "Alert to ${key}: ${title} ${message}"
	fi
}

