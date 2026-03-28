#!/usr/bin/env python3
"""Phase 5: Data Enrichment — enrich biblical and wikidata battle JSON files."""

import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ──────────────────────────────────────────────────────────────
# 1. BIBLICAL BATTLES ENRICHMENT
# ──────────────────────────────────────────────────────────────

biblical_path = os.path.join(BASE, "src/data/biblical-battles.json")
with open(biblical_path, "r") as f:
    biblical = json.load(f)

biblical_enrichments = {
    "bible-cain-abel": {
        "significance": 1,
        "commanders": ["Cain", "Abel"],
    },
    "bible-war-nine-kings": {
        "significance": 2,
        "commanders": ["Chedorlaomer", "Bera of Sodom"],
    },
    "bible-abraham-rescues-lot": {
        "significance": 2,
        "commanders": ["Abraham", "Chedorlaomer"],
        "troopStrength": {"side1": 318},
    },
    "bible-sodom-gomorrah": {
        "significance": 1,
        "commanders": ["God", "Kings of Sodom/Gomorrah"],
    },
    "bible-jacob-wrestles-god": {
        "significance": 2,
        "commanders": ["Jacob", "Angel of the Lord"],
    },
    "bible-simeon-levi-shechem": {
        "significance": 3,
        "commanders": ["Simeon/Levi", "Hamor/Shechem"],
    },
    "bible-ten-plagues": {
        "significance": 1,
        "commanders": ["Moses/Aaron", "Pharaoh"],
    },
    "bible-red-sea": {
        "significance": 1,
        "commanders": ["Moses", "Pharaoh"],
        "casualties": {"side2": 600},
        "description": "Pharaoh pursued Israel with six hundred chosen chariots and his entire mounted force. God parted the Red Sea, allowing Israel to cross on dry ground between walls of water. When the Egyptians followed, God threw their army into confusion, clogging chariot wheels. At dawn He released the waters, drowning every soldier. Not one survived.",
    },
    "bible-rephidim": {
        "significance": 2,
        "commanders": ["Joshua/Moses", "Amalekite chieftains"],
    },
    "bible-hormah-defeat": {
        "significance": 3,
        "commanders": ["Rebellious Israelite leaders", "Canaanite/Amalekite chiefs"],
    },
    "bible-hormah-victory": {
        "significance": 3,
        "commanders": ["Moses", "King of Arad"],
    },
    "bible-sihon-amorites": {
        "significance": 2,
        "commanders": ["Moses", "Sihon"],
    },
    "bible-og-bashan": {
        "significance": 2,
        "commanders": ["Moses", "Og"],
    },
    "bible-war-midian": {
        "significance": 2,
        "commanders": ["Phinehas", "Five Midianite Kings"],
        "troopStrength": {"side1": 12000},
    },
    "bible-jericho": {
        "significance": 1,
        "commanders": ["Joshua", "King of Jericho"],
        "description": "Israel marched around Jericho once daily for six days in eerie silence, then seven times on the seventh day. The priests blew rams' horn trumpets, the people raised a deafening war cry, and the massive walls collapsed outward. Israel devoted the city to total destruction; only Rahab the prostitute and her family survived, sheltered because she had hidden Israel's spies.",
    },
    "bible-ai-defeat": {
        "significance": 3,
        "commanders": ["Joshua", "King of Ai"],
        "casualties": {"side1": 36},
    },
    "bible-ai-victory": {
        "significance": 3,
        "commanders": ["Joshua", "King of Ai"],
        "troopStrength": {"side1": 30000},
        "casualties": {"side2": 12000},
    },
    "bible-gibeon-sun-stands-still": {
        "significance": 1,
        "commanders": ["Joshua", "Adonizedek"],
        "description": "Five Amorite kings besieged Gibeon for making peace with Israel. Joshua marched all night from Gilgal and caught them off guard at dawn. God hurled enormous hailstones from heaven that killed more than the sword. Then Joshua commanded the sun to stand still over Gibeon and the moon over the Valley of Aijalon, and daylight held for nearly a full day so Israel could complete the rout. There has never been a day like it before or since.",
    },
    "bible-southern-campaign": {
        "significance": 2,
        "commanders": ["Joshua", "Five Amorite Kings"],
    },
    "bible-waters-of-merom": {
        "significance": 2,
        "commanders": ["Joshua", "Jabin of Hazor"],
    },
    "bible-31-kings": {
        "significance": 1,
        "commanders": ["Joshua", "Thirty-one Canaanite Kings"],
    },
    "bible-othniel": {
        "significance": 2,
        "commanders": ["Othniel", "Cushan-Rishathaim"],
    },
    "bible-ehud-moab": {
        "significance": 2,
        "commanders": ["Ehud", "Eglon of Moab"],
        "casualties": {"side2": 10000},
    },
    "bible-shamgar-philistines": {
        "significance": 3,
        "commanders": ["Shamgar", "Philistine raiders"],
        "casualties": {"side2": 600},
    },
    "bible-deborah-barak-sisera": {
        "significance": 2,
        "commanders": ["Deborah/Barak", "Sisera"],
        "troopStrength": {"side1": 10000},
    },
    "bible-gideon-midianites": {
        "significance": 1,
        "commanders": ["Gideon", "Midianite Kings"],
        "troopStrength": {"side1": 300, "side2": 135000},
        "description": "God reduced Gideon's army from 32,000 to just 300 men so that Israel could not boast in its own strength. At night, the 300 surrounded the vast Midianite camp with trumpets, torches hidden inside clay jars, and a battle cry: 'A sword for the Lord and for Gideon!' When the jars shattered and the trumpets blared, God turned the Midianites against each other in blind panic. The rout was total, and Israel pursued the fleeing remnant across the Jordan.",
    },
    "bible-abimelech-shechem": {
        "significance": 3,
        "commanders": ["Abimelech", "Gaal son of Ebed"],
        "casualties": {"total": 1000},
    },
    "bible-abimelech-thebez": {
        "significance": 3,
        "commanders": ["Abimelech", "Citizens of Thebez"],
    },
    "bible-ark-captured": {
        "significance": 1,
        "commanders": ["Hophni/Phinehas", "Philistine generals"],
        "casualties": {"side1": 34000},
    },
    "bible-jephthah-ammonites": {
        "significance": 2,
        "commanders": ["Jephthah", "King of Ammon"],
    },
    "bible-gibeah-civil-war": {
        "significance": 1,
        "commanders": ["Phinehas/Israel's elders", "Benjamin's warriors"],
        "casualties": {"side1": 40000, "side2": 25100},
        "troopStrength": {"side1": 400000, "side2": 26700},
    },
    "bible-jephthah-ephraim": {
        "significance": 2,
        "commanders": ["Jephthah", "Elders of Ephraim"],
        "casualties": {"side2": 42000},
    },
    "bible-samuel-mizpah": {
        "significance": 2,
        "commanders": ["Samuel", "Philistine generals"],
    },
    "bible-samson-lion": {
        "significance": 3,
        "commanders": ["Samson", "Lion"],
    },
    "bible-samson-thirty-ashkelon": {
        "significance": 3,
        "commanders": ["Samson", "Philistines of Ashkelon"],
        "casualties": {"side2": 30},
    },
    "bible-samson-foxes": {
        "significance": 3,
        "commanders": ["Samson", "Philistines"],
    },
    "bible-samson-jawbone": {
        "significance": 2,
        "commanders": ["Samson", "Philistine warriors"],
        "casualties": {"side2": 1000},
    },
    "bible-samson-gaza-gates": {
        "significance": 3,
        "commanders": ["Samson", "Philistines of Gaza"],
    },
    "bible-samson-dagon-temple": {
        "significance": 1,
        "commanders": ["Samson", "Philistine lords"],
        "casualties": {"side1": 1, "side2": 3000},
    },
    "bible-saul-jabesh-gilead": {
        "significance": 2,
        "commanders": ["Saul", "Nahash the Ammonite"],
        "troopStrength": {"side1": 330000},
    },
    "bible-jonathan-michmash": {
        "significance": 2,
        "commanders": ["Jonathan", "Philistine garrison commander"],
        "casualties": {"side2": 20},
    },
    "bible-saul-amalekites": {
        "significance": 2,
        "commanders": ["Saul", "Agag"],
    },
    "bible-david-goliath": {
        "significance": 1,
        "commanders": ["David", "Goliath"],
        "description": "For forty days, the giant Goliath — over nine feet tall in full bronze armor — defied the armies of the living God, demanding single combat while all Israel trembled. The shepherd boy David, armed only with a sling, five smooth stones, and unshakeable faith, ran toward the giant. A single stone sank into Goliath's forehead. David drew the giant's own sword and cut off his head. The Philistine army broke and fled.",
    },
    "bible-david-keilah": {
        "significance": 3,
        "commanders": ["David", "Philistine raiders"],
    },
    "bible-david-philistine-raids": {
        "significance": 3,
        "commanders": ["David", "Various Philistine commanders"],
    },
    "bible-david-ziklag": {
        "significance": 3,
        "commanders": ["David", "Amalekite raiders"],
        "troopStrength": {"side1": 400},
    },
    "bible-mount-gilboa": {
        "significance": 1,
        "commanders": ["Saul/Jonathan", "Philistine generals"],
    },
    "bible-pool-of-gibeon": {
        "significance": 2,
        "commanders": ["Joab", "Abner"],
    },
    "bible-david-captures-jerusalem": {
        "significance": 1,
        "commanders": ["David/Joab", "Jebusite defenders"],
    },
    "bible-baal-perazim": {
        "significance": 2,
        "commanders": ["David", "Philistine commanders"],
    },
    "bible-valley-rephaim-second": {
        "significance": 2,
        "commanders": ["David", "Philistine commanders"],
    },
    "bible-david-ammon-aram": {
        "significance": 2,
        "commanders": ["Joab/David", "Hanun of Ammon/Shobach"],
    },
    "bible-absalom-rebellion": {
        "significance": 2,
        "commanders": ["Joab", "Absalom"],
        "casualties": {"total": 20000},
    },
    "bible-sheba-rebellion": {
        "significance": 3,
        "commanders": ["Joab", "Sheba son of Bichri"],
    },
    "bible-rehoboam-jeroboam-split": {
        "significance": 1,
        "commanders": ["Rehoboam", "Jeroboam"],
        "troopStrength": {"side1": 180000},
    },
    "bible-shishak-invasion": {
        "significance": 2,
        "commanders": ["Pharaoh Shishak", "Rehoboam"],
        "troopStrength": {"side1": 60000},
    },
    "bible-abijah-jeroboam-zemaraim": {
        "significance": 1,
        "commanders": ["Abijah", "Jeroboam"],
        "troopStrength": {"side1": 400000, "side2": 800000},
        "casualties": {"side2": 500000},
    },
    "bible-asa-zerah-ethiopian": {
        "significance": 1,
        "commanders": ["Asa", "Zerah the Ethiopian"],
        "troopStrength": {"side2": 1000000},
    },
    "bible-ahab-aram-first": {
        "significance": 2,
        "commanders": ["Ahab", "Ben-hadad"],
        "troopStrength": {"side1": 232},
    },
    "bible-ahab-aram-aphek": {
        "significance": 2,
        "commanders": ["Ahab", "Ben-hadad"],
        "casualties": {"side2": 127000},
    },
    "bible-jehoshaphat-moab-ammon": {
        "significance": 2,
        "commanders": ["Jehoshaphat", "Coalition of Moab/Ammon/Edom"],
    },
    "bible-ahab-ramoth-gilead": {
        "significance": 2,
        "commanders": ["Ahab/Jehoshaphat", "Ben-hadad of Aram"],
    },
    "bible-elisha-blinded-arameans": {
        "significance": 3,
        "commanders": ["Elisha", "Aramean commander"],
    },
    "bible-jehu-coup": {
        "significance": 1,
        "commanders": ["Jehu", "Joram/Ahaziah"],
    },
    "bible-amaziah-edom": {
        "significance": 3,
        "commanders": ["Amaziah", "Edomite forces"],
        "casualties": {"side2": 20000},
    },
    "bible-amaziah-jehoash-bethshemesh": {
        "significance": 2,
        "commanders": ["Amaziah", "Jehoash of Israel"],
    },
    "bible-fall-samaria": {
        "significance": 1,
        "commanders": ["Shalmaneser V/Sargon II", "Hoshea"],
        "description": "After a grueling three-year siege, the Assyrians breached Samaria's defenses and captured the capital of the northern kingdom. Sargon II deported 27,290 Israelites and scattered them across the Assyrian empire — to Halah, Habor, the Gozan River, and the cities of the Medes. Foreign peoples were resettled in their land. The ten northern tribes of Israel ceased to exist as a nation, fulfilling centuries of prophetic warnings.",
    },
    "bible-sennacherib-jerusalem": {
        "significance": 1,
        "commanders": ["Hezekiah/Angel of Lord", "Sennacherib"],
        "casualties": {"side2": 185000},
    },
    "bible-josiah-megiddo": {
        "significance": 1,
        "commanders": ["Josiah", "Pharaoh Necho II"],
    },
    "bible-babylon-first-siege": {
        "significance": 1,
        "commanders": ["Nebuchadnezzar", "Jehoiakim"],
    },
    "bible-babylon-second-siege": {
        "significance": 1,
        "commanders": ["Nebuchadnezzar", "Jehoiachin"],
        "casualties": {"side2": 10000},
    },
    "bible-fall-jerusalem": {
        "significance": 1,
        "commanders": ["Nebuchadnezzar", "Zedekiah"],
    },
    "bible-esther-purim": {
        "significance": 1,
        "commanders": ["Mordecai/Esther", "Haman"],
        "casualties": {"side2": 75000},
    },
    "bible-maccabean-beth-horon": {
        "significance": 2,
        "commanders": ["Judas Maccabeus", "Seron"],
        "casualties": {"side2": 800},
    },
    "bible-maccabean-emmaus": {
        "significance": 2,
        "commanders": ["Judas Maccabeus", "Gorgias"],
    },
    "bible-maccabean-beth-zur": {
        "significance": 2,
        "commanders": ["Judas Maccabeus", "Lysias"],
    },
    "bible-maccabean-hanukkah": {
        "significance": 1,
        "commanders": ["Judas Maccabeus", "Seleucid garrison"],
    },
    "bible-massacre-innocents": {
        "significance": 1,
        "commanders": ["Herod the Great", "Infants of Bethlehem"],
    },
    "bible-temple-cleansing": {
        "significance": 2,
        "commanders": ["Jesus", "Temple merchants"],
    },
    "bible-gethsemane-arrest": {
        "significance": 1,
        "commanders": ["Judas/Temple guard captain", "Jesus"],
    },
}

