import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#4A6B82"))

        if self._pageNumber > 1:
            self.drawString(
                40,
                11 * 72 - 28,
                "SYNAPSEPLAY | Age-Specific Clinical Protocols & Activity Blueprint (4-12 Years)",
            )
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 11 * 72 - 32, 8.5 * 72 - 40, 11 * 72 - 32)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        page_text = f"Σελίδα {self._pageNumber} από {page_count}"
        self.drawRightString(8.5 * 72 - 40, 24, page_text)
        self.drawString(
            40,
            24,
            "SYNAPSEPLAY — Age-Graded Protocols & Device-Time Specification | Confidential",
        )
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 32, 8.5 * 72 - 40, 32)

        self.restoreState()


def build_pdf(output_path: str = "SynapsePlay_Age_Specific_Protocols_4_12.pdf") -> None:
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    c_primary = colors.HexColor("#1E293B")
    c_accent = colors.HexColor("#2E7D32")
    c_slate = colors.HexColor("#334155")
    c_border = colors.HexColor("#CBD5E1")
    c_bg_light = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=c_accent,
        spaceAfter=8,
    )
    h1_style = ParagraphStyle(
        "H1Style",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )
    h2_style = ParagraphStyle(
        "H2Style",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=12,
        textColor=c_slate,
        spaceAfter=4,
    )
    bullet_style = ParagraphStyle(
        "BulletStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11.5,
        textColor=c_slate,
        leftIndent=10,
        spaceAfter=2,
    )
    table_header_style = ParagraphStyle(
        "THStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )
    table_cell_style = ParagraphStyle(
        "TDStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=c_slate,
    )

    story = []
    story.append(Paragraph("SYNAPSEPLAY | Age-Graded ADHD Protocols (4–12 Ετών)", title_style))
    story.append(
        Paragraph(
            "Εξειδικευμένα Πρωτόκολλα Εργοθεραπείας, Λογοθεραπείας & Συστάσεις Συσκευής / Χρόνου",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceAfter=8))

    story.append(
        Paragraph(
            '1. Στρατηγική Συσκευής & Χρόνου: Γιατί Tablet 10" Kiosk Mode & Όχι Κινητό ή PC',
            h1_style,
        )
    )
    story.append(
        Paragraph(
            "<b>Η Παγίδα των Κινητών:</b> Τα smartphones έχουν μικρή επιφάνεια αφής που αυξάνει τα παρορμητικά clicks, στενή οπτική γωνία που ευνοεί τον «υπνωτισμό» (zombie scrolling) και συνδέονται στο μυαλό του παιδιού με άμεση έκκριση ντοπαμίνης.<br/>"
            "<b>Το Εμπόδιο του Υπολογιστή:</b> Το ποντίκι και το πληκτρολόγιο απαιτούν υψηλό βαθμό οπτικοκινητικού συντονισμού που σε παιδιά 4-8 ετών δημιουργεί γνωστική υπερφόρτωση (cognitive overload) πριν καν ξεκινήσει η δραστηριότητα.<br/>"
            "<b>Η Βέλτιστη Λύση:</b> <b>Tablet 10-11 ιντσών σε οριζόντια σταθερή βάση γραφείου (Kiosk Mode / Guided Access).</b> "
            "Προσφέρει φυσικό μέγεθος στόχων (64px+), εργονομική απόσταση 40 εκ. από τα μάτια, χρήση και των δύο χεριών και αδυναμία εξόδου σε άλλες εφαρμογές.",
            body_style,
        )
    )

    time_data = [
        [
            Paragraph("Ηλικιακή Ομάδα", table_header_style),
            Paragraph("Μέγιστος Χρόνος Οθόνης", table_header_style),
            Paragraph("Δομή Συνεδρίας (Split)", table_header_style),
            Paragraph("Τρόπος Αλληλεπίδρασης", table_header_style),
        ],
        [
            Paragraph("<b>4–5 ετών</b>", table_cell_style),
            Paragraph("7–10 λεπτά", table_cell_style),
            Paragraph("3' Ψηφιακό + 5' Φυσικό παιχνίδι + 2' Smooth Landing", table_cell_style),
            Paragraph("Μεγάλα εικονογράμματα, φωνητική οδηγία, 0 κείμενο", table_cell_style),
        ],
        [
            Paragraph("<b>5–6 ετών</b>", table_cell_style),
            Paragraph("10–12 λεπτά", table_cell_style),
            Paragraph("5' Γνωστικό + 5' Κίνηση/Αντικείμενα + 2' Landing", table_cell_style),
            Paragraph("Touch-only, 1 κουμπί ανά οθόνη, άμεση ανατροφοδότηση", table_cell_style),
        ],
        [
            Paragraph("<b>6–8 ετών</b>", table_cell_style),
            Paragraph("12–15 λεπτά", table_cell_style),
            Paragraph("8' Εστίαση/Μνήμη + 5' Κατασκευή + 2' Landing", table_cell_style),
            Paragraph("Touch & Drag, εικονογραφήσεις + λέξεις-κλειδιά", table_cell_style),
        ],
        [
            Paragraph("<b>8–10 ετών</b>", table_cell_style),
            Paragraph("15–18 λεπτά", table_cell_style),
            Paragraph("10' Στρατηγική/Κανόνες + 5' Σχεδιασμός + 3' Landing", table_cell_style),
            Paragraph("Πολυεπίπεδοι στόχοι, επιλογή στρατηγικής βοήθειας", table_cell_style),
        ],
        [
            Paragraph("<b>10–12 ετών</b>", table_cell_style),
            Paragraph("20 λεπτά (Max)", table_cell_style),
            Paragraph("14' Σύνθετη επίλυση + 4' Οργάνωση ρουτίνας + 2' Landing", table_cell_style),
            Paragraph("Αυξημένη αυτονομία, σχεδιασμός βημάτων, χαρτογράφηση", table_cell_style),
        ],
    ]
    t_time = Table(time_data, colWidths=[80, 100, 180, 180])
    t_time.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), c_primary),
                ("GRID", (0, 0), (-1, -1), 0.5, c_border),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg_light]),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(t_time)
    story.append(Spacer(1, 8))

    doc.build(story, canvasmaker=NumberedCanvas)
    print("Age-Specific Protocols PDF Generated.")


if __name__ == "__main__":
    build_pdf()
