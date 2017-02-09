###################
# Git shortcuts
###################
gdis() { git stash save --keep-index; git stash drop }
glcd() {
    # source: https://gist.github.com/azu/8205567
    if [ ! -n "$1" ]; then
        echo "Usage: glcd git://example.com/repo.git"
        return;
    fi

    url=$1

    if [ ! -n "$2" ]; then
        reponame=$(echo $url | awk -F/ '{print $NF}' | sed -e 's/.git$//')
    else
        reponame=$2
    fi

    if [ -d "$reponame" ]; then
        cd $reponame
        return
    fi

    git clone --recursive $url $reponame
    echo "\033[31m=>\033[0m \033[036m$reponame\033[0m"
    cd $reponame
}
