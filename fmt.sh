#!/bin/sh
tidy -config tidyrc view.html
#csstidy style.css style.css.tmp && echo >> style.css.tmp && mv style.css.tmp style.css
lightningcss style.css -o style.css.tmp && mv style.css.tmp style.css
js-beautify-py -r -n -t app.js
