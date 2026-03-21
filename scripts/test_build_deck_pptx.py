import subprocess
import sys
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "build_deck_pptx.py"
OUTPUT = ROOT / "cortege-AI-Agents-Week-long-Hack.pptx"


class BuildDeckPptxTest(unittest.TestCase):
    def test_builds_expected_powerpoint_deck(self):
        if OUTPUT.exists():
            OUTPUT.unlink()

        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=f"deck build failed\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}",
        )
        self.assertTrue(
            OUTPUT.exists(),
            "cortege-AI-Agents-Week-long-Hack.pptx was not created",
        )

        with zipfile.ZipFile(OUTPUT) as archive:
            names = archive.namelist()
            slide_names = [
                name
                for name in names
                if name.startswith("ppt/slides/slide")
                and name.endswith(".xml")
                and ".rels" not in name
            ]
            media_names = [name for name in names if name.startswith("ppt/media/")]

            self.assertEqual(len(slide_names), 8)
            self.assertGreaterEqual(len(media_names), 3)

            slide1 = archive.read("ppt/slides/slide1.xml").decode("utf-8")
            slide2 = archive.read("ppt/slides/slide2.xml").decode("utf-8")
            slide7 = archive.read("ppt/slides/slide7.xml").decode("utf-8")
            slide8 = archive.read("ppt/slides/slide8.xml").decode("utf-8")

            self.assertIn("CORTEGE", slide1)
            self.assertIn("AI Security Companions for Every Household", slide1)
            self.assertIn("$64B", slide2)
            self.assertIn("174 passing tests", slide7)
            self.assertIn("130M", slide8)
            self.assertIn("github.com/taylorparsons/cortege-hackathon", slide8)


if __name__ == "__main__":
    unittest.main()
