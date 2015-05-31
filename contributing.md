# Contributing

- `Node`: v0.10.32

- `Sass`: 3.4.12

```shell
$ gem install sass
$ sass --watch assets/css/style.scss
```

- `JsHint`: v2.7.0

```shell
$ sudo npm -g install jshint
$ jshint assets/js/script.js
```

### Handlebars helper

```liquid
{{{link "See more..." story.url}}}
```

```javascript
Handlebars.registerHelper('link', function(text, url) {
  url = Handlebars.escapeExpression(url);
  text = Handlebars.escapeExpression(text);

  return new Handlebars.SafeString(
    "<a href='" + url + "'>" + text + "</a>"
  );
});
```
