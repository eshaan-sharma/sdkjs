/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";


// Update the changes factory mappings
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_AnnotsContent]	= CChangesPDFDocumentAnnotsContent;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_FieldsContent]	= CChangesPDFDocumentFieldsContent;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_DrawingsContent]	= CChangesPDFDocumentDrawingsContent;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_PagesContent]		= CChangesPDFDocumentPagesContent;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_RotatePage]		= CChangesPDFDocumentRotatePage;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_PageWidth]		= CChangesPDFDocumentPageWidth;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_PageHeight]		= CChangesPDFDocumentPageHeight;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_RecognizePage]	= CChangesPDFDocumentRecognizePage;
AscDFH.changesFactory[AscDFH.historyitem_PDF_Document_SetDocument]      = CChangesPDFDocumentSetDocument;

/**
 * @constructor
 * @extends {AscDFH.CChangesDrawingsContent}
 */
function CChangesPDFDocumentAnnotsContent(Class, Pos, Items, bAdd)
{
    AscDFH.CChangesDrawingsContent.call(this, Class, this.Type, Pos, Items, bAdd);
}
CChangesPDFDocumentAnnotsContent.prototype = Object.create(AscDFH.CChangesDrawingsContent.prototype);
CChangesPDFDocumentAnnotsContent.prototype.constructor = CChangesPDFDocumentAnnotsContent;
CChangesPDFDocumentAnnotsContent.prototype.Type = AscDFH.historyitem_PDF_Document_AnnotsContent;
CChangesPDFDocumentAnnotsContent.prototype.IsContentChange = function(){
    return true;
};

