# shellcheck disable=SC2148

# Defines transfer alias and provides easy command line file and folder sharing.
#
# source: https://gist.github.com/nl5887/a511f172d3fb3cd0e42d
#
# Authors:
#   Remco Verhoef <remco@dutchcoders.io>
#

transfer() {
	# check if curl is installed
	if ! curl --version >/dev/null 2>&1; then
		echo "Could not find curl."
		return 1
	fi

	# check arguments
	if [ $# -eq 0 ]; then
		printf "No arguments specified. Usage:\necho transfer /tmp/test.md\ncat /tmp/test.md | transfer test.md"
		return 1
	fi

	# get temporarily filename, output is written to this file show progress can be showed
	tmpfile=$(mktemp -t transferXXX)

	# upload stdin or file
	file=$1

	if tty -s; then
		basefile=$(basename "$file" | sed -e 's/[^a-zA-Z0-9._-]/-/g')

		if [ ! -e "$file" ]; then
			echo "File $file doesn't exists."
			return 1
		fi

		if [ -d "$file" ]; then
			# zip directory and transfer
			zipfile="$(mktemp -t transferXXX.zip)"
			# shellcheck disable=SC2086
			cd "$(dirname $file)" && zip -r -q - "$(basename $file)" >>"$zipfile"
			curl --progress-bar --upload-file "$zipfile" "https://transfer.sh/$basefile.zip" >>"$tmpfile"
			rm -f "$zipfile"
		else
			# transfer file
			curl --progress-bar --upload-file "$file" "https://transfer.sh/$basefile" >>"$tmpfile"
		fi
	else
		# transfer pipe
		curl --progress-bar --upload-file "-" "https://transfer.sh/$file" >>"$tmpfile"
	fi

	# cat output link
	cat "$tmpfile"

	# cleanup
	rm -f "$tmpfile"
}
