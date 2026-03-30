import re
import json

with open("output/raw_text.txt", "r") as f:
    text = f.read()

# get only the SECTIONS index block
start = text.find("SECTIONS")
end = text.find("CHAPTER II")

section_block = text[start:end]

# extract section numbers and titles
pattern = r"\n\s*(\d+)\.\s*(.+)"

matches = re.findall(pattern, section_block)

sections = []

for number, title in matches:
    sections.append({
        "act_name": "Companies Act, 2013",
        "section_number": number,
        "section_title": title.strip()
    })

with open("output/section_titles.json", "w") as f:
    json.dump(sections, f, indent=4)

print("Section titles extracted:", len(sections))
