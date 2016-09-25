######################
# Hashing Shortcuts
#####################

# shortcut for sha256 hash
md5()
{
    md5_raw=`md5sum $1`

    # cut out the unnecessary stuff
    md5=${md5_raw:0:32}
    echo $md5
}

# shortcut for sha256 hash
sha256()
{
    md5_raw=`sha256sum $1`

    # cut out the unnecessary stuff
    md5=${md5_raw:0:64}
    echo $md5
}

# verify md5
md5_check()
{
	file_md5=`md5 $1`
	check_md5=`echo $2`

	if [ "$file_md5" = "$check_md5" ]
	then
	    echo "[MD5 CHECK] success!"
	else
		echo "[MD5 CHECK] failed!"
	fi
}

# verify sha256
sha256_check()
{
	file_sha256=`sha256 $1`
	check_sha256=`echo $2`

	if [ "$file_sha256" = "$check_sha256" ]
	then
	    echo "[SHA256 CHECK] success!"
	else
		echo "[SHA256 CHECK] failed!"
	fi
}
