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
    sha256_raw=`sha256sum $1`

    # cut out the unnecessary stuff
    sha256=${sha256_raw:0:64}
    echo $sha256
}

# shortcut for sha256 hash
sha1()
{
    sha1_raw=`sha1sum $1`

    # cut out the unnecessary stuff
    sha1=${sha1_raw:0:40}
    echo $sha1
}

# verify md5
md5check()
{
    if [ $# -eq 0 ]; then
        echo "Usage: md5check <file> <md5 sum>"
    else
        file_md5=`md5 $1`
        check_md5=`echo $2`

        if [ "$file_md5" = "$check_md5" ]
        then
            echo "[MD5 CHECK] File is okay!"
        else
            echo "[MD5 CHECK] File is corrupted!"
        fi
    fi
}

# verify sha256
sha256check()
{
    if [ $# -eq 0 ]; then
        echo "Usage: sha256check <file> <sha256 sum>"
    else
        file_sha256=`sha256 $1`
        check_sha256=`echo $2`

        if [ "$file_sha256" = "$check_sha256" ]
        then
            echo "[SHA256 CHECK] File is okay!"
        else
            echo "[SHA256 CHECK] File is corrupted!"
        fi
    fi
}

# verify sha256
sha1check()
{
    if [ $# -eq 0 ]; then
        echo "Usage: sha1check <file> <sha1 sum>"
    else
        file_sha1=`sha1 $1`
        check_sha1=`echo $2`

        if [ "$file_sha1" = "$check_sha1" ]
        then
            echo "[SHA1 CHECK] File is okay!"
        else
            echo "[SHA1 CHECK] File is corrupted!"
        fi
    fi
}

check() {
    case "$1" in
        "md5")
            md5check $2 $3
            ;;
        "sha256")
            sha256check $2 $3
            ;;
        "sha1")
            sha1check $2 $3
            ;;
        *)
            echo "Function not defined."
            ;;
    esac
}
