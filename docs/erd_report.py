from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import cm

OUTPUT_PATH = "docs/ERD_Report_Updated.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleCenter", parent=styles["Title"], alignment=1))
styles.add(ParagraphStyle(name="H1", parent=styles["Heading1"], spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle(name="H2", parent=styles["Heading2"], spaceBefore=10, spaceAfter=4))
styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], leading=14, spaceAfter=6))
styles.add(ParagraphStyle(name="TableCell", parent=styles["BodyText"], leading=12, fontSize=9))


def add_table(story, rows):
    col_count = len(rows[0])
    if col_count == 2:
        col_widths = [5.5 * cm, 11.5 * cm]
    elif col_count == 3:
        col_widths = [4.5 * cm, 6.0 * cm, 7.0 * cm]
    else:
        col_widths = None

    wrapped_rows = []
    for row in rows:
        wrapped_rows.append([Paragraph(str(cell), styles["TableCell"]) for cell in row])

    table = Table(wrapped_rows, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b3d91")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d0d7de")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 10))


def build():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Bangladesh Thana & Jail Management System",
    )

    story = []

    story.append(Paragraph("Bangladesh Thana & Jail Management System", styles["TitleCenter"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("ERD Explanation and Project Overview", styles["Body"]))

    story.append(Paragraph("1. Project Overview", styles["H1"]))
    story.append(
        Paragraph(
            "This project is a Bangladesh-based Thana and Jail Management System. "
            "It helps the government and police stations keep criminal records, arrests, jail placement, "
            "and online GD (General Diary) submissions in one place.",
            styles["Body"],
        )
    )

    story.append(Paragraph("2. MVP Features", styles["H1"]))
    story.append(
        Paragraph(
            "• Admin registers Thanas and assigns a head officer.<br/>"
            "• Thanas manage officers, criminals, arrests, cases, and jail placement.<br/>"
            "• Citizens register and submit Online GD reports.<br/>"
            "• Thana officers approve or reject GD reports.<br/>"
            "• Criminals can be viewed by location.",
            styles["Body"],
        )
    )

    story.append(Paragraph("3. Users and Scope", styles["H1"]))
    story.append(
        Paragraph(
            "Admin (Government): Registers Thanas, assigns head officers, controls all system setup.<br/>"
            "Thana Head (Officer-in-Charge): Oversees officers, approves GD decisions, and monitors cases.<br/>"
            "Police Officers: Manage criminals, arrests, case files, jail placement, and bail tracking.<br/>"
            "Citizens (General Users): Register, submit Online GD, and view criminal locations.",
            styles["Body"],
        )
    )

    story.append(Paragraph("4. Real-Life Use Case Flow", styles["H1"]))
    story.append(
        Paragraph(
            "1) Admin creates a Thana and assigns its head officer.<br/>"
            "2) Thana adds officers and registers criminals.<br/>"
            "3) If a criminal is arrested, an arrest record is created and linked to a case.<br/>"
            "4) If the criminal is jailed, incarceration and cell records are assigned.<br/>"
            "5) If bail is granted, a bail record is stored.<br/>"
            "6) Citizens submit Online GD; Thana reviews and approves or rejects it.<br/>"
            "7) Citizens can see criminal locations based on recorded sightings.",
            styles["Body"],
        )
    )

    story.append(Paragraph("5. ER Diagram Summary", styles["H1"]))
    story.append(
        Paragraph(
            "The ERD is built with strong entities for core records (Thana, Officer, Criminal, Jail, User). "
            "The only relationship tables are membership and relation tables, which keep links simple and clear.",
            styles["Body"],
        )
    )

    story.append(Paragraph("5.1 Strong vs Weak Entities", styles["H2"]))
    story.append(
        Paragraph(
            "Strong entities: admin, thanas, ranks, officers, locations, users, gd_reports, criminals, "
            "organizations, case_files, jails, cell_blocks, cells, arrest_records, incarcerations, bail_records, criminal_locations.<br/>"
            "Weak entities: none. Every table has its own primary key, so no weak entity is required.",
            styles["Body"],
        )
    )

    story.append(PageBreak())

    story.append(Paragraph("6. Tables and Attributes", styles["H1"]))

    tables = [
        {
            "name": "admin",
            "summary": "Government admins who create Thanas and control system setup.",
            "connected_to": "thanas (created_by_admin_id)",
            "attributes": [
                ("admin_id", "Unique admin ID"),
                ("full_name", "Admin name"),
                ("email", "Admin email"),
            ],
        },
        {
            "name": "thanas",
            "summary": "Police stations in Bangladesh.",
            "connected_to": "admin, officers, gd_reports, criminals, case_files, arrest_records",
            "attributes": [
                ("thana_id", "Unique thana ID"),
                ("name", "Thana name"),
                ("district", "District name"),
                ("address", "Thana address"),
                ("created_by_admin_id", "Admin who created the thana"),
                ("head_officer_id", "Officer in charge"),
            ],
        },
        {
            "name": "ranks",
            "summary": "Police rank list.",
            "connected_to": "officers",
            "attributes": [
                ("rank_code", "Rank identifier"),
                ("rank_name", "Rank name"),
                ("level", "Rank order level"),
            ],
        },
        {
            "name": "officers",
            "summary": "Police officers working in a Thana.",
            "connected_to": "thanas, ranks, gd_reports (approval)",
            "attributes": [
                ("officer_id", "Unique officer ID"),
                ("thana_id", "Officer’s thana"),
                ("rank_code", "Officer’s rank"),
                ("full_name", "Officer name"),
                ("badge_no", "Officer badge number"),
            ],
        },
        {
            "name": "locations",
            "summary": "District and thana area locations.",
            "connected_to": "criminal_locations",
            "attributes": [
                ("location_id", "Unique location ID"),
                ("district", "District name"),
                ("thana_area", "Local thana area"),
                ("address", "Address text"),
            ],
        },
        {
            "name": "users",
            "summary": "Citizens who register and use Online GD.",
            "connected_to": "gd_reports",
            "attributes": [
                ("user_id", "Unique user ID"),
                ("full_name", "User name"),
                ("nid_number", "National ID number"),
                ("phone", "User phone"),
                ("address", "User address"),
                ("email", "User email"),
                ("password_hash", "Password hash for login"),
            ],
        },
        {
            "name": "gd_reports",
            "summary": "Online GD submissions by citizens.",
            "connected_to": "users, thanas, officers (approval)",
            "attributes": [
                ("gd_id", "Unique GD ID"),
                ("user_id", "User who submitted"),
                ("thana_id", "Assigned thana"),
                ("submitted_at", "Submission time"),
                ("description", "GD description"),
                ("status", "GD status"),
                ("approved_by_officer_id", "Officer who approved"),
            ],
        },
        {
            "name": "criminals",
            "summary": "Criminal profiles managed by Thanas.",
            "connected_to": "thanas, case_files, arrest_records, criminal_organizations, criminal_relations, criminal_locations",
            "attributes": [
                ("criminal_id", "Unique criminal ID"),
                ("full_name", "Criminal name"),
                ("nid_or_alias", "NID or alias"),
                ("status", "Custody status"),
                ("risk_level", "Risk level 1–10"),
                ("registered_thana_id", "Thana that registered"),
            ],
        },
        {
            "name": "organizations",
            "summary": "Criminal organizations or gangs.",
            "connected_to": "criminal_organizations",
            "attributes": [
                ("org_id", "Unique organization ID"),
                ("name", "Organization name"),
                ("ideology", "Organization ideology"),
                ("threat_level", "Threat level 1–10"),
                ("created_at", "Record creation time"),
            ],
        },
        {
            "name": "criminal_organizations",
            "summary": "Membership table that connects criminals to organizations.",
            "connected_to": "criminals, organizations",
            "attributes": [
                ("criminal_id", "Linked criminal"),
                ("org_id", "Linked organization"),
                ("role", "Role in organization"),
            ],
        },
        {
            "name": "criminal_relations",
            "summary": "Criminal-to-criminal relationship table.",
            "connected_to": "criminals (self-relation)",
            "attributes": [
                ("relation_id", "Unique relation ID"),
                ("criminal_id_1", "First criminal"),
                ("criminal_id_2", "Second criminal"),
                ("relation_type", "Relation type"),
            ],
        },
        {
            "name": "case_files",
            "summary": "Case records for criminals under a Thana.",
            "connected_to": "criminals, thanas",
            "attributes": [
                ("case_id", "Unique case ID"),
                ("case_number", "Case number"),
                ("criminal_id", "Linked criminal"),
                ("thana_id", "Linked thana"),
                ("case_type", "Case type"),
                ("status", "Case status"),
                ("filed_at", "Case filed time"),
            ],
        },
        {
            "name": "jails",
            "summary": "Jail facilities.",
            "connected_to": "cell_blocks, incarcerations",
            "attributes": [
                ("jail_id", "Unique jail ID"),
                ("name", "Jail name"),
                ("district", "Jail district"),
                ("address", "Jail address"),
                ("capacity", "Total capacity"),
            ],
        },
        {
            "name": "cell_blocks",
            "summary": "Blocks inside a jail.",
            "connected_to": "jails, cells",
            "attributes": [
                ("block_id", "Unique block ID"),
                ("jail_id", "Parent jail"),
                ("block_name", "Block name"),
                ("capacity", "Block capacity"),
            ],
        },
        {
            "name": "cells",
            "summary": "Cells inside a block.",
            "connected_to": "cell_blocks, incarcerations",
            "attributes": [
                ("cell_id", "Unique cell ID"),
                ("block_id", "Parent block"),
                ("cell_number", "Cell number"),
                ("capacity", "Cell capacity"),
                ("status", "Cell status"),
            ],
        },
        {
            "name": "arrest_records",
            "summary": "Arrest history for criminals.",
            "connected_to": "criminals, thanas, bail_records, incarcerations",
            "attributes": [
                ("arrest_id", "Unique arrest ID"),
                ("criminal_id", "Arrested criminal"),
                ("thana_id", "Arresting thana"),
                ("arrest_date", "Arrest date"),
                ("bail_due_date", "Bail due date"),
                ("custody_status", "Custody status"),
                ("case_reference", "Case reference"),
            ],
        },
        {
            "name": "incarcerations",
            "summary": "Jail placement for an arrest. (Junction table linking Arrests to Jails/Cells)",
            "connected_to": "arrest_records, jails, cells",
            "attributes": [
                ("incarceration_id", "Unique incarceration ID"),
                ("arrest_id", "Linked arrest"),
                ("jail_id", "Jail where kept"),
                ("cell_id", "Cell assigned"),
                ("admitted_at", "Admit time"),
                ("released_at", "Release time"),
            ],
        },
        {
            "name": "bail_records",
            "summary": "Bail details for an arrest.",
            "connected_to": "arrest_records",
            "attributes": [
                ("bail_id", "Unique bail ID"),
                ("arrest_id", "Linked arrest"),
                ("court_name", "Court name"),
                ("bail_amount", "Bail amount"),
                ("granted_at", "Bail date"),
                ("surety_name", "Surety name"),
                ("status", "Bail status"),
            ],
        },
        {
            "name": "criminal_locations",
            "summary": "Criminals linked to locations for public viewing.",
            "connected_to": "criminals, locations",
            "attributes": [
                ("criminal_location_id", "Unique record ID"),
                ("criminal_id", "Linked criminal"),
                ("location_id", "Linked location"),
                ("noted_at", "Recorded time"),
            ],
        },
    ]

    for table in tables:
        story.append(Paragraph(f"Table: {table['name']}", styles["H2"]))
        story.append(Paragraph(f"Purpose: {table['summary']}", styles["Body"]))
        story.append(Paragraph(f"Connected to: {table['connected_to']}", styles["Body"]))
        rows = [["Attribute", "Purpose"]]
        for attr, desc in table["attributes"]:
            rows.append([attr, desc])
        add_table(story, rows)

        if table["name"] == "incarcerations":
            story.append(Paragraph("<b>Detailed Explanation:</b>", styles["H2"]))
            story.append(Paragraph("<b>Scenario:</b> A criminal is arrested by Thana A and sent to Dhaka Central Jail. The arrest table records the 'event' of the arrest. However, the physical placement in a jail and specific cell is a separate timeline. This 'incarcerations' table manages that placement.", styles["Body"]))
            story.append(Paragraph("<b>Why it is absolutely needed:</b> Arrest and jail placement are not 1:1 in the real world. A person can be arrested but not sent to jail (bailed immediately). Or, one arrest can lead to multiple jail transfers (Jail A -> Jail B). Separate tables prevent data duplication and confusion.", styles["Body"]))

    story.append(PageBreak())

    story.append(Paragraph("7. Relationships (Cardinality)", styles["H1"]))
    relationship_lines = [
        "Admin 1 → N Thanas (Admin creates Thanas)",
        "Thana 1 → N Officers (Officers belong to one Thana)",
        "Rank 1 → N Officers (Each officer has one rank)",
        "Thana 0..1 → 1 Head Officer (Optional head officer)",
        "User 1 → N GD Reports (User submits GD)",
        "Thana 1 → N GD Reports (Thana receives GD)",
        "Officer 0..1 → N GD Reports (Officer approves GD)",
        "Thana 1 → N Criminals (Thana registers criminals)",
        "Criminal 1 → N Case Files (Cases for a criminal)",
        "Criminal 1 → N Arrest Records (Arrest history)",
        "Thana 1 → N Arrest Records (Arrests recorded by thana)",
        "Arrest 1 → N Bail Records (Bail info for an arrest)",
        "Arrest 1 → N Incarcerations (Jail placements)",
        "Cell 0..1 → N Incarcerations (A cell can be used many times over time; an incarceration may or may not have a cell yet)",
        "Jail 1 → N Cell Blocks (Jail structure)",
        "Block 1 → N Cells (Cells inside a block)",
        "Criminal N ↔ N Organizations (Memberships via criminal_organizations)",
        "Criminal N ↔ N Criminal (Relations via criminal_relations)",
        "Criminal 1 → N Locations (Seen in different locations)",
    ]
    for line in relationship_lines:
        story.append(Paragraph(f"• {line}", styles["Body"]))

    story.append(Paragraph("7.1 Participation (Total vs Partial)", styles["H2"]))
    participation_lines = [
        "Thana in Officers is total (every officer must belong to one thana).",
        "Rank in Officers is total (every officer has one rank).",
        "User in GD Reports is total (every GD must have a user).",
        "Thana in GD Reports is total (every GD goes to one thana).",
        "Criminal in Arrest Records is total (every arrest must have a criminal).",
        "Criminal in Case Files is total (every case must have a criminal).",
        "Thana Head is partial (a thana may or may not have a head).",
        "Criminal in Organizations and Criminal Relations is partial (a criminal may have none).",
    ]
    for line in participation_lines:
        story.append(Paragraph(f"• {line}", styles["Body"]))

    story.append(Paragraph("7.2 Chen Cardinality (Left/Right of Diamond)", styles["H2"]))
    story.append(
        Paragraph(
            "For each relation below, the four numbers show minimum and maximum on both sides of the diamond. "
            "Format: LeftEntity (min,max) — Relation — RightEntity (min,max).",
            styles["Body"],
        )
    )

    chen_rows = [
        ["Relation", "Cardinality (Left — Right)", "Why this makes sense"],
        [
            "Cell assigned to Incarceration",
            "Cell (0,*) — assigned_to — Incarceration (0,1)",
            "A cell can host many incarcerations over time; an incarceration may be pending without a cell.",
        ],
        [
            "Admin registers Thana",
            "Admin (1,*) — registers — Thana (1,1)",
            "A thana must be created by exactly one admin; one admin can create many thanas.",
        ],
        [
            "Thana employs Officer",
            "Thana (1,*) — employs — Officer (1,1)",
            "Every officer works for one thana; a thana has many officers.",
        ],
        [
            "Rank assigned to Officer",
            "Rank (1,*) — assigned_to — Officer (1,1)",
            "Each officer has exactly one rank; a rank is shared by many officers.",
        ],
        [
            "Thana headed by Officer",
            "Thana (0,1) — headed_by — Officer (0,1)",
            "A thana may or may not have a head; an officer may or may not be a head.",
        ],
        [
            "User submits GD",
            "User (1,*) — submits — GD_Report (1,1)",
            "Every GD is submitted by exactly one user; a user can submit many GDs.",
        ],
        [
            "Thana receives GD",
            "Thana (1,*) — receives — GD_Report (1,1)",
            "Each GD goes to one thana; a thana receives many GDs.",
        ],
        [
            "Officer approves GD",
            "Officer (0,*) — approves — GD_Report (0,1)",
            "A GD may be pending or approved by one officer; an officer can approve many GDs.",
        ],
        [
            "Thana registers Criminal",
            "Thana (1,*) — registers — Criminal (1,1)",
            "Each criminal is registered by one thana; a thana registers many criminals.",
        ],
        [
            "Criminal has Case",
            "Criminal (1,*) — has — Case_File (1,1)",
            "A case file is for one criminal; a criminal can have multiple cases.",
        ],
        [
            "Criminal has Arrest",
            "Criminal (1,*) — has — Arrest_Record (1,1)",
            "Each arrest record is for one criminal; a criminal can be arrested multiple times.",
        ],
        [
            "Thana records Arrest",
            "Thana (1,*) — records — Arrest_Record (1,1)",
            "An arrest is recorded by one thana; a thana records many arrests.",
        ],
        [
            "Arrest has Bail",
            "Arrest_Record (0,*) — has — Bail_Record (1,1)",
            "A bail record must belong to one arrest; an arrest can have none or many bail updates.",
        ],
        [
            "Arrest has Incarceration",
            "Arrest_Record (0,*) — has — Incarceration (1,1)",
            "An incarceration must belong to one arrest; an arrest may have none or many transfers.",
        ],
        [
            "Jail has Blocks",
            "Jail (1,*) — has — Cell_Block (1,1)",
            "Each block belongs to one jail; a jail has many blocks.",
        ],
        [
            "Block has Cells",
            "Cell_Block (1,*) — has — Cell (1,1)",
            "Each cell belongs to one block; a block has many cells.",
        ],
        [
            "Criminal member of Organization",
            "Criminal (0,*) — member_of — Organization (0,*)",
            "A criminal may have no organization; organizations can have many criminals.",
        ],
        [
            "Criminal related to Criminal",
            "Criminal (0,*) — related_to — Criminal (0,*)",
            "A criminal may have no relations; relations can link many criminals.",
        ],
        [
            "Criminal seen at Location",
            "Criminal (1,*) — seen_at — Location (1,*)",
            "Each record links one criminal and one location; many records can exist over time.",
        ],
    ]
    add_table(story, chen_rows)

    story.append(Paragraph("8. Project Scope", styles["H1"]))
    story.append(
        Paragraph(
            "This scope focuses on core policing and jail management. "
            "It covers Thana operations, criminal records, arrests, jail placement, bail, and citizen GD. "
            "It does not cover advanced surveillance, court workflows, or analytics.",
            styles["Body"],
        )
    )

    doc.build(story)


if __name__ == "__main__":
    build()
