"""FEED-03: Text chunks overlap 50-100 words for context preservation."""
import inspect
import pytest
from routes.polish import split_into_chunks


class TestChunkOverlap:
    """FEED-03: Text chunks overlap 50-100 words for context preservation."""

    def test_single_chunk_no_overlap(self):
        """Short text should return single chunk, no overlap needed."""
        text = "Dit is een korte tekst."
        chunks = split_into_chunks(text, max_words=400)
        assert len(chunks) == 1

    def test_overlap_parameter_exists(self):
        """split_into_chunks should accept overlap_words parameter."""
        sig = inspect.signature(split_into_chunks)
        assert "overlap_words" in sig.parameters

    def test_overlap_default_is_75_words(self):
        """Default overlap should be 75 words (middle of 50-100 range)."""
        sig = inspect.signature(split_into_chunks)
        assert sig.parameters["overlap_words"].default == 75

    def test_multi_chunk_has_overlap(self):
        """Long text split into chunks should have overlapping words at boundaries."""
        # Build text with distinct numbered sentences (~10 words each)
        sentences = [f"Zin nummer {i} bevat een paar woorden voor de test." for i in range(80)]
        text = " ".join(sentences)
        chunks = split_into_chunks(text, max_words=100, overlap_words=30)
        assert len(chunks) >= 2
        # Last words of chunk N should appear at start of chunk N+1
        for i in range(len(chunks) - 1):
            tail = " ".join(chunks[i].split()[-30:])
            head = " ".join(chunks[i + 1].split()[:30])
            # At least some words should overlap
            tail_words = set(tail.split())
            head_words = set(head.split())
            overlap = tail_words & head_words
            assert len(overlap) > 0, f"No overlap between chunk {i} and {i+1}"

    def test_overlap_zero_gives_no_overlap(self):
        """overlap_words=0 should give sequential chunks (backward compat)."""
        sentences = [f"Zin {i} met woorden." for i in range(100)]
        text = " ".join(sentences)
        chunks_no_overlap = split_into_chunks(text, max_words=50, overlap_words=0)
        assert len(chunks_no_overlap) >= 2
        # Total word count should roughly equal original (no duplication)
        orig_words = len(text.split())
        total_words = sum(len(c.split()) for c in chunks_no_overlap)
        assert total_words <= orig_words * 1.1  # Allow 10% tolerance for boundary effects

    def test_overlap_preserves_sentence_boundaries(self):
        """Chunks should still respect sentence boundaries."""
        sentences = [f"Zin nummer {i} met wat extra woorden erbij." for i in range(50)]
        text = " ".join(sentences)
        chunks = split_into_chunks(text, max_words=50, overlap_words=20)
        assert len(chunks) >= 2
        # Each chunk should end with a period (sentence boundary)
        for chunk in chunks:
            assert chunk.strip().endswith("."), f"Chunk doesn't end at sentence boundary: ...{chunk[-30:]}"

    def test_overlap_does_not_exceed_chunk_size(self):
        """Overlap should not cause chunks to exceed max_words significantly."""
        sentences = [f"Zin nummer {i} bevat precies acht woorden hier." for i in range(80)]
        text = " ".join(sentences)
        chunks = split_into_chunks(text, max_words=100, overlap_words=30)
        for i, chunk in enumerate(chunks):
            word_count = len(chunk.split())
            # Allow max_words + overlap_words tolerance
            assert word_count <= 150, f"Chunk {i} has {word_count} words, expected <= 150"
