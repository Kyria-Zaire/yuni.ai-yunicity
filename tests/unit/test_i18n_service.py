"""Unit tests for I18nService — multi-language support."""

from __future__ import annotations

from app.services.i18n_service import I18nService


class TestLanguageDetection:
    def test_default_language_is_french(self) -> None:
        lang = I18nService.get_language()
        assert lang == "fr"

    def test_explicit_lang_overrides_header(self) -> None:
        lang = I18nService.get_language(
            accept_language="en-US,en;q=0.9",
            explicit_lang="de",
        )
        assert lang == "de"

    def test_accept_language_header_parsed(self) -> None:
        lang = I18nService.get_language(
            accept_language="en-US,en;q=0.9,fr;q=0.8",
        )
        assert lang == "en"

    def test_unsupported_language_falls_back_to_fr(self) -> None:
        lang = I18nService.get_language(
            accept_language="ja-JP,ja;q=0.9",
        )
        assert lang == "fr"

    def test_explicit_unsupported_falls_back_to_fr(self) -> None:
        lang = I18nService.get_language(explicit_lang="zh")
        assert lang == "fr"


class TestStrings:
    def test_get_string_returns_correct_translation(self) -> None:
        s = I18nService.get_string("welcome", "en", city="Reims")
        assert "Welcome" in s
        assert "Reims" in s

    def test_get_string_falls_back_to_fr(self) -> None:
        s = I18nService.get_string("welcome", "xx", city="Reims")
        assert "Bienvenue" in s


class TestPollyVoice:
    def test_polly_voice_matches_language(self) -> None:
        assert I18nService.get_polly_voice("fr") == "Lea"
        assert I18nService.get_polly_voice("en") == "Joanna"
        assert I18nService.get_polly_voice("de") == "Vicki"
        assert I18nService.get_polly_voice("es") == "Lupe"

    def test_polly_voice_unknown_falls_back(self) -> None:
        voice = I18nService.get_polly_voice("xx")
        assert voice == "Lea"


class TestPromptAdaptation:
    def test_system_prompt_adapted_for_english(self) -> None:
        result = I18nService.adapt_system_prompt(
            base_prompt="Help citizens.",
            language="en",
            city="Reims",
        )
        assert "English" in result
        assert "Reims" in result
        assert "Help citizens." in result
