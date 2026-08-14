"""
~/.config/xonsh/rc.xsh  – interactive xonsh configuration
Mirrors the Nushell/zsh interactive workflow defined in:
  - private_Library/private_Application Support/nushell/env.nu
  - private_Library/private_Application Support/nushell/config.nu
  - dot_zshrc

xonsh remains an interactive alternative; zsh is the login shell.
The oh-my-posh shell segment labels the shell automatically.
"""

import os
import shlex
import subprocess
import tempfile


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cmd_exists(name):
    """Return True if *name* is found somewhere on PATH."""
    return _cmd_path(name) is not None


def _cmd_path(name):
    """Return the executable path for *name* using xonsh's current PATH."""
    for directory in $PATH:
        candidate = os.path.join(directory, name)
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def _run(args):
    """Run an argument vector and return stripped stdout, or '' on error."""
    try:
        return subprocess.check_output(args, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def _make_action_file(prefix):
    """Return the path of a newly created, empty temporary file.

    Uses NamedTemporaryFile so the file is created atomically (no TOCTOU
    race), then closes the fd immediately while keeping the file on disk.
    The external tool will overwrite the contents; we just need a unique,
    pre-existing path to hand it via an environment variable.
    """
    with tempfile.NamedTemporaryFile(prefix=prefix, suffix=".tmp", delete=False) as _fh:
        return _fh.name


# ---------------------------------------------------------------------------
# PATH setup  (order mirrors env.nu / dot_zshrc)
# ---------------------------------------------------------------------------

# chezmoi bin dirs
$PATH.insert(0, $HOME + "/.bin")
$PATH.insert(0, $HOME + "/bin")

# Homebrew  (mirrors: eval "$(/opt/homebrew/bin/brew shellenv)")
$HOMEBREW_PREFIX     = "/opt/homebrew"
$HOMEBREW_CELLAR     = "/opt/homebrew/Cellar"
$HOMEBREW_REPOSITORY = "/opt/homebrew"
for _p in ["/opt/homebrew/bin", "/opt/homebrew/sbin"]:
    if _p not in $PATH:
        $PATH.insert(0, _p)
$INFOPATH = "/opt/homebrew/share/info"

# bun global binaries
_bun_bin = $HOME + "/.bun/bin"
if _bun_bin not in $PATH:
    $PATH.append(_bun_bin)

# cargo
_cargo_bin = $HOME + "/.cargo/bin"
if _cargo_bin not in $PATH:
    $PATH.append(_cargo_bin)

# Go – use plain str locals first; $GOPATH is coerced to EnvPath by xonsh,
# so string-concatenation on it would fail with "list + str".
_go_root = $HOME + "/go"
$GOPATH  = _go_root
$GOBIN   = _go_root + "/bin"
if $GOBIN not in $PATH:
    $PATH.append($GOBIN)

# uv / pipx installed tools
_local_bin = $HOME + "/.local/bin"
if _local_bin not in $PATH:
    $PATH.append(_local_bin)

# Python per-user bin dirs (mirrors dot_zshrc find loop)
_py_lib = $HOME + "/Library/Python"
if os.path.isdir(_py_lib):
    for _ver in os.listdir(_py_lib):
        _py_bin = os.path.join(_py_lib, _ver, "bin")
        if os.path.isdir(_py_bin) and _py_bin not in $PATH:
            $PATH.append(_py_bin)

# container tool (Apple)
if "/usr/local/bin" not in $PATH:
    $PATH.append("/usr/local/bin")

# Nix – essential profile PATH + environment when nix is present
_nix_default_profile = "/nix/var/nix/profiles/default"
_xdg_state_home      = ${...}.get("XDG_STATE_HOME", $HOME + "/.local/state")
_nix_state_profile   = _xdg_state_home + "/nix/profile"
_nix_legacy_profile  = $HOME + "/.nix-profile"
_nix_user_profile    = _nix_state_profile if os.path.exists(_nix_state_profile) else _nix_legacy_profile

if os.path.isfile(_nix_default_profile + "/bin/nix"):
    $NIX_PROFILES = _nix_default_profile + " " + _nix_user_profile

    _nix_data_dirs = _nix_user_profile + "/share:" + _nix_default_profile + "/share"
    # Read via os.environ to get a plain str; ${...}.get("XDG_DATA_DIRS") returns
    # an EnvPath (list) which cannot be concatenated with a str.
    _cur_xdg = os.environ.get("XDG_DATA_DIRS", "")
    $XDG_DATA_DIRS = (
        "/usr/local/share:/usr/share:" + _nix_data_dirs
        if not _cur_xdg
        else _cur_xdg + ":" + _nix_data_dirs
    )

    if not ${...}.get("NIX_SSL_CERT_FILE", ""):
        for _cert in [
            "/etc/ssl/certs/ca-certificates.crt",
            "/etc/ssl/ca-bundle.pem",
            "/etc/ssl/certs/ca-bundle.crt",
            "/etc/pki/tls/certs/ca-bundle.crt",
            _nix_user_profile + "/etc/ssl/certs/ca-bundle.crt",
            _nix_default_profile + "/etc/ssl/certs/ca-bundle.crt",
        ]:
            if os.path.isfile(_cert):
                $NIX_SSL_CERT_FILE = _cert
                break

    for _nix_bin in [_nix_user_profile + "/bin", _nix_default_profile + "/bin"]:
        if _nix_bin not in $PATH:
            $PATH.insert(0, _nix_bin)

# Doom Emacs bin (kept for parity with dot_zshrc)
_doom_bin = $HOME + "/.config/emacs/bin"
if _doom_bin not in $PATH:
    $PATH.append(_doom_bin)


# ---------------------------------------------------------------------------
# Editor
# ---------------------------------------------------------------------------

$EDITOR = "nvim"
$VISUAL = "nvim"


# ---------------------------------------------------------------------------
# Virtualenv prompt suppression  (mirrors dot_zshrc)
# ---------------------------------------------------------------------------

$VIRTUAL_ENV_DISABLE_PROMPT      = "1"
$PYENV_VIRTUALENV_DISABLE_PROMPT = "1"


# ---------------------------------------------------------------------------
# Miscellaneous env
# ---------------------------------------------------------------------------

$BAT_THEME = "Monokai Extended Bright"
$FZF_DEFAULT_OPTS = (
    "--color=fg:#c0caf5,bg:#1e1f29,hl:#bb9af7 "
    "--color=fg+:#FFFFFF,bg+:#1e1f29,hl+:#7dcfff "
    "--color=info:#7aa2f7,prompt:#7dcfff,pointer:#7dcfff "
    "--color=marker:#9ece6a,spinner:#9ece6a,header:#9ece6a"
)

$CARAPACE_BRIDGES = "zsh,fish,bash,inshellisense"


# ---------------------------------------------------------------------------
# Completions
# ---------------------------------------------------------------------------

$COMPLETION_MODE = "menu-complete"
$COMPLETIONS_CONFIRM = True
$COMPLETIONS_DISPLAY = "single"
$COMPLETIONS_MENU_ROWS = 10
$CMD_COMPLETIONS_SHOW_DESC = True
$UPDATE_COMPLETIONS_ON_KEYPRESS = True
$XONSH_PROMPT_AUTO_SUGGEST = True
$AUTO_SUGGEST_IN_COMPLETIONS = True
$MOUSE_SUPPORT = True
$PROMPT_TOOLKIT_COLOR_DEPTH = "DEPTH_24_BIT"
$XONSH_STYLE_OVERRIDES = {
    # Tokyo Night syntax highlighting for xonsh commands and Python expressions.
    "Token.Text": "#c0caf5",
    "Token.Comment": "#565f89 italic",
    "Token.Error": "#ff757f bold",
    "Token.Keyword": "#bb9af7 bold",
    "Token.Keyword.Type": "#7dcfff",
    "Token.Literal.Number": "#ff9e64",
    "Token.Literal.String": "#c3e88d",
    "Token.Literal.String.Escape": "#ffc777 bold",
    "Token.Literal.String.Interpol": "#bb9af7",
    "Token.Name.Attribute": "#7dcfff",
    "Token.Name.Builtin": "#7aa2f7",
    "Token.Name.Class": "#7dcfff bold",
    "Token.Name.Decorator": "#bb9af7",
    "Token.Name.Function": "#7aa2f7",
    "Token.Name.Variable": "#c0caf5",
    "Token.Operator": "#89ddff",
    "Token.Operator.Word": "#bb9af7 bold",
    "Token.Punctuation": "#89ddff",
    "pygments.auto-suggestion": "#565f89 italic",
    "completion-menu": "bg:#1e1f29 #c0caf5",
    "completion-menu.completion": "#c0caf5",
    "completion-menu.completion.current": "bg:#7aa2f7 #1e1f29 bold",
    "completion-menu.meta.completion": "#7dcfff",
    "completion-menu.meta.completion.current": "bg:#7aa2f7 #1e1f29 bold",
    "scrollbar.background": "bg:#1e1f29",
    "scrollbar.button": "bg:#565f89",
}

if _cmd_exists("carapace"):
    exec($(carapace _carapace xonsh))


# ---------------------------------------------------------------------------
# oh-my-posh  (mirrors config.nu: oh-my-posh init nu --config ~/.nheer.omp.yaml)
# ---------------------------------------------------------------------------

_omp_exe = _cmd_path("oh-my-posh")
if _omp_exe:
    _omp_cfg    = $HOME + "/.nheer.omp.yaml"
    # --print emits the full xonsh init script (no embedded `source`).
    # execx() is required instead of exec() so that xonsh $VAR syntax is parsed.
    _omp_script = _run([_omp_exe, "init", "xonsh", "--config", _omp_cfg, "--print"])
    if _omp_script:
        execx(_omp_script)


# ---------------------------------------------------------------------------
# zoxide  (mirrors env.nu zoxide init + config.nu source)
# ---------------------------------------------------------------------------

if _cmd_exists("zoxide"):
    source-bash $(zoxide init bash)


# ---------------------------------------------------------------------------
# atuin  (mirrors env.nu atuin init + config.nu source)
# ---------------------------------------------------------------------------

if _cmd_exists("atuin"):
    source-bash $(atuin init bash --disable-up-arrow)


# ---------------------------------------------------------------------------
# television shell integration
# ---------------------------------------------------------------------------

# Television has no xonsh init target. Its Bash integration uses interactive
# readline-only builtins such as `bind` and `complete`, which source-bash cannot
# import safely. The `tv` command itself remains available normally.


# ---------------------------------------------------------------------------
# Aliases  (mirrors config.nu / dot_zshrc)
# ---------------------------------------------------------------------------

# macOS open wrapper (mirrors: alias m-open = ^open)
aliases["m-open"]      = "open"
aliases["lg"]          = "lazygit"
aliases["newproj"]     = "np new"
aliases["graduateproj"] = "np promote"
aliases["ai"]          = "codex --dangerously-bypass-approvals-and-sandbox"


# ---------------------------------------------------------------------------
# NHT action-file protocol  (mirrors __nht_apply_action / __nht_apply_action_file)
# cd / print / open / exec actions are written by tools to a temp file
# ---------------------------------------------------------------------------

def __nht_apply_action(action_file, status):
    """Apply the action written by an nht-aware tool to *action_file*."""
    if not os.path.isfile(action_file):
        return status

    with open(action_file) as _f:
        action_line = _f.read().strip()
    os.unlink(action_file)

    if status != 0 or not action_line:
        return status

    parts  = action_line.split("\t")
    action = parts[0]
    values = parts[1:]

    if action == "cd":
        dest = values[0] if values else ""
        if dest and os.path.isdir(dest):
            cd @(dest)
        return 0

    if action == "print":
        print("\t".join(values))
        return 0

    if action == "open":
        dest = values[0] if values else ""
        if dest:
            return subprocess.call(["open", dest])
        return status

    if action == "exec":
        if values:
            return subprocess.call(values)
        return status

    import sys
    print(f"Unsupported nht shell action: {action}", file=sys.stderr)
    return 1


def __nht_resolve_command(tool):
    """Resolve a tool alias via the dev-tools register script."""
    result = subprocess.run(
        ["bun", "run", $HOME + "/bin/dev-tools/src/register.ts", "--resolve", tool],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip(), result.returncode


# ---------------------------------------------------------------------------
# nht  – interactive tool launcher  (mirrors def --env nht in config.nu)
# ---------------------------------------------------------------------------

def nht(args, **_):
    if args:
        selection, status = __nht_resolve_command(args[0])
        if status != 0 or not selection:
            return status
        extra_args = list(args[1:])
    else:
        if _cmd_exists("tv"):
            selection = $(tv nht --inline).strip()
        else:
            selection = ""
        extra_args = []

    if not selection:
        return

    parts = shlex.split(selection)
    if not parts:
        return

    action_file    = _make_action_file("nht-action.")
    $NHT_ACTION_FILE = action_file
    try:
        ret = subprocess.call(parts + extra_args)
    finally:
        if "NHT_ACTION_FILE" in ${...}:
            del ${...}["NHT_ACTION_FILE"]

    return __nht_apply_action(action_file, ret)

aliases["nht"] = nht


# ---------------------------------------------------------------------------
# repo  – ghq-style repo opener  (mirrors def --env repo in config.nu)
# ---------------------------------------------------------------------------

def repo(*query):
    action_file      = _make_action_file("nht-action.")
    $NHT_ACTION_FILE = action_file
    try:
        cmd = ["bun", "run", $HOME + "/bin/dev-tools/src/repo/index.ts"] + list(query)
        ret = subprocess.call(cmd)
    finally:
        if "NHT_ACTION_FILE" in ${...}:
            del ${...}["NHT_ACTION_FILE"]

    __nht_apply_action(action_file, ret)

aliases["repo"] = repo


# ---------------------------------------------------------------------------
# np  – new-project wrapper with NP_CD_FILE cd-action  (mirrors def np in config.nu / zshrc)
# ---------------------------------------------------------------------------

def np(*args):
    cd_file    = _make_action_file("np-cd.")
    $NP_CD_FILE = cd_file
    try:
        ret = subprocess.call(["np"] + list(args))
    finally:
        if "NP_CD_FILE" in ${...}:
            del ${...}["NP_CD_FILE"]

    if os.path.isfile(cd_file):
        with open(cd_file) as _f:
            dest = _f.read().strip()
        os.unlink(cd_file)
        if ret == 0 and dest and os.path.isdir(dest):
            cd @(dest)

aliases["np"] = np


# ---------------------------------------------------------------------------
# wtp  – worktree cd wrapper  (mirrors def --env wtp / wtpcd in config.nu)
# ---------------------------------------------------------------------------

def _wtpcd(target=None):
    """cd into the wtp-selected worktree directory."""
    cmd    = ["wtp", "cd"]
    if target:
        cmd.append(target)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        dest = result.stdout.strip()
        if dest and os.path.isdir(dest):
            cd @(dest)


def wtp(*args):
    if not args:
        subprocess.call(["wtp"])
        return

    subcommand = args[0]

    if subcommand == "cd":
        rest = list(args[1:])
        if rest and rest[0] in ("-h", "--help"):
            subprocess.call(["wtp"] + list(args))
            return
        _wtpcd(rest[0] if rest else None)
        return

    subprocess.call(["wtp"] + list(args))

aliases["wtp"] = wtp
aliases["wcd"] = lambda *a: _wtpcd(a[0] if a else None)