for battle in biblical:
    bid = battle["id"]
    if bid in biblical_enrichments:
        enrich = biblical_enrichments[bid]
        for key, val in enrich.items():
            battle[key] = val

with open(biblical_path, "w") as f:
    json.dump(biblical, f, indent=2, ensure_ascii=False)

print(f"Enriched {len(biblical_enrichments)} biblical battles.")

# ──────────────────────────────────────────────────────────────
# 2. WIKIDATA BATTLES ENRICHMENT
# ──────────────────────────────────────────────────────────────

wiki_path = os.path.join(BASE, "src/data/wikidata-battles.json")
with open(wiki_path, "r") as f:
    wiki = json.load(f)

# Tier-1 curated enrichments (provided by user)
tier1_enrichments = {
    "battle-of-thermopylae": {"commanders": ["Leonidas", "Xerxes I"], "troopStrength": {"side1": 7000, "side2": 300000}, "casualties": {"side1": 4000, "side2": 20000}, "warName": "Greco-Persian Wars", "significance": 1},
    "battle-of-marathon": {"commanders": ["Miltiades", "Datis"], "troopStrength": {"side1": 10000, "side2": 25000}, "casualties": {"side1": 192, "side2": 6400}, "warName": "Greco-Persian Wars", "significance": 1},
    "battle-of-cannae": {"commanders": ["Hannibal Barca", "Varro/Paullus"], "troopStrength": {"side1": 50000, "side2": 86000}, "casualties": {"side1": 6000, "side2": 67000}, "warName": "Second Punic War", "significance": 1},
    "battle-of-zama": {"commanders": ["Scipio Africanus", "Hannibal Barca"], "troopStrength": {"side1": 40000, "side2": 50000}, "casualties": {"side1": 4000, "side2": 20000}, "warName": "Second Punic War", "significance": 1},
    "battle-of-gaugamela": {"commanders": ["Alexander the Great", "Darius III"], "troopStrength": {"side1": 47000, "side2": 250000}, "casualties": {"side1": 1200, "side2": 40000}, "warName": "Wars of Alexander", "significance": 1},
    "battle-of-alesia": {"commanders": ["Julius Caesar", "Vercingetorix"], "troopStrength": {"side1": 60000, "side2": 80000}, "casualties": {"side1": 12000, "side2": 12000}, "warName": "Gallic Wars", "significance": 1},
    "battle-of-pharsalus": {"commanders": ["Julius Caesar", "Pompey the Great"], "troopStrength": {"side1": 22000, "side2": 45000}, "casualties": {"side1": 1200, "side2": 15000}, "warName": "Caesar's Civil War", "significance": 1},
    "battle-of-hattin": {"commanders": ["Saladin", "Guy of Lusignan"], "troopStrength": {"side1": 30000, "side2": 20000}, "casualties": {"side2": 17000}, "warName": "Crusades", "significance": 1},
    "siege-of-baghdad": {"commanders": ["Hulagu Khan", "Caliph Al-Musta'sim"], "casualties": {"total": 1000000}, "warName": "Mongol Conquests", "significance": 1},
    "battle-of-ain-jalut": {"commanders": ["Qutuz/Baibars", "Kitbuqa"], "troopStrength": {"side1": 20000, "side2": 20000}, "warName": "Mongol Conquests", "significance": 1},
    "battle-of-austerlitz": {"commanders": ["Napoleon Bonaparte", "Tsar Alexander I/Emperor Francis II"], "troopStrength": {"side1": 73000, "side2": 85000}, "casualties": {"side1": 9000, "side2": 36000}, "warName": "Napoleonic Wars", "significance": 1},
    "battle-of-trafalgar": {"commanders": ["Horatio Nelson", "Pierre-Charles Villeneuve"], "troopStrength": {"side1": 27, "side2": 33}, "casualties": {"side1": 1666, "side2": 13781}, "warName": "Napoleonic Wars", "significance": 1},
    "battle-of-waterloo": {"commanders": ["Wellington/Blücher", "Napoleon Bonaparte"], "troopStrength": {"side1": 118000, "side2": 73000}, "casualties": {"side1": 24000, "side2": 41000}, "warName": "Napoleonic Wars", "significance": 1},
    "battle-of-gettysburg": {"commanders": ["George Meade", "Robert E. Lee"], "troopStrength": {"side1": 85000, "side2": 75000}, "casualties": {"side1": 23000, "side2": 28000}, "warName": "American Civil War", "significance": 1},
    "battle-of-antietam": {"commanders": ["George McClellan", "Robert E. Lee"], "troopStrength": {"side1": 87000, "side2": 45000}, "casualties": {"side1": 12400, "side2": 10700}, "warName": "American Civil War", "significance": 1},
    "battle-of-the-somme": {"commanders": ["Douglas Haig/Ferdinand Foch", "Fritz von Below"], "troopStrength": {"side1": 750000, "side2": 437000}, "casualties": {"side1": 623907, "side2": 465000}, "warName": "World War I", "significance": 1},
    "battle-of-verdun": {"commanders": ["Philippe Pétain", "Crown Prince Wilhelm"], "casualties": {"side1": 377000, "side2": 337000}, "warName": "World War I", "significance": 1},
    "battle-of-stalingrad": {"commanders": ["Vasily Chuikov/Georgy Zhukov", "Friedrich Paulus"], "troopStrength": {"side1": 1143000, "side2": 1040000}, "casualties": {"side1": 479000, "side2": 868000}, "warName": "World War II", "significance": 1},
    "d-day-normandy": {"commanders": ["Dwight Eisenhower", "Erwin Rommel/Gerd von Rundstedt"], "troopStrength": {"side1": 156000, "side2": 50000}, "casualties": {"side1": 12000, "side2": 9000}, "warName": "World War II", "significance": 1},
    "battle-of-midway": {"commanders": ["Chester Nimitz/Raymond Spruance", "Isoroku Yamamoto"], "casualties": {"side1": 307, "side2": 3057}, "warName": "World War II", "significance": 1},
    "battle-of-kursk": {"commanders": ["Georgy Zhukov/Konstantin Rokossovsky", "Erich von Manstein"], "troopStrength": {"side1": 1910000, "side2": 780000}, "casualties": {"side1": 254000, "side2": 200000}, "warName": "World War II", "significance": 1},
    "battle-of-berlin": {"commanders": ["Georgy Zhukov/Ivan Konev", "Helmuth Weidling"], "troopStrength": {"side1": 2500000, "side2": 766000}, "casualties": {"side1": 81000, "side2": 458000}, "warName": "World War II", "significance": 1},
    "attack-on-pearl-harbor": {"commanders": ["Chuichi Nagumo", "Husband Kimmel"], "casualties": {"side1": 64, "side2": 2403}, "warName": "World War II", "significance": 1},
    "battle-of-iwo-jima": {"commanders": ["Holland Smith", "Tadamichi Kuribayashi"], "troopStrength": {"side1": 70000, "side2": 21000}, "casualties": {"side1": 26000, "side2": 21000}, "warName": "World War II", "significance": 1},
}

