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

To find all the translations that may currently be missing you can run the following command. Note that this command can have a lot of false positives.

```bash
npm run missing-translations
```

Most of the time you should be able to just pass an api response into the t function.

```ts
t(await response.text());
```

# Adding a Language

1. Add the language to the locales folder as a json.
2. Copy over the de.json and remove all the german text.
3. Add the language to the locales array in the next config file.
4. Start to translate the language(You do not have to translate the langauge fully to add it anything helps).

# Helping Translate

@lukasdotcom does all the german translations but if you want to help translate to another language or want to improve the german translations you can do so by following the steps below.

1. Go to the file in the locales folder with the language you want to translate to.
2. Find any text that currently has an empty translation in the foreign language(Note that the order is alphabetized based on the english part).
3. Translate the text to the language you are translating to.
