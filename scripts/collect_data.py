#!/usr/bin/env python3
"""
scripts/collect_data.py
Utility to format audio-text pairs into a Hugging Face compatible dataset for Whisper fine-tuning.
"""
import os
import json
import argparse
from pathlib import Path

def create_dataset_structure(output_dir: str):
    output_path = Path(output_dir)
    (output_path / "audio").mkdir(parents=True, exist_ok=True)
    return output_path

def main():
    parser = argparse.ArgumentParser(description="Collect and format data for Whisper fine-tuning.")
    parser.add_argument("--input", required=True, help="Directory containing audio files and .txt transcriptions")
    parser.add_argument("--output", default="dataset_limburgs", help="Output directory for the formatted dataset")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = create_dataset_structure(args.output)
    
    metadata = []
    
    # Supported extensions
    audio_exts = {".wav", ".mp3", ".m4a", ".webm"}
    
    for audio_file in input_path.iterdir():
        if audio_file.suffix.lower() in audio_exts:
            txt_file = audio_file.with_suffix(".txt")
            if txt_file.exists():
                with open(txt_file, "r") as f:
                    transcription = f.read().strip()
                
                # Copy audio or symlink
                target_audio = output_path / "audio" / audio_file.name
                if not target_audio.exists():
                    os.link(audio_file, target_audio)
                
                metadata.append({
                    "file_name": f"audio/{audio_file.name}",
                    "transcription": transcription
                })
                print(f"Added: {audio_file.name}")
    
    # Save metadata.jsonl (Hugging Face format)
    with open(output_path / "metadata.jsonl", "w") as f:
        for entry in metadata:
            f.write(json.dumps(entry) + "\n")
            
    print(f"\nDone! Dataset created at {output_path}")
    print(f"Total samples: {len(metadata)}")
    print("\nNext step: Use this directory with the training script.")

if __name__ == "__main__":
    main()
