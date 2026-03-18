let selectedPDF = null;
const mapping = {
    'massnahme_bezeichnung': 'massnahme_bezeichnung', 'arbeitsstelle_lage': 'arbeitsstelle_lage',
    'be_name': 'be_name', 'einweisungs_datum': 'einweisungs_datum', 'be_unternehmen': 'be_unternehmen',
    'be_funktion': 'be_funktion', 'be_telefon': 'be_telefon', 'be_mobil': 'be_mobil',
    'av_name': 'av_name', 'av_unternehmen': 'av_unternehmen', 'av_funktion': 'av_funktion',
    'av_mobil': 'av_mobil', 'bemerkungen': 'bemerkungen'
};

const dz = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');
const details = document.getElementById('fileDetails');

// Drag & Drop Event-Listener
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dz.addEventListener(e, x => { x.preventDefault(); x.stopPropagation(); }));
dz.addEventListener('dragover', () => dz.classList.add('dragover'));
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
pdfInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(files) {
    if (files[0] && files[0].type === "application/pdf") {
        selectedPDF = files[0];
        document.getElementById('infoName').textContent = selectedPDF.name;
        document.getElementById('infoSize').textContent = (selectedPDF.size / 1024).toFixed(1) + " KB";
        dz.style.display = "none";
        details.style.display = "block";
    }
}

function resetFile(e) {
    e.stopPropagation();
    selectedPDF = null;
    pdfInput.value = "";
    dz.style.display = "block";
    details.style.display = "none";
}

function clearData() {
    if(confirm("Formular wirklich leeren?")) Object.keys(mapping).forEach(id => document.getElementById(id).value = "");
}

function exportHTML() {
    let name = prompt("Name für den Entwurf:", document.getElementById('be_name').value || "Entwurf");
    if (!name) return;
    let clone = document.documentElement.cloneNode(true);
    Object.keys(mapping).forEach(id => {
        let val = document.getElementById(id).value;
        let el = clone.querySelector(`#${id}`);
        if(el) { el.setAttribute('value', val); if(id === 'bemerkungen') el.textContent = val; }
    });
    const blob = new Blob(["<!DOCTYPE html>\n" + clone.outerHTML], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name.replace(/\s+/g, '_') + ".html";
    a.click();
}

async function createPDF() {
    if (!selectedPDF) return alert("Bitte PDF-Vordruck laden.");
    try {
        const pdfDoc = await PDFLib.PDFDocument.load(await selectedPDF.arrayBuffer());
        const form = pdfDoc.getForm();
        const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        Object.entries(mapping).forEach(([id, pdfName]) => {
            const val = document.getElementById(id).value;
            if (val) {
                try {
                    const field = form.getTextField(pdfName);
                    field.setText(val);
                    field.setFontSize(12);
                    field.enableMultiline();
                    field.updateAppearances(helvetica);
                } catch (e) {
                    console.warn(`Feld ${pdfName} im PDF nicht gefunden.`);
                }
            }
        });

        form.flatten();
        const bytes = await pdfDoc.save();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        a.download = "Final_" + selectedPDF.name;
        a.click();
    } catch (err) { alert("Fehler: " + err.message); }
}