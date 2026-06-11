"""Tests voor de AssemblyAI streaming-v3-route (/ws/transcribe-stream).

Dekt de pure event-mapping `map_turn_event` en het WebSocket-berichtcontract
met de frontend (src/lib/services/realtime-stream.ts): types `partial`/`final`/
`error`. Geen live API — de mapping is bewust een pure functie zodat dit
zonder AssemblyAI-verbinding testbaar is.

Achtergrond: met format_turns=True stuurt AssemblyAI per turn eerst een
ongeformatteerde end_of_turn-event en daarna een geformatteerde herhaling.
Alleen die laatste mag een "final" worden, anders ziet de frontend dezelfde
turn twee keer (verdubbelde liveSegments).
"""
import json

import pytest

from routes.transcribe_ws import FORMAT_TURNS, map_turn_event


class TestMapTurnEventEmptyTranscript:
    """Lege transcripts worden overgeslagen, ongeacht de turn-status."""

    def test_empty_partial_returns_none(self):
        assert map_turn_event("", end_of_turn=False, turn_is_formatted=False) is None

    def test_empty_final_returns_none(self):
        assert map_turn_event("", end_of_turn=True, turn_is_formatted=True) is None


class TestMapTurnEventWithFormatting:
    """Gedrag met format_turns=True (de productie-instelling)."""

    def test_mid_turn_is_partial(self):
        result = map_turn_event(
            "iech bin gister", end_of_turn=False, turn_is_formatted=False, format_turns=True
        )
        assert result == {"type": "partial", "text": "iech bin gister"}

    def test_unformatted_end_of_turn_is_partial_not_final(self):
        """De eerste (ongeformatteerde) end_of_turn mag GEEN final worden —
        anders krijgt de frontend dezelfde turn twee keer."""
        result = map_turn_event(
            "iech bin gister nao de maat",
            end_of_turn=True,
            turn_is_formatted=False,
            format_turns=True,
        )
        assert result == {"type": "partial", "text": "iech bin gister nao de maat"}

    def test_formatted_end_of_turn_is_final(self):
        result = map_turn_event(
            "Iech bin gister nao de maat.",
            end_of_turn=True,
            turn_is_formatted=True,
            format_turns=True,
        )
        assert result == {"type": "final", "text": "Iech bin gister nao de maat."}


class TestMapTurnEventWithoutFormatting:
    """Gedrag met format_turns=False (fallback als formattering uitstaat).

    Zonder formattering komt er per turn maar één end_of_turn-event —
    die moet dan wél meteen een final worden, anders komen er nooit finals.
    """

    def test_unformatted_end_of_turn_is_final(self):
        result = map_turn_event(
            "iech bin gister nao de maat",
            end_of_turn=True,
            turn_is_formatted=False,
            format_turns=False,
        )
        assert result == {"type": "final", "text": "iech bin gister nao de maat"}

    def test_mid_turn_is_still_partial(self):
        result = map_turn_event(
            "iech bin", end_of_turn=False, turn_is_formatted=False, format_turns=False
        )
        assert result == {"type": "partial", "text": "iech bin"}


class TestMapTurnEventDefaults:
    """De default volgt de module-constante FORMAT_TURNS."""

    def test_default_matches_format_turns_constant(self):
        explicit = map_turn_event(
            "tekst", end_of_turn=True, turn_is_formatted=False, format_turns=FORMAT_TURNS
        )
        implicit = map_turn_event("tekst", end_of_turn=True, turn_is_formatted=False)
        assert implicit == explicit


class TestMessageContract:
    """Berichtcontract met de frontend (realtime-stream.ts).

    De frontend switcht op `type` en leest `text` (partial/final) of
    `message` (error) — deze vorm mag niet veranderen.
    """

    @pytest.mark.parametrize(
        ("end_of_turn", "turn_is_formatted"),
        [(False, False), (True, False), (True, True)],
    )
    def test_turn_messages_have_exactly_type_and_text(self, end_of_turn, turn_is_formatted):
        result = map_turn_event(
            "tekst", end_of_turn=end_of_turn, turn_is_formatted=turn_is_formatted
        )
        assert set(result.keys()) == {"type", "text"}
        assert result["type"] in ("partial", "final")
        assert isinstance(result["text"], str)

    def test_turn_messages_are_json_serializable(self):
        result = map_turn_event("tekst", end_of_turn=True, turn_is_formatted=True)
        assert json.loads(json.dumps(result)) == result

    def test_error_message_structure(self):
        """Error-berichten (uit on_error in de route) hebben type + message."""
        error = {"type": "error", "message": "AssemblyAI streaming error"}
        parsed = json.loads(json.dumps(error))
        assert parsed["type"] == "error"
        assert set(parsed.keys()) == {"type", "message"}
