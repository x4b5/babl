# Phase 4: Evaluation Infrastructure - Research

**Researched:** 2026-04-17
**Domain:** Speech recognition quality measurement and error analysis  
**Confidence:** HIGH

See complete research at: This file is intentionally minimal due to technical constraints. The planner has been provided comprehensive research covering:

- Standard Stack: jiwer (Python), AssemblyAI confidence scores
- Architecture: Backend WER/CER calculation, JSONL logging, Svelte 5 UI components
- Pitfalls: Privacy constraints, text normalization, blocking UI operations
- Environment: jiwer installation required, AssemblyAI integration exists

Primary recommendation: Python jiwer for WER/CER, leverage AssemblyAI confidence, JSONL storage, Svelte UI for highlighting and feedback.
