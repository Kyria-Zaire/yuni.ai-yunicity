"""Internationalization service — FR/EN/DE/ES."""

from __future__ import annotations

from app.core.logging import get_logger

logger = get_logger("i18n")

SUPPORTED_LANGUAGES: dict[str, dict[str, str]] = {
    "fr": {"name": "Francais", "polly_voice": "Lea", "mistral_lang": "francais"},
    "en": {"name": "English", "polly_voice": "Joanna", "mistral_lang": "English"},
    "de": {"name": "Deutsch", "polly_voice": "Vicki", "mistral_lang": "Deutsch"},
    "es": {"name": "Espanol", "polly_voice": "Lupe", "mistral_lang": "espanol"},
}

DEFAULT_LANGUAGE = "fr"

SYSTEM_PROMPT_I18N = (
    "You are Yuni AI, the territorial assistant of {city}. "
    "Always respond in {language}. Never mix languages. "
    "{base_system_prompt}"
)

FIXED_STRINGS: dict[str, dict[str, str]] = {
    "welcome": {
        "fr": "Bienvenue a {city} ! Je suis Yuni.",
        "en": "Welcome to {city}! I'm Yuni.",
        "de": "Willkommen in {city}! Ich bin Yuni.",
        "es": "Bienvenido a {city}! Soy Yuni.",
    },
    "quest_available": {
        "fr": "Nouvelle quete disponible !",
        "en": "New quest available!",
        "de": "Neue Quest verfugbar!",
        "es": "Nueva mision disponible!",
    },
    "error_generic": {
        "fr": "Desole, une erreur est survenue.",
        "en": "Sorry, an error occurred.",
        "de": "Entschuldigung, ein Fehler ist aufgetreten.",
        "es": "Lo siento, se produjo un error.",
    },
}


class I18nService:
    """Handles language detection, string translation, and prompt adaptation."""

    @staticmethod
    def get_language(
        accept_language: str | None = None,
        explicit_lang: str | None = None,
    ) -> str:
        if explicit_lang and explicit_lang in SUPPORTED_LANGUAGES:
            return explicit_lang

        if accept_language:
            for lang_tag in accept_language.split(","):
                lang = lang_tag.split(";")[0].strip()[:2].lower()
                if lang in SUPPORTED_LANGUAGES:
                    return lang

        return DEFAULT_LANGUAGE

    @staticmethod
    def get_polly_voice(language: str) -> str:
        config = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["fr"])
        return config["polly_voice"]

    @staticmethod
    def get_string(key: str, language: str, **kwargs: str) -> str:
        strings = FIXED_STRINGS.get(key, {})
        template = strings.get(language, strings.get("fr", key))
        return template.format(**kwargs) if kwargs else template

    @staticmethod
    def adapt_system_prompt(
        base_prompt: str,
        language: str,
        city: str,
    ) -> str:
        lang_name = SUPPORTED_LANGUAGES.get(
            language, SUPPORTED_LANGUAGES["fr"],
        )["mistral_lang"]
        return SYSTEM_PROMPT_I18N.format(
            city=city,
            language=lang_name,
            base_system_prompt=base_prompt,
        )
