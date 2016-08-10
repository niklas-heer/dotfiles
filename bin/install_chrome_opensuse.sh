# Install Chrome

## Add Key
echo "[INFO] Adding pgp key..."
wget https://dl.google.com/linux/linux_signing_key.pub
sudo rpm --import linux_signing_key.pub

## Add Repository
echo "[INFO] Adding the repository..."
sudo zypper ar http://dl.google.com/linux/chrome/rpm/stable/x86_64 Google-Chrome
sudo zypper ref

## Install Google Chrome
echo "[INFO] Installing Google Chrome (stable)..."
sudo zypper in google-chrome-stable

## Cleanup
echo "[INFO] Cleanup..."
rm -f linux_signing_key.pub