# Remaining curated battles — add warName and significance 2
remaining_curated = {
    "battle-of-granicus": {"commanders": ["Alexander the Great", "Memnon of Rhodes"], "warName": "Wars of Alexander", "significance": 2},
    "battle-of-issus": {"commanders": ["Alexander the Great", "Darius III"], "warName": "Wars of Alexander", "significance": 1},
    "siege-of-tyre": {"commanders": ["Alexander the Great", "Azemilcus"], "warName": "Wars of Alexander", "significance": 2},
    "battle-of-hydaspes": {"commanders": ["Alexander the Great", "King Porus"], "warName": "Wars of Alexander", "significance": 2},
    "battle-of-trebia": {"commanders": ["Hannibal Barca", "Tiberius Sempronius Longus"], "warName": "Second Punic War", "significance": 2},
    "battle-of-lake-trasimene": {"commanders": ["Hannibal Barca", "Gaius Flaminius"], "warName": "Second Punic War", "significance": 2},
    "battle-of-bibracte": {"commanders": ["Julius Caesar", "Diviciacus of the Helvetii"], "warName": "Gallic Wars", "significance": 3},
    "siege-of-antioch": {"commanders": ["Bohemond of Taranto", "Yaghi-Siyan"], "warName": "First Crusade", "significance": 2},
    "siege-of-jerusalem-1099": {"commanders": ["Godfrey of Bouillon", "Iftikhar ad-Dawla"], "warName": "First Crusade", "significance": 1},
    "siege-of-acre": {"commanders": ["Richard the Lionheart/Philip II", "Saladin"], "warName": "Third Crusade", "significance": 2},
    "battle-of-arsuf": {"commanders": ["Richard the Lionheart", "Saladin"], "warName": "Third Crusade", "significance": 2},
    "battle-of-kalka-river": {"commanders": ["Subutai/Jebe", "Mstislav III of Kiev"], "warName": "Mongol Conquests", "significance": 2},
    "battle-of-mohi": {"commanders": ["Batu Khan/Subutai", "King Béla IV"], "warName": "Mongol Invasion of Europe", "significance": 2},
    "battle-of-legnica": {"commanders": ["Baidar/Kadan", "Henry II the Pious"], "warName": "Mongol Invasion of Europe", "significance": 2},
    "battle-of-jena-auerstedt": {"commanders": ["Napoleon Bonaparte", "Duke of Brunswick"], "warName": "Napoleonic Wars", "significance": 2},
    "battle-of-wagram": {"commanders": ["Napoleon Bonaparte", "Archduke Charles"], "warName": "Napoleonic Wars", "significance": 2},
    "battle-of-borodino": {"commanders": ["Napoleon Bonaparte", "Mikhail Kutuzov"], "warName": "Napoleonic Wars", "significance": 1},
    "battle-of-leipzig": {"commanders": ["Coalition forces", "Napoleon Bonaparte"], "warName": "Napoleonic Wars", "significance": 1},
    "battle-of-fort-sumter": {"commanders": ["P.G.T. Beauregard", "Robert Anderson"], "warName": "American Civil War", "significance": 1},
    "first-battle-of-bull-run": {"commanders": ["P.G.T. Beauregard/Joseph E. Johnston", "Irvin McDowell"], "warName": "American Civil War", "significance": 2},
    "battle-of-shiloh": {"commanders": ["Ulysses S. Grant", "Albert Sidney Johnston/P.G.T. Beauregard"], "warName": "American Civil War", "significance": 2},
    "battle-of-fredericksburg": {"commanders": ["Robert E. Lee", "Ambrose Burnside"], "warName": "American Civil War", "significance": 2},
    "battle-of-chancellorsville": {"commanders": ["Robert E. Lee/Stonewall Jackson", "Joseph Hooker"], "warName": "American Civil War", "significance": 2},
    "siege-of-vicksburg": {"commanders": ["Ulysses S. Grant", "John C. Pemberton"], "warName": "American Civil War", "significance": 1},
    "battle-of-chickamauga": {"commanders": ["Braxton Bragg", "William Rosecrans"], "warName": "American Civil War", "significance": 2},
    "battle-of-atlanta": {"commanders": ["William T. Sherman", "John Bell Hood"], "warName": "American Civil War", "significance": 2},
    "battle-of-appomattox": {"commanders": ["Ulysses S. Grant", "Robert E. Lee"], "warName": "American Civil War", "significance": 1},
    "first-battle-of-the-marne": {"commanders": ["Joseph Joffre", "Helmuth von Moltke the Younger"], "warName": "World War I", "significance": 1},
    "battle-of-passchendaele": {"commanders": ["Douglas Haig", "Crown Prince Rupprecht"], "warName": "World War I", "significance": 2},
    "second-battle-of-the-marne": {"commanders": ["Ferdinand Foch", "Erich Ludendorff"], "warName": "World War I", "significance": 1},
    "meuse-argonne-offensive": {"commanders": ["John J. Pershing", "Georg von der Marwitz"], "warName": "World War I", "significance": 1},
    "invasion-of-poland": {"commanders": ["Walther von Brauchitsch", "Edward Rydz-Śmigły"], "warName": "World War II", "significance": 1},
    "battle-of-france": {"commanders": ["Gerd von Rundstedt/Heinz Guderian", "Maurice Gamelin/Maxime Weygand"], "warName": "World War II", "significance": 1},
    "battle-of-britain": {"commanders": ["Hugh Dowding/Keith Park", "Hermann Göring"], "warName": "World War II", "significance": 1},
    "operation-barbarossa": {"commanders": ["Adolf Hitler/Walther von Brauchitsch", "Joseph Stalin"], "warName": "World War II", "significance": 1},
    "battle-of-el-alamein": {"commanders": ["Bernard Montgomery", "Erwin Rommel"], "warName": "World War II", "significance": 1},
    "battle-of-guadalcanal": {"commanders": ["Alexander Vandegrift", "Harukichi Hyakutake"], "warName": "World War II", "significance": 2},
    "battle-of-the-bulge": {"commanders": ["Dwight Eisenhower/George Patton", "Gerd von Rundstedt"], "warName": "World War II", "significance": 2},
    "battle-of-leyte-gulf": {"commanders": ["William Halsey/Thomas Kinkaid", "Takeo Kurita"], "warName": "World War II", "significance": 1},
    "battle-of-okinawa": {"commanders": ["Simon Bolivar Buckner Jr.", "Mitsuru Ushijima"], "warName": "World War II", "significance": 1},
}

enriched_count = 0
for battle in wiki:
    bid = battle["id"]
    if bid in tier1_enrichments:
        for key, val in tier1_enrichments[bid].items():
            battle[key] = val
        enriched_count += 1
    elif bid in remaining_curated:
        for key, val in remaining_curated[bid].items():
            # Don't overwrite existing values
            if key not in battle:
                battle[key] = val
            else:
                battle[key] = val
        enriched_count += 1

with open(wiki_path, "w") as f:
    json.dump(wiki, f, indent=2, ensure_ascii=False)

print(f"Enriched {enriched_count} wikidata battles ({len(tier1_enrichments)} tier-1, {len(remaining_curated)} remaining curated).")

# Verify: check which curated battles were NOT enriched
curated_ids = set()
for b in wiki:
    if not b["id"].startswith("wd-Q"):
        curated_ids.add(b["id"])

all_enrichments = set(tier1_enrichments.keys()) | set(remaining_curated.keys())
missing = curated_ids - all_enrichments
if missing:
    print(f"WARNING: {len(missing)} curated battles not enriched: {missing}")
else:
    print("All curated battles enriched.")