CChangesPDFDocumentAnnotsContent.prototype.Undo = function()
{
    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();

    if (this.IsAdd()) {
        // Undo addition by removing items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsAnnot()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.annots.splice(oDocument.annots.indexOf(oItem), 1);
                oViewer.pagesInfo.pages[nPage].annots.splice(this.Pos, 1);
                if (oItem.IsComment())
                    editor.sync_RemoveComment(oItem.GetId());
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    } else {
        // Undo removal by adding items back
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsAnnot()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.annots.push(oItem);
                oViewer.pagesInfo.pages[nPage].annots.splice(this.Pos, 0, oItem);
                if (oItem.IsComment())
                    editor.sendEvent("asc_onAddComment", oItem.GetId(), oItem.GetAscCommentData());
                oItem.SetDisplay(oDocument.IsAnnotsHidden() ? window["AscPDF"].Api.Objects.display["hidden"] : window["AscPDF"].Api.Objects.display["visible"]);
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentAnnotsContent.prototype.Redo = function()
{
    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();

    if (this.IsAdd()) {
        // Redo addition by adding items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsAnnot()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.annots.push(oItem);
                oViewer.pagesInfo.pages[nPage].annots.splice(this.Pos, 0, oItem);
                if (oItem.IsComment())
                    editor.sendEvent("asc_onAddComment", oItem.GetId(), oItem.GetAscCommentData());
                oItem.SetDisplay(oDocument.IsAnnotsHidden() ? window["AscPDF"].Api.Objects.display["hidden"] : window["AscPDF"].Api.Objects.display["visible"]);
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    } else {
        // Redo removal by removing items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsAnnot()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.annots.splice(oDocument.annots.indexOf(oItem), 1);
                oViewer.pagesInfo.pages[nPage].annots.splice(this.Pos, 1);
                if (oItem.IsComment())
                    editor.sync_RemoveComment(oItem.GetId());
            }
        }
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentAnnotsContent.prototype.private_InsertInArrayLoad = function()
{
    if (this.Items.length <= 0)
        return;

    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();
    let oContentChanges = this.private_GetContentChanges();

    for (let i = 0; i < this.Items.length; ++i) {
        let oItem = this.Items[i];
        let nPage = oItem.GetPage();

        // Adjust position based on content changes
        let nPos = oContentChanges.Check(AscCommon.contentchanges_Add, true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
        if (nPos === false) continue;

        // Ensure position is within bounds
        nPos = Math.min(nPos, oDocument.annots.length);

        // Insert into document annots array
        oDocument.annots.splice(nPos, 0, oItem);

        // Insert into viewer annots array
        let annotsArray = oViewer.pagesInfo.pages[nPage].annots;
        nPos = Math.min(nPos, annotsArray.length);
        annotsArray.splice(nPos, 0, oItem);

        if (oItem.IsComment())
            editor.sendEvent("asc_onAddComment", oItem.GetId(), oItem.GetAscCommentData());

        oItem.SetDisplay(oDocument.IsAnnotsHidden() ? window["AscPDF"].Api.Objects.display["hidden"] : window["AscPDF"].Api.Objects.display["visible"]);
        oViewer.DrawingObjects.resetSelection();
        oItem.AddToRedraw();
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentAnnotsContent.prototype.private_RemoveInArrayLoad = function()
{
    if (this.Items.length <= 0)
        return;

    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();
    let oContentChanges = this.private_GetContentChanges();

    // Remove items in reverse order to maintain indices
    for (let i = this.Items.length - 1; i >= 0; --i) {
        let oItem = this.Items[i];
        let nPage = oItem.GetPage();

        // Adjust position based on content changes
        let nPos = oContentChanges.Check(AscCommon.contentchanges_Remove,  true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
        if (nPos === false) continue;

        oItem.AddToRedraw();
        // Remove from document annots array
        let indexInAnnots = oDocument.annots.indexOf(oItem);
        if (indexInAnnots !== -1)
            oDocument.annots.splice(indexInAnnots, 1);

        // Remove from viewer annots array
        let annotsArray = oViewer.pagesInfo.pages[nPage].annots;
        let indexInPageAnnots = annotsArray.indexOf(oItem);
        if (indexInPageAnnots !== -1)
            annotsArray.splice(indexInPageAnnots, 1);

        if (oItem.IsComment())
            editor.sync_RemoveComment(oItem.GetId());

        oViewer.DrawingObjects.resetSelection();
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentAnnotsContent.prototype.private_GetContentChanges = function() {
    return this.Class.annotsContentChanges;
};

// Similarly, implement classes for Fields and Drawings

/**
 * @constructor
 * @extends {AscDFH.CChangesDrawingsContent}
 */
function CChangesPDFDocumentFieldsContent(Class, Pos, Items, bAdd)
{
    AscDFH.CChangesDrawingsContent.call(this, Class, this.Type, Pos, Items, bAdd);
}
CChangesPDFDocumentFieldsContent.prototype = Object.create(AscDFH.CChangesDrawingsContent.prototype);
CChangesPDFDocumentFieldsContent.prototype.constructor = CChangesPDFDocumentFieldsContent;
CChangesPDFDocumentFieldsContent.prototype.Type = AscDFH.historyitem_PDF_Document_FieldsContent;
CChangesPDFDocumentFieldsContent.prototype.IsContentChange = function(){
    return true;
};

CChangesPDFDocumentFieldsContent.prototype.Undo = function()
{
    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();

    if (this.IsAdd()) {
        // Undo addition by removing items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsForm()) {
                if (oItem.IsWidget()) {
                    let nPage = oItem.GetPage();
                    oItem.AddToRedraw();
                    oDocument.widgets.splice(oDocument.widgets.indexOf(oItem), 1);
                    oViewer.pagesInfo.pages[nPage].fields.splice(this.Pos, 1);
                } else {
                    oDocument.widgetsParents.splice(oDocument.widgetsParents.indexOf(oItem), 1);
                }
            }
        }
    } else {
        // Undo removal by adding items back
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsForm()) {
                if (oItem.IsWidget()) {
                    let nPage = oItem.GetPage();
                    oItem.AddToRedraw();
                    oDocument.widgets.push(oItem);
                    oViewer.pagesInfo.pages[nPage].fields.splice(this.Pos, 0, oItem);
                } else {
                    oDocument.widgetsParents.push(oItem);
                }
            }
        }
    }

    oDocument.mouseDownAnnot = null;
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentFieldsContent.prototype.Redo = function()
{
    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();

    if (this.IsAdd()) {
        // Redo addition by adding items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsForm()) {
                if (oItem.IsWidget()) {
                    let nPage = oItem.GetPage();
                    oItem.AddToRedraw();
                    oDocument.widgets.push(oItem);
                    oViewer.pagesInfo.pages[nPage].fields.splice(this.Pos, 0, oItem);
                } else {
                    oDocument.widgetsParents.push(oItem);
                }
            }
        }
    } else {
        // Redo removal by removing items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsForm()) {
                if (oItem.IsWidget()) {
                    oDocument.RemoveForm(oItem);
                } else {
                    oDocument.widgetsParents.splice(oDocument.widgetsParents.indexOf(oItem), 1);
                }
            }
        }
    }

    oDocument.mouseDownAnnot = null;
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentFieldsContent.prototype.private_InsertInArrayLoad = function()
{
    if (this.Items.length <= 0)
        return;

    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();
    let oContentChanges = this.private_GetContentChanges();

    for (let i = 0; i < this.Items.length; ++i) {
        let oItem = this.Items[i];

        // Adjust position based on content changes
        let nPos = oContentChanges.Check(AscCommon.contentchanges_Add, true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
        if (nPos === false) continue;

        if (oItem.IsForm()) {
            if (oItem.IsWidget()) {
                let nPage = oItem.GetPage();

                // Insert into document widgets array
                nPos = Math.min(nPos, oDocument.widgets.length);
                oDocument.widgets.splice(nPos, 0, oItem);

                // Insert into viewer fields array
                let fieldsArray = oViewer.pagesInfo.pages[nPage].fields;
                nPos = Math.min(nPos, fieldsArray.length);
                fieldsArray.splice(nPos, 0, oItem);

                oItem.AddToRedraw();
            } else {
                nPos = Math.min(nPos, oDocument.widgetsParents.length);
                oDocument.widgetsParents.splice(nPos, 0, oItem);
            }
        }
    }

    oDocument.mouseDownAnnot = null;
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentFieldsContent.prototype.private_RemoveInArrayLoad = function()
{
    if (this.Items.length <= 0)
        return;

    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();
    let oContentChanges = this.private_GetContentChanges();

    // Remove items in reverse order to maintain indices
    for (let i = this.Items.length - 1; i >= 0; --i) {
        let oItem = this.Items[i];

        // Adjust position based on content changes
        let nPos = oContentChanges.Check(AscCommon.contentchanges_Remove,  true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
        if (nPos === false) continue;

        if (oItem.IsForm()) {
            if (oItem.IsWidget()) {
                let nPage = oItem.GetPage();

                oItem.AddToRedraw();

                // Remove from document widgets array
                let indexInWidgets = oDocument.widgets.indexOf(oItem);
                if (indexInWidgets !== -1)
                    oDocument.widgets.splice(indexInWidgets, 1);

                // Remove from viewer fields array
                let fieldsArray = oViewer.pagesInfo.pages[nPage].fields;
                let indexInFields = fieldsArray.indexOf(oItem);
                if (indexInFields !== -1)
                    fieldsArray.splice(indexInFields, 1);
                
            } else {
                let indexInParents = oDocument.widgetsParents.indexOf(oItem);
                if (indexInParents !== -1)
                    oDocument.widgetsParents.splice(indexInParents, 1);
            }
        }
    }

    oDocument.mouseDownAnnot = null;
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentFieldsContent.prototype.private_GetContentChanges = function() {
    return this.Class.fieldsContentChanges;
};

/**
 * @constructor
 * @extends {AscDFH.CChangesDrawingsContent}
 */
function CChangesPDFDocumentDrawingsContent(Class, Pos, Items, bAdd)
{
    AscDFH.CChangesDrawingsContent.call(this, Class, this.Type, Pos, Items, bAdd);
}
CChangesPDFDocumentDrawingsContent.prototype = Object.create(AscDFH.CChangesDrawingsContent.prototype);
CChangesPDFDocumentDrawingsContent.prototype.constructor = CChangesPDFDocumentDrawingsContent;
CChangesPDFDocumentDrawingsContent.prototype.Type = AscDFH.historyitem_PDF_Document_DrawingsContent;
CChangesPDFDocumentDrawingsContent.prototype.IsContentChange = function(){
    return true;
};

CChangesPDFDocumentDrawingsContent.prototype.Undo = function()
{
    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();

    if (this.IsAdd()) {
        // Undo addition by removing items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsDrawing()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.drawings.splice(oDocument.drawings.indexOf(oItem), 1);
                oViewer.pagesInfo.pages[nPage].drawings.splice(this.Pos, 1);
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    } else {
        // Undo removal by adding items back
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsDrawing()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.drawings.push(oItem);
                oViewer.pagesInfo.pages[nPage].drawings.splice(this.Pos, 0, oItem);
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentDrawingsContent.prototype.Redo = function()
{
    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();

    if (this.IsAdd()) {
        // Redo addition by adding items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsDrawing()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.drawings.push(oItem);
                oViewer.pagesInfo.pages[nPage].drawings.splice(this.Pos, 0, oItem);
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    } else {
        // Redo removal by removing items
        for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
        {
            let oItem = this.Items[nIndex];
            if (oItem.IsDrawing()) {
                let nPage = oItem.GetPage();
                oItem.AddToRedraw();
                oDocument.drawings.splice(oDocument.drawings.indexOf(oItem), 1);
                oViewer.pagesInfo.pages[nPage].drawings.splice(this.Pos, 1);
                oViewer.DrawingObjects.resetSelection();
                oItem.AddToRedraw();
            }
        }
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentDrawingsContent.prototype.private_InsertInArrayLoad = function()
{
    if (this.Items.length <= 0)
        return;

    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();
    let oContentChanges = this.private_GetContentChanges();

    for (let i = 0; i < this.Items.length; ++i) {
        let oItem = this.Items[i];
        let nPage = oItem.GetPage();

        // Adjust position based on content changes
        let nPos = oContentChanges.Check(AscCommon.contentchanges_Add, true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
        if (nPos === false) continue;

        // Ensure position is within bounds
        nPos = Math.min(nPos, oDocument.drawings.length);

        // Insert into document drawings array
        oDocument.drawings.splice(nPos, 0, oItem);

        // Insert into viewer drawings array
        let drawingsArray = oViewer.pagesInfo.pages[nPage].drawings;
        nPos = Math.min(nPos, drawingsArray.length);
        drawingsArray.splice(nPos, 0, oItem);

        oViewer.DrawingObjects.resetSelection();
        oItem.AddToRedraw();
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentDrawingsContent.prototype.private_RemoveInArrayLoad = function()
{
    if (this.Items.length <= 0)
        return;

    let oDocument = this.Class;
    let oViewer = Asc.editor.getDocumentRenderer();
    let oContentChanges = this.private_GetContentChanges();

    // Remove items in reverse order to maintain indices
    for (let i = this.Items.length - 1; i >= 0; --i) {
        let oItem = this.Items[i];
        let nPage = oItem.GetPage();

        // Adjust position based on content changes
        let nPos = oContentChanges.Check(AscCommon.contentchanges_Remove,  true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
        if (nPos === false) continue;

        oItem.AddToRedraw();
        // Remove from document drawings array
        let indexInDrawings = oDocument.drawings.indexOf(oItem);
        if (indexInDrawings !== -1)
            oDocument.drawings.splice(indexInDrawings, 1);

        // Remove from viewer drawings array
        let drawingsArray = oViewer.pagesInfo.pages[nPage].drawings;
        let indexInDrawingsArray = drawingsArray.indexOf(oItem);
        if (indexInDrawingsArray !== -1)
            drawingsArray.splice(indexInDrawingsArray, 1);

        oViewer.DrawingObjects.resetSelection();
    }

    oDocument.SetMouseDownObject(null);
    oDocument.private_UpdateTargetForCollaboration(true);
};
CChangesPDFDocumentDrawingsContent.prototype.private_GetContentChanges = function() {
    return this.Class.drawingsContentChanges;
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesPDFDocumentPagesContent(Class, Pos, Items, bAdd) {
	AscDFH.CChangesDrawingsContent.call(this, Class, this.Type, Pos, Items, bAdd);
}
CChangesPDFDocumentPagesContent.prototype = Object.create(AscDFH.CChangesDrawingsContent.prototype);
CChangesPDFDocumentPagesContent.prototype.constructor = CChangesPDFDocumentPagesContent;
CChangesPDFDocumentPagesContent.prototype.Type = AscDFH.historyitem_PDF_Document_PagesContent;

CChangesPDFDocumentPagesContent.prototype.IsContentChange = function() {
	return true;
};

CChangesPDFDocumentPagesContent.prototype.Undo = function() {
	let oDocument = this.Class;
	let oDrDoc = oDocument.GetDrawingDocument();

	if (this.IsAdd()) {
		// Отменяем добавление страниц, удаляя их
		for (let nIndex = this.Items.length - 1; nIndex >= 0; --nIndex) {
			let nPos = true !== this.UseArray ? this.Pos : this.PosArray[nIndex];
			oDocument.RemovePage(nPos);
		}
	} else {
		// Отменяем удаление страниц, добавляя их обратно
		for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex) {
			let nPos = true !== this.UseArray ? this.Pos : this.PosArray[nIndex];
			let oPage = this.Items[nIndex];
			oDocument.AddPage(nPos, oPage);
		}
	}

	oDocument.SetMouseDownObject(null);
	oDrDoc.TargetEnd();
};

CChangesPDFDocumentPagesContent.prototype.Redo = function() {
	let oDocument = this.Class;
	let oDrDoc = oDocument.GetDrawingDocument();

	if (this.IsAdd()) {
		// Повторяем добавление страниц
		for (let nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex) {
			let nPos = true !== this.UseArray ? this.Pos : this.PosArray[nIndex];
			let oPage = this.Items[nIndex];
			oDocument.AddPage(nPos, oPage);
		}
	} else {
		// Повторяем удаление страниц
		for (let nIndex = this.Items.length - 1; nIndex >= 0; --nIndex) {
			let nPos = true !== this.UseArray ? this.Pos : this.PosArray[nIndex];
			oDocument.RemovePage(nPos);
		}
	}

	oDocument.SetMouseDownObject(null);
	oDrDoc.TargetEnd();
};

CChangesPDFDocumentPagesContent.prototype.private_InsertInArrayLoad = function() {
	if (this.Items.length <= 0)
		return;

	let oDocument = this.Class;
	let oDrDoc = oDocument.GetDrawingDocument();
	let oContentChanges = this.private_GetContentChanges();

	for (let i = 0; i < this.Items.length; ++i) {
		let oPage = this.Items[i];
		let nPos = oContentChanges.Check(AscCommon.contentchanges_Add, true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
		if (nPos === false) continue;

		nPos = Math.min(nPos, oDocument.Viewer.pagesInfo.pages.length);
		oDocument.AddPage(nPos, oPage);
	}

	oDocument.SetMouseDownObject(null);
	oDrDoc.TargetEnd();
};

CChangesPDFDocumentPagesContent.prototype.private_RemoveInArrayLoad = function() {
	if (this.Items.length <= 0)
		return;

	let oDocument = this.Class;
	let oDrDoc = oDocument.GetDrawingDocument();
	let oContentChanges = this.private_GetContentChanges();

	for (let i = this.Items.length - 1; i >= 0; --i) {
		let nPos = oContentChanges.Check(AscCommon.contentchanges_Remove, true !== this.UseArray ? this.Pos + i : this.PosArray[i]);
		if (nPos === false) continue;

		oDocument.RemovePage(nPos);
	}

	oDocument.SetMouseDownObject(null);
	oDrDoc.TargetEnd();
};

CChangesPDFDocumentPagesContent.prototype.private_GetContentChanges = function() {
	return this.Class.pagesContentChanges;
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesPDFDocumentRotatePage(Class, nPage, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
	this.Page = nPage;
}
CChangesPDFDocumentRotatePage.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesPDFDocumentRotatePage.prototype.constructor = CChangesPDFDocumentRotatePage;
CChangesPDFDocumentRotatePage.prototype.Type = AscDFH.historyitem_PDF_Document_RotatePage;
CChangesPDFDocumentRotatePage.prototype.private_SetValue = function(Value)
{
	let oDoc = this.Class;
	oDoc.SetPageRotate(this.Page, Value);
};
CChangesPDFDocumentRotatePage.prototype.WriteToBinary = function(Writer)
{
	let nFlags = 0;

	if (undefined === this.Page)
		nFlags |= 1;

	if (undefined === this.New)
		nFlags |= 2;

	if (undefined === this.Old)
		nFlags |= 4;

	Writer.WriteLong(nFlags);

	if (undefined !== this.Page)
		Writer.WriteLong(this.Page);

	if (undefined !== this.New)
		Writer.WriteLong(this.New);

	if (undefined !== this.Old)
		Writer.WriteLong(this.Old);
};
CChangesPDFDocumentRotatePage.prototype.ReadFromBinary = function(Reader)
{
	let nFlags = Reader.GetLong();
	
	if (nFlags & 1)
		this.Page = undefined;
	else
		this.Page = Reader.GetLong();
	
	if (nFlags & 2)
		this.New = undefined;
	else
		this.New = Reader.GetLong();
	
	if (nFlags & 4)
		this.Old = undefined;
	else
		this.Old = Reader.GetLong();
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesPDFDocumentPageWidth(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesPDFDocumentPageWidth.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesPDFDocumentPageWidth.prototype.constructor = CChangesPDFDocumentPageWidth;
CChangesPDFDocumentPageWidth.prototype.Type = AscDFH.historyitem_PDF_Document_PageWidth;
CChangesPDFDocumentPageWidth.prototype.private_SetValue = function(Value)
{
	let oPage = this.Class;
	oPage.SetWidth(Value);
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesPDFDocumentPageHeight(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesPDFDocumentPageHeight.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesPDFDocumentPageHeight.prototype.constructor = CChangesPDFDocumentPageHeight;
CChangesPDFDocumentPageHeight.prototype.Type = AscDFH.historyitem_PDF_Document_PageHeight;
CChangesPDFDocumentPageHeight.prototype.private_SetValue = function(Value)
{
	let oPage = this.Class;
	oPage.SetHeight(Value);
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesPDFDocumentRecognizePage(Class, nPage, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
	this.Page = nPage;
}
CChangesPDFDocumentRecognizePage.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesPDFDocumentRecognizePage.prototype.constructor = CChangesPDFDocumentRecognizePage;
CChangesPDFDocumentRecognizePage.prototype.Type = AscDFH.historyitem_PDF_Document_RecognizePage;
CChangesPDFDocumentRecognizePage.prototype.WriteToBinary = function(Writer)
{
	let nFlags = 0;

	if (undefined !== this.Page)
		nFlags |= 1;
	
	if (true === this.New)
		nFlags |= 2;
	
	if (true === this.Old)
		nFlags |= 4;
	
	Writer.WriteLong(nFlags);
	if (undefined !== this.Page)
		Writer.WriteLong(this.Page);
};
CChangesPDFDocumentRecognizePage.prototype.ReadFromBinary = function(Reader)
{
	let nFlags = Reader.GetLong();
	
	if (nFlags & 1)
		this.Page = Reader.GetLong();
	else
		this.Page = undefined;
	
	this.New = !!(nFlags & 2);
	this.Old = !!(nFlags & 4);
};
CChangesPDFDocumentRecognizePage.prototype.private_SetValue = function(bRecognize)
{
	let oDoc = this.Class;
	let oFile = oDoc.Viewer.file;
	let nPage = this.Page;

	oFile.pages[nPage].isConvertedToShapes = bRecognize;
    if (oDoc.Viewer.drawingPages[nPage]) {
        delete oDoc.Viewer.drawingPages[nPage].Image;
    }

	oDoc.Viewer.paint(function() {
		oDoc.Viewer.thumbnails._repaintPage(nPage);
	});
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringProperty}
 */
function CChangesPDFDocumentSetDocument(Class, Old, New)
{
	let oldId = Old && Old.Get_Id ? Old.Get_Id() : undefined;
	let newId = New && New.Get_Id ? New.Get_Id() : undefined;
	AscDFH.CChangesBaseStringProperty.call(this, Class, oldId, newId);
}
CChangesPDFDocumentSetDocument.prototype = Object.create(AscDFH.CChangesBaseStringProperty.prototype);
CChangesPDFDocumentSetDocument.prototype.constructor = CChangesPDFDocumentSetDocument;
CChangesPDFDocumentSetDocument.prototype.Type = AscDFH.historyitem_PDF_Document_SetDocument;
CChangesPDFDocumentSetDocument.prototype.private_SetValue = function(value)
{
	let doc = AscCommon.g_oTableId.Get_ById(value);
	this.Class.SetDocument(doc);
};
