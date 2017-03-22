# How to compress a pdf?

You can bring down a pdf from 22MB to 5MB with this.

```
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/printer  -sOutputFile=out.pdf in.pdf
```

### PDF optimization level selection options
```
-dPDFSETTINGS=/screen   (screen-view-only quality, 72 dpi images)
-dPDFSETTINGS=/ebook    (low quality, 150 dpi images)
-dPDFSETTINGS=/printer  (high quality, 300 dpi images)
-dPDFSETTINGS=/prepress (high quality, color preserving, 300 dpi imgs)
-dPDFSETTINGS=/default  (almost identical to /screen)
```

([more](http://milan.kupcevic.net/ghostscript-ps-pdf/))
