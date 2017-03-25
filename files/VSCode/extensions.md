# Extensions

- Get extension list: Terminal `code --list-extensions`
- To install all extensions do the following:

```bash
xargs -0 -n 1 code --install-extension < <(tr \\n \\0 <~/.dotfiles/files/VSCode/extensions.lst)
```
