import json

# load section titles
with open("output/section_titles.json", "r") as f:
    section_titles = json.load(f)

# load full text
with open("output/raw_text.txt", "r") as f:
    text = f.read()

sections = []

for i in range(len(section_titles)):
    number = str(section_titles[i]["section_number"])
    title = section_titles[i]["section_title"]

    start_pattern = f"{number}. {title}"
    start = text.find(start_pattern)

    if i < len(section_titles) - 1:
        next_number = str(section_titles[i+1]["section_number"])
        next_title = section_titles[i+1]["section_title"]
        end_pattern = f"{next_number}. {next_title}"
        end = text.find(end_pattern)
    else:
        end = len(text)

    content = text[start:end]

    # remove chapter headings
    if "CHAPTER" in content:
        content = content.split("CHAPTER")[0]

    content = content.strip()

    sections.append({
        "act_name": "Companies Act, 2013",
        "section_number": number,
        "section_title": title,
        "content": content
    })

# save dataset
with open("output/companies_act_dataset.json", "w") as f:
    json.dump(sections, f, indent=4)

print("Final dataset created")
print("Total sections:", len(sections))
