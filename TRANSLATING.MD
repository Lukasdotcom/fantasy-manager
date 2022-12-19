# Help

When you have a new react component that contains text use the code below to use the translation layer.

```ts
const t = useContext(TranslateContext);
```

When writing text simply pass the text into the t function like below.

```ts
t("Text to translate");
```

If you need to pass in a variable into the text use the following syntax. Where variable is the variable you want to pass in.

```ts
t("Text to translate {variable} {variable1}", { variable, variable1 });
```

# Adding a Language

1. Add the language to the locales folder as a json.
2. Add the language to the locales array in the next config file.
3. Start to translate the language(You do not have to translate the langauge fully to add it anything helps).

# Helping Translate

@lukasdotcom does all the german translations but if you want to help translate to another language you can do so by following the steps below.

1. Go to the file in the locales folder with the language you want to translate to.
2. Find any missing text that is in the german file and add it to the file you are translating to(Note that the order is alphabetized based on the english part).
3. Translate the text to the language you are translating to.
